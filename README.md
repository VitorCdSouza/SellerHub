# SalesHub

Hub de integração entre marketplaces desenvolvido como TCC. No estado atual, o sistema tem apenas o fluxo de login: **Angular → API REST em Go → PostgreSQL**. O usuário informa e-mail e senha, a API consulta o banco e devolve sucesso ou credenciais inválidas.

O sucesso ainda não cria sessão, cookie ou token.

## Organização

```text
SalesHub/
├── .env.example                   variáveis usadas pela API e pelo banco
├── Makefile                       atalhos para subir banco, API e web
├── db/
│   ├── docker-compose.yaml        PostgreSQL via Docker (opcional)
│   ├── estrutura.sql              tabelas; também é o schema do sqlc
│   └── dados.sql                  dados de desenvolvimento
├── api/                           back-end Go
└── web/                           front-end Angular
```

Fluxo do login:

1. O componente Angular valida o formulário e envia `POST http://localhost:8080/login`.
2. O controller Go decodifica o JSON e repassa e-mail e senha ao service.
3. O service normaliza o e-mail (minúsculas, sem espaços nas pontas), valida os dados e busca o hash com a consulta gerada pelo sqlc.
4. `bcrypt.CompareHashAndPassword` compara a senha com o hash.
5. O controller responde com o status HTTP e o JSON; o Angular exibe a mensagem.

## Pré-requisitos

- Go 1.27 ou superior
- Node.js 24 e npm
- PostgreSQL 17 ou superior, instalado localmente **ou** Docker com Compose
- make (opcional, os comandos equivalentes estão em cada seção)

## Configuração

Na raiz do projeto, copie o exemplo e defina uma senha para o banco:

```bash
cp .env.example .env
```

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USER=saleshub
DB_PASSWORD=defina_uma_senha_local
DB_NAME=saleshub
DB_SSLMODE=disable
FRONTEND_ORIGIN=http://localhost:4200
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
CREATE ROLE saleshub LOGIN PASSWORD 'mesma_senha_do_env';
CREATE DATABASE saleshub OWNER saleshub;
```

Depois, a partir da raiz:

```bash
psql -h localhost -U saleshub -d saleshub -v ON_ERROR_STOP=1 -f db/estrutura.sql
psql -h localhost -U saleshub -d saleshub -v ON_ERROR_STOP=1 -f db/dados.sql
```

Para mudar o schema, edite `db/estrutura.sql` e recrie o banco. Não há ferramenta de migrations, e o banco não deve ser alterado manualmente. A tabela `usuarios` garante a normalização do e-mail com a constraint `email_normalizado`.

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
├── cmd/main.go            inicialização, rotas e CORS
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

A API carrega o `.env` da raiz (`../.env`, relativo a `api/`) sem substituir variáveis já definidas no terminal. Ela verifica a conexão com o banco antes de iniciar e atende em `http://localhost:8080`, somente na máquina local. Reinicie a API depois de mudar o `.env`.

### Endpoint

```bash
curl -X POST http://localhost:8080/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"teste@email.com","password":"123456"}'
```

```json
{"success":true,"message":"Login realizado com sucesso"}
```

| Status | Situação |
| --- | --- |
| `200` | Credenciais válidas |
| `400` | JSON inválido, campos vazios, senha acima de 72 bytes ou corpo acima de 4 KiB |
| `401` | E-mail não cadastrado ou senha incorreta (mesma mensagem nos dois casos) |
| `405` | Método diferente de POST |
| `500` | Falha interna, como banco indisponível |

A senha é limitada a 72 **bytes** porque o bcrypt ignora o que passa disso; caracteres acentuados ocupam mais de um byte.

CORS é liberado somente para `FRONTEND_ORIGIN`. Abra o Angular por `localhost`, já que `http://127.0.0.1:4200` é outra origem.

### Consultas SQL (sqlc)

As consultas ficam em `api/internal/db/queries.sql`. Depois de alterar esse arquivo ou `db/estrutura.sql`, gere o código Go novamente:

```bash
cd api
sqlc generate
```

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
│   └── auth.service.ts    envia e-mail e senha para POST /login
├── app.config.ts          configuração de HTTP e rotas
└── app.routes.ts          carrega a tela de login sob demanda
```

O componente de login usa signals e `OnPush`. Durante a requisição, impede novos envios; ao concluir, limpa a senha. Labels, avisos por campo e regiões de mensagem dão suporte à navegação por teclado e a leitores de tela. Não há sessão nem armazenamento de senha no navegador.

O endereço da API (`http://localhost:8080`) está fixo no `AuthService`, já que o sistema roda na mesma máquina.

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

## Problemas comuns

- **`password authentication failed`:** a senha do `.env` não bate com a do banco. No Docker, as credenciais só são aplicadas na criação do volume; rode `make reset-db`.
- **`connection refused`:** o banco não está rodando ou `DB_PORT` está errado. Confira com `docker ps`.
- **`port is already allocated` ao subir o banco:** outro serviço usa a porta; troque `DB_PORT` no `.env`.
- **Erro de CORS no navegador:** use exatamente `http://localhost:4200` e reinicie a API depois de mudar o `.env`.
- **PowerShell bloqueia `npm.ps1`:** use `npm.cmd` nos mesmos comandos.
