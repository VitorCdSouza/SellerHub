# SellerHub

A avaliação das telas e a fila de trabalho do front-end estão em [web/TODO.md](web/TODO.md), com dependências separadas para o back-end. Consulte os bloqueios registrados em 05/11/2026: as instruções de login/proxy abaixo ainda precisam ser reconciliadas com o código atual.

Hub de integração entre marketplaces desenvolvido como TCC. No estado atual, o sistema tem apenas o fluxo de login: **Angular → API REST em Go → PostgreSQL**. O usuário informa e-mail e senha, a API consulta o banco e, se as credenciais conferem, abre uma sessão com um JWT gravado em cookie.

Ainda não há rota protegida: a verificação do cookie entra junto da primeira tela que exigir login.

## Organização

```text
SellerHub/
├── .env.example                   variáveis usadas pela API e pelo banco
├── Makefile                       atalhos para subir banco, API e web
├── db/
│   ├── docker-compose.yaml        PostgreSQL via Docker (opcional)
│   ├── estrutura.sql              tabelas; também é o schema do sqlc
│   └── dados.sql                  dados de desenvolvimento
├── api/                           back-end Go
├── web/                           front-end Angular
└── documentacao/                  documento técnico em LaTeX (abnTeX2)
```

Fluxo do login:

1. O componente Angular valida o formulário e envia `POST /api/login`, que o servidor de desenvolvimento do Angular repassa para a API.
2. O controller Go decodifica o JSON e repassa e-mail e senha ao service.
3. O service normaliza o e-mail (minúsculas, sem espaços nas pontas), valida os dados e busca o hash com a consulta gerada pelo sqlc.
4. `bcrypt.CompareHashAndPassword` compara a senha com o hash.
5. Se a senha confere, o controller gera um JWT com o id do usuário e o grava no cookie `sessao`.
6. O controller responde com o status HTTP e o JSON; o Angular exibe a mensagem.

## Pré-requisitos

- Go 1.27 ou superior
- Node.js 24 e npm
- PostgreSQL 17 ou superior, instalado localmente **ou** Docker com Compose
- make (opcional, os comandos equivalentes estão em cada seção)

## Configuração

Na raiz do projeto, copie o exemplo, defina uma senha para o banco e gere o segredo do JWT com `openssl rand -hex 32`:

```bash
cp .env.example .env
```

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USER=sellerhub
DB_PASSWORD=defina_uma_senha_local
DB_NAME=sellerhub
DB_SSLMODE=disable
JWT_SECRET=gere_com_openssl_rand_hex_32
```

O `.env` é ignorado pelo Git. Use aspas simples se a senha tiver caracteres como `#` ou `$`. Se a porta 5432 já estiver em uso por outro PostgreSQL, troque `DB_PORT` (por exemplo, `5433`).

## Banco de dados

### Com Docker

```bash
make db
```

O Compose cria o banco com o usuário, a senha e o nome definidos no `.env` e executa `db/estrutura.sql` e `db/dados.sql`. Esses scripts só rodam quando o volume é criado. Depois de mudar o schema ou as credenciais, recrie o banco:

```bash
make reset-db   # apaga o volume e recria do zero
make stop-db    # para o banco mantendo os dados
```

### Com PostgreSQL local

Como administrador (`psql -U postgres`):

```sql
CREATE ROLE sellerhub LOGIN PASSWORD 'mesma_senha_do_env';
CREATE DATABASE sellerhub OWNER sellerhub;
```

Depois, a partir da raiz:

```bash
psql -h localhost -U sellerhub -d sellerhub -v ON_ERROR_STOP=1 -f db/estrutura.sql
psql -h localhost -U sellerhub -d sellerhub -v ON_ERROR_STOP=1 -f db/dados.sql
```

Para mudar o schema, edite `db/estrutura.sql` e recrie o banco. Não há ferramenta de migrations, e o banco não deve ser alterado manualmente. A tabela `CAD_USUARIO` garante a normalização do e-mail com a constraint `email_normalizado`.

## Executar tudo

```bash
make install   # primeira vez: dependências do Go e do npm
make run       # sobe API e web juntos; ctrl+c encerra os dois
```

