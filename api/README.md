# SellerBack — API de login

API REST em Go para a PoC SellerHub. Recebe `POST /login` com `email` e `password`, consulta PostgreSQL e compara a senha com bcrypt.

O [README principal](../README.md) contém o passo a passo completo de instalação do PostgreSQL, criação da role e banco, execução dos scripts SQL e demonstração com Angular.

Para reproduzir o banco em outra máquina com PostgreSQL 18, use o [dump e as instruções de restauração](dump/README.md). O arquivo inclui a tabela e o usuário de demonstração; cada integrante configura sua própria senha de conexão no `.env` local.

## Responsabilidades

| Parte | Responsabilidade |
| --- | --- |
| `cmd/main.go` | Carregar ambiente, conectar ao banco, montar dependências e iniciar HTTP |
| `internal/handler` | Tratar requisição, respostas JSON, status e CORS |
| `internal/service` | Normalizar e-mail, validar dados e verificar bcrypt |
| `internal/repository` | Consultar o hash por e-mail com SQL parametrizado |
| `internal/database` | Ler variáveis `DB_*`, criar pool e conferir conexão |
| `sql/01_criar_tabela.sql` | Criar `users` com e-mail único e senha em hash |
| `sql/02_usuario_teste.sql` | Inserir `teste@email.com` / `123456` para demonstração |
| `cmd/gerar-hash` | Gerar hash bcrypt pela entrada padrão, sem cadastro HTTP |

## Execução

Na pasta `SellerBack`, depois de preparar PostgreSQL e os scripts:

```powershell
Copy-Item .env.example .env
# Edite .env com as credenciais do banco antes de continuar.
go mod download
go run ./cmd
```

Copie o exemplo apenas se `.env` ainda não existir. Variáveis já definidas no processo têm prioridade. A API atende somente em `localhost:8080`; a origem permitida por padrão é `http://localhost:4200`.

Contrato:

```http
POST /login
Content-Type: application/json

{"email":"teste@email.com","password":"123456"}
```

- `200`: `{"success":true,"message":"Login realizado com sucesso"}`
- `401`: `{"success":false,"message":"Credenciais inválidas"}`
- `400`: dados ou JSON inválidos.
- `403`, `405`, `415`: origem, método ou tipo de conteúdo não permitido.
- `500`: falha interna, com mensagem genérica para o cliente.

O sucesso confirma a senha e não cria sessão. A tabela guarda hash bcrypt gerado em Go; a comparação está em `service/login.go`. A senha tem limite de 72 bytes.

## Testes

```powershell
go test ./...
go vet ./...
```

Para usar o PostgreSQL real configurado no `.env`, após aplicar os scripts:

```powershell
$env:TEST_POSTGRES = '1'
go test ./internal/handler -run TestLoginPostgreSQL -count=1 -v
Remove-Item Env:TEST_POSTGRES
```

Sem essa variável, o teste de banco é ignorado; os demais usam um repositório de teste.
