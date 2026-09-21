# SellerHub — PoC de login

Demonstração acadêmica de **Angular → API REST em Go → PostgreSQL**. O usuário informa e-mail e senha; a API consulta o banco e devolve uma mensagem de sucesso ou credenciais inválidas.

O escopo é somente a verificação de credenciais. O sucesso não cria sessão, cookie ou token e não libera um painel. Não há cadastro, recuperação de senha ou integração com marketplaces.

## Organização e fluxo

```text
SellerHub/                         raiz do repositório
├── SellerHub/                     front-end Angular
│   └── src/app/
│       ├── login/                 formulário, estado e mensagens
│       ├── services/auth.service.ts
│       ├── app.config.ts          configuração HTTP e rotas
│       └── app.routes.ts          carregamento da tela de login
├── SellerBack/                    back-end Go
│   ├── cmd/main.go                inicialização
│   ├── cmd/gerar-hash/main.go      utilitário local de bcrypt
│   ├── internal/
│   │   ├── handler/               HTTP, JSON e CORS
│   │   ├── service/               validação e comparação de senha
│   │   ├── repository/            consulta SQL parametrizada
│   │   └── database/              conexão por variáveis de ambiente
│   ├── sql/                       criação da tabela e usuário de teste
│   ├── .env.example
│   ├── go.mod
│   └── README.md
└── README.md
```

1. O componente Angular valida o formulário e chama `AuthService.entrar()`.
2. O service envia JSON ao `POST http://localhost:8080/login` com `HttpClient`.
3. O handler Go confere método, tipo de conteúdo e formato JSON.
4. O service normaliza o e-mail e valida os dados. A senha não é aparada nem convertida.
5. O repository executa `SELECT password FROM users WHERE email = $1`. O parâmetro mantém os dados separados do SQL.
6. O service usa `bcrypt.CompareHashAndPassword` para comparar a senha com o hash retornado.
7. O handler retorna HTTP e JSON; o Angular exibe a mensagem, reabilita o formulário e limpa a senha.

As camadas são pacotes do mesmo programa Go. `net/http` dispensa um framework web; `pgx` executa uma consulta SQL direta. Não há ORM, geração de consultas, ferramenta de migrations ou contêiner. Os scripts SQL são versionados e executados manualmente nesta PoC.

## Pré-requisitos

- Node.js 24 e npm, usados com o Angular 21.2 existente.
- Go 1.27 ou superior, conforme `SellerBack/go.mod`.
- PostgreSQL 17 ou superior, com servidor e ferramentas de linha de comando (`psql`).