Abra [http://localhost:4200](http://localhost:4200) e entre com o usuário de desenvolvimento:

| Campo  | Valor             |
| ------ | ----------------- |
| E-mail | `teste@email.com` |
| Senha  | `123456`          |

## API (Go)

### Estrutura

```text
api/
├── cmd/main.go            inicialização e rotas
├── internal/
│   ├── controller/        HTTP e JSON
│   ├── service/           regras de negócio
│   └── db/                conexão e código gerado pelo sqlc
└── sqlc.yaml
```

O controller traduz HTTP, o service concentra a regra de negócio e o pacote `db` cuida da persistência. As rotas usam `net/http` da biblioteca padrão, sem framework web; o acesso ao banco usa `pgx` com consultas geradas pelo sqlc, sem ORM.

### Executar

```bash
cd api
go run ./cmd
```

A API carrega o `.env` da raiz (`../.env`, relativo a `api/`) sem substituir variáveis já definidas no terminal. Ela não inicia sem `JWT_SECRET` com pelo menos 32 caracteres, verifica a conexão com o banco antes de iniciar e atende em `http://localhost:8080`, somente na máquina local. Reinicie a API depois de mudar o `.env`.

### Endpoint

```bash
curl -i -X POST http://localhost:8080/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"teste@email.com","password":"123456"}'
```

```json
{"success":true,"message":"Login realizado com sucesso"}
```

| Status | Situação |
| --- | --- |
| `200` | Credenciais válidas; a resposta traz o cookie `sessao` |
| `400` | JSON inválido, campos vazios, senha acima de 72 bytes ou corpo acima de 4 KiB |
| `401` | E-mail não cadastrado ou senha incorreta (mesma mensagem nos dois casos) |
| `405` | Método diferente de POST |
| `500` | Falha interna, como banco indisponível |

A senha é limitada a 72 **bytes** porque o bcrypt ignora o que passa disso; caracteres acentuados ocupam mais de um byte.

O cookie `sessao` guarda um JWT assinado com HS256 e `JWT_SECRET`, com validade de 8 horas. É `HttpOnly`, então o JavaScript da página não consegue lê-lo, e `SameSite=Strict`, então o navegador não o envia em requisições vindas de outros sites. Trocar o `JWT_SECRET` invalida todas as sessões abertas.

A API não libera CORS: o Angular chama `/api` na própria origem (`localhost:4200`) e o servidor de desenvolvimento repassa para `localhost:8080`, conforme `web/proxy.conf.json`. Por isso as rotas da API começam com `/api`.

### Consultas SQL (sqlc)

As consultas ficam em `api/internal/db/queries.sql`. Depois de alterar esse arquivo ou `db/estrutura.sql`, gere o código Go novamente:

```bash
cd api
sqlc generate
```

Sem o sqlc instalado, o mesmo comando roda pelo Go: `go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1 generate`.

Os arquivos `db.go`, `models.go` e `queries.sql.go` são gerados e não devem ser editados à mão.

### Verificar

```bash
cd api
go vet ./...
```

## Web (Angular)

### Estrutura

```text
web/src/app/
├── login/                 formulário, validação, carregamento e mensagens
├── services/
│   └── auth.service.ts    envia e-mail e senha para POST /api/login
├── app.config.ts          configuração de HTTP e rotas
└── app.routes.ts          carrega a tela de login sob demanda
```

O componente de login usa signals e `OnPush`. Durante a requisição, impede novos envios; ao concluir, limpa a senha. Labels, avisos por campo e regiões de mensagem dão suporte à navegação por teclado e a leitores de tela. A senha não é guardada no navegador, e o token da sessão fica só no cookie `HttpOnly`, fora do alcance do código Angular.

As chamadas usam caminhos relativos (`/api/...`). O `ng serve` repassa esses caminhos para a API conforme `proxy.conf.json`, configurado em `angular.json`.

### Executar

```bash
cd web
npm ci
npm start
```

A tela abre em [http://localhost:4200](http://localhost:4200). Para o login funcionar, a API e o banco precisam estar rodando.

### Verificar

```bash
cd web
npm test -- --watch=false
npm run build
```

Os testes usam HTTP simulado para conferir o formulário, o contrato do `AuthService`, o sucesso, as credenciais inválidas e a indisponibilidade da API. O build fica em `web/dist/SellerHub`.

## Documentação (LaTeX)

O documento técnico fica em `documentacao/` e usa a classe [abnTeX2](https://github.com/abntex/abntex2), com os capítulos do roteiro de proposta do Projeto Integrado de Extensão.

```text
documentacao/
├── documento.tex          arquivo principal: ordem de capa, listas, capítulos e referências
├── referencias.bib        base BibTeX das referências
├── configuracoes/
│   ├── preambulo.tex      pacotes, fontes e estilo dos títulos
│   ├── metadados.tex      título, autores, instituição, curso, orientador
│   ├── capa.tex           layout da capa e da folha de rosto
│   └── comandos.tex       comandos próprios (\orientacao, \pendente, \diagrama)
├── pre-textual/           resumo, abstract e lista de siglas
├── capitulos/             um arquivo por capítulo
├── pos-textual/           referências, apêndices e anexos
└── imagens/               figuras e diagramas; logo-ifsp.pdf é a marca oficial do Campus São Paulo
```

### Compilar

Requer uma distribuição TeX com `latexmk`. No Fedora:

```bash
sudo dnf install latexmk texlive-scheme-medium texlive-abntex2
```

```bash
make doc        # gera documentacao/documento.pdf
make doc-clean  # remove auxiliares e o PDF
```

Para recompilar a cada arquivo salvo, rode `latexmk -pvc documento.tex` dentro de `documentacao/`. O `.latexmkrc` da pasta já configura pdfLaTeX e BibTeX, e a extensão LaTeX Workshop do VS Code o usa sem configuração extra. No Overleaf, envie a pasta `documentacao/` em `.zip` (New Project > Upload Project) e defina `documento.tex` como documento principal.

### Comandos do template

- `\sistema{}`: nome do sistema, definido em `configuracoes/metadados.tex`.
- `\orientacao{texto}`: texto-guia em cinza itálico com o que cada seção deve conter. Apague o comando quando a seção for escrita. Para gerar o PDF sem nenhum deles, troque `\mostrarorientacoestrue` por `\mostrarorientacoesfalse` em `configuracoes/comandos.tex`.
- `\pendente{texto}`: dado ainda não definido, em vermelho.
- `\diagrama{legenda}{rotulo}`: moldura reservada para um diagrama ainda não desenhado; já entra na lista de ilustrações e pode ser citado com `\ref{fig:rotulo}`. Quando a imagem existir, substitua por:

```latex
\begin{figure}[htbp]
  \centering
  \caption{Diagrama de casos de uso}
  \label{fig:casos-de-uso}
  \includegraphics[width=\textwidth]{imagens/casos-de-uso.pdf}
  \fonte{Elaborado pelos autores.}
\end{figure}
```

### Citações e convenções

Estilo autor-data (`abntex2cite`, opção `alf`). Cadastre a fonte em `referencias.bib` e cite com `\cite{go}`, que gera (THE GO AUTHORS, 2026), ou `\citeonline{go}`, que gera THE GO AUTHORS (2026). Só aparecem nas referências as entradas citadas pelo menos uma vez. Autor institucional vai entre chaves duplas e em caixa alta, como `{{GOOGLE}}`, para sair assim na lista de referências (NBR 6023).

- Um capítulo por arquivo em `capitulos/`, incluído em `documento.tex`.
- Rótulos com prefixo `cap:`, `fig:` e `tab:`; `\autoref{tab:tecnologias}` já escreve "Tabela 1".
- Figuras e tabelas com legenda acima (`\caption`) e fonte abaixo (`\fonte`), como pede a ABNT.
- Imagens em `documentacao/imagens/`, de preferência em PDF, para não perder resolução.

## Problemas comuns

- **`password authentication failed`:** a senha do `.env` não bate com a do banco. No Docker, as credenciais só são aplicadas na criação do volume; rode `make reset-db`.
- **`connection refused`:** o banco não está rodando ou `DB_PORT` está errado. Confira com `docker ps`.
- **`port is already allocated` ao subir o banco:** outro serviço usa a porta; troque `DB_PORT` no `.env`.
- **`404` ou `504` em `/api/...` no navegador:** a API não está rodando, ou o `ng serve` foi iniciado antes da configuração do proxy; reinicie o `npm start`.
- **API encerra com `JWT_SECRET ausente`:** gere o segredo com `openssl rand -hex 32` e coloque no `.env`.
- **PowerShell bloqueia `npm.ps1`:** use `npm.cmd` nos mesmos comandos.