No Windows, obtenha o instalador pelo [site oficial do PostgreSQL](https://www.postgresql.org/download/windows/). Instale o servidor e as ferramentas de linha de comando; pgAdmin é opcional. Para esta PoC, use a porta local `5432` e defina sua própria senha de administrador `postgres`. Não são necessários complementos do Stack Builder.

Os comandos abaixo usam PowerShell e partem da raiz externa do repositório. Caso os executáveis não sejam encontrados, acrescente **apenas ao terminal atual** os diretórios instalados (ajuste a versão do PostgreSQL):

```powershell
$env:Path += ';C:\Program Files\Go\bin;C:\Program Files\PostgreSQL\17\bin'
go version
psql --version
node --version
```

## 1. Preparar o banco

**Alternativa para os integrantes com PostgreSQL 18:** restaure o [dump pronto da PoC](SellerBack/dump/README.md), que já inclui tabela e usuário de teste. Escolha a restauração do dump ou os scripts abaixo; não aplique ambos sobre as mesmas tabelas. O guia do dump explica como definir as credenciais locais de cada integrante.

Com o serviço PostgreSQL iniciado, conecte como administrador:

```powershell
psql -h localhost -p 5432 -U postgres -d postgres
```

Dentro do `psql`, execute uma vez:

```sql
CREATE ROLE sellerhub LOGIN;
\password sellerhub
CREATE DATABASE sellerhub_poc OWNER sellerhub;
\q
```

O comando `\password` solicita uma senha local sem colocá-la no script SQL. Essa é a senha de **conexão ao banco**, diferente da senha do usuário da tela de login.

De volta ao PowerShell, execute os scripts com o proprietário do banco:

```powershell
psql -h localhost -p 5432 -U sellerhub -d sellerhub_poc -v ON_ERROR_STOP=1 -f .\SellerBack\sql\01_criar_tabela.sql
psql -h localhost -p 5432 -U sellerhub -d sellerhub_poc -v ON_ERROR_STOP=1 -f .\SellerBack\sql\02_usuario_teste.sql
```

A tabela `users` contém `id`, `email` único e `password` com hash bcrypt. O segundo script insere o usuário de demonstração. Reexecutá-lo não altera uma conta já existente com o mesmo e-mail.

## 2. Iniciar a API Go

Em um terminal, a partir da raiz:

```powershell
cd SellerBack
Copy-Item .env.example .env
```

Edite `.env`: substitua `DB_PASSWORD` pela senha escolhida para a role `sellerhub`. Copie o exemplo somente na primeira configuração, para não sobrescrever um `.env` existente.

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USER=sellerhub
DB_PASSWORD=defina_uma_senha_local
DB_NAME=sellerhub_poc
DB_SSLMODE=disable
FRONTEND_ORIGIN=http://localhost:4200
```

Use aspas simples no `.env` se a senha contiver caracteres especiais como `#` ou `$`. O exemplo contém somente valores fictícios; `.env` é ignorado pelo Git. O `godotenv` carrega o arquivo da pasta atual sem substituir variáveis já definidas no terminal. `DB_SSLMODE=disable` é usado para o PostgreSQL local desta demonstração.

```powershell
go mod download
go run ./cmd
```

A API verifica a conexão com o banco antes de iniciar e atende em `http://localhost:8080`, somente na máquina local. Mantenha esse terminal aberto.

## 3. Iniciar o Angular

Em outro terminal, a partir da raiz:

```powershell
cd SellerHub
npm ci
npm start
```

Abra [http://localhost:4200](http://localhost:4200).

**Usuário público de demonstração:**

| Campo | Valor |
| --- | --- |
| E-mail | `teste@email.com` |
| Senha | `123456` |

O Go libera CORS apenas para `FRONTEND_ORIGIN`, incluindo o preflight `OPTIONS`. Abra o Angular usando `localhost`, pois `http://127.0.0.1:4200` é outra origem. Não há proxy Angular nem envio de cookies.

## 4. Demonstrar o fluxo

1. Entre com as credenciais acima: aparece **Login realizado com sucesso**.
2. Repita com outra senha: aparece **Credenciais inválidas**.
3. Envie os campos vazios: o formulário mostra os erros sem chamar a API.
4. Pare o Go e tente novamente: a tela informa indisponibilidade.
5. Nas ferramentas de desenvolvimento do navegador, aba Network/Rede, confira o `POST /login`, seu JSON e o status HTTP.

Para testar a API diretamente, em PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/login -ContentType 'application/json' -Body '{"email":"teste@email.com","password":"123456"}'
```

Resposta `200`:

```json
{"success":true,"message":"Login realizado com sucesso"}
```

Senha incorreta ou e-mail não cadastrado retornam `401` com a mesma mensagem:

```json
{"success":false,"message":"Credenciais inválidas"}
```

| Status | Situação |
| --- | --- |
| `200` | Credenciais válidas |
| `400` | Campos ou JSON inválidos, senha acima de 72 bytes ou corpo acima de 4 KiB |
| `401` | Credenciais inválidas |
| `403` | Origem não autorizada |
| `405` | Método diferente de POST/OPTIONS |
| `415` | Corpo sem `Content-Type: application/json` |
| `500` | Falha interna, como indisponibilidade do banco |

## Senhas e bcrypt

O SQL guarda somente um hash. Ele foi gerado em Go com `bcrypt.GenerateFromPassword` e `bcrypt.DefaultCost` (10). O utilitário abaixo permite gerar novamente o hash da senha pública de teste; salts aleatórios produzem hashes diferentes para a mesma senha:

```powershell
cd SellerBack
'123456' | go run ./cmd/gerar-hash
```

No login, `internal/service/login.go` usa `bcrypt.CompareHashAndPassword`. Não se compara um novo hash por igualdade. A entrada é limitada a 72 **bytes**, limite do bcrypt; caracteres acentuados podem ocupar mais de um byte. Veja a [documentação do bcrypt em Go](https://pkg.go.dev/golang.org/x/crypto/bcrypt).

Esta conta tem credenciais públicas e serve somente para demonstração local. A PoC não implementa sessões, proteção de rotas ou limitação de tentativas; essas funções precisam ser tratadas antes de transformar a verificação em autenticação de um sistema real.

## Verificações

No back-end:

```powershell
cd SellerBack
go test ./...
go vet ./...
```

Os testes comuns verificam HTTP, CORS, validação e bcrypt usando um repositório de teste. Eles também conferem se o hash do SQL corresponde a `123456`, mas não comprovam conexão com PostgreSQL.

Após preparar o banco real com os scripts e configurar `.env`, execute na pasta `SellerBack`:

```powershell
$env:TEST_POSTGRES = '1'
go test ./internal/handler -run TestLoginPostgreSQL -count=1 -v
Remove-Item Env:TEST_POSTGRES
```

Esse teste consulta o banco configurado, sem inserir ou apagar dados, e verifica o handler com senha válida e inválida. Sem `TEST_POSTGRES=1`, fica explicitamente ignorado.

No front-end:

```powershell
cd SellerHub
npm test -- --watch=false
npm run build
```

Os testes Angular verificam o componente e o AuthService com respostas HTTP simuladas. Para comprovar as três tecnologias juntas, execute também o roteiro no navegador com Go e PostgreSQL ativos.

## Problemas comuns

- **`go` ou `psql` não reconhecido:** confira a instalação e o `PATH`; reabra o terminal após instalar.
- **Conexão recusada:** confira se o serviço PostgreSQL está ativo, a porta está correta e a API foi iniciada.
- **Falha de autenticação no banco:** confira a senha da role `sellerhub` em `.env`, não a senha `123456` da tela.
- **Tabela inexistente:** execute os dois scripts SQL no banco indicado por `DB_NAME`.
- **CORS:** use exatamente `http://localhost:4200`; reinicie o Go depois de mudar `.env`.
- **Usuário de teste continua inválido:** confirme o banco utilizado. O script não sobrescreve o hash de um usuário que já existia.
- **PowerShell bloqueia `npm.ps1`:** use `npm.cmd` nos mesmos comandos, sem mudar a política de execução.

## Evolução

Novas telas podem ser adicionadas por funcionalidade no Angular. No Go, novos handlers recebem os serviços necessários, e novas consultas ficam no repository. A estrutura separa responsabilidades sem exigir novas camadas para cada função.
