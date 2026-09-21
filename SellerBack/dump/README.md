# Banco da PoC para os integrantes

O arquivo `sellerhub_poc.dump` é um backup PostgreSQL no formato **Custom**, criado com `pg_dump`. Ele contém a estrutura da tabela `users`, suas restrições, a sequência do ID e o usuário de demonstração com senha em hash bcrypt.

Use **PostgreSQL 18** e as ferramentas `pg_restore`/`psql` da versão 18 para reproduzir o ambiente. A restauração em versões anteriores não é garantida. Para uma instalação PostgreSQL 17, use os scripts originais em `../sql` em vez deste dump.

O dump não contém a senha de conexão ao PostgreSQL nem cria usuários administrativos do servidor. Cada integrante define suas próprias credenciais locais. A conta pública da aplicação é `teste@email.com`, senha `123456`.

## Validação do arquivo entregue

Gerado com PostgreSQL 18.6 e restaurado em um banco temporário vazio na mesma versão. Foram conferidos: a tabela, o único usuário de demonstração, o hash bcrypt e a sequência de IDs (próximo ID igual a 2). O banco temporário foi removido após a conferência. No banco principal, o teste automatizado de integração e as tentativas válida e inválida no navegador também passaram.

## Restaurar pelo PowerShell

Abra um terminal na raiz do repositório. Se necessário, adicione as ferramentas ao PATH apenas dessa sessão:

```powershell
$env:Path += ';C:\Program Files\PostgreSQL\18\bin'
psql -h localhost -p 5432 -U postgres -d postgres
```

Dentro do `psql`, execute uma vez:

```sql
CREATE ROLE sellerhub LOGIN;
\password sellerhub
CREATE DATABASE sellerhub_poc OWNER sellerhub;
\q
```

Escolha uma senha local ao executar `\password`. Se a role `sellerhub` já existir, reutilize-a sem executar `CREATE ROLE` novamente. Restaure em um **banco vazio**: se já existir um `sellerhub_poc` com tabelas ou dados, crie outro banco, como `sellerhub_poc_demo`, e use esse nome nos comandos e no `.env`. Não é necessário apagar o banco existente.

No PowerShell, restaure como o proprietário do banco:

```powershell
pg_restore -h localhost -p 5432 -U sellerhub -d sellerhub_poc --no-owner --no-privileges --single-transaction --exit-on-error .\SellerBack\dump\sellerhub_poc.dump
```

A senha solicitada é a senha local da role `sellerhub`, não `123456`. As opções de restauração evitam depender dos proprietários e permissões da máquina de origem. Não execute os scripts de criação da tabela antes do dump: ele já contém a estrutura e os dados.

## Alternativa: pgAdmin

1. No servidor local, crie uma Login/Group Role chamada `sellerhub`, com permissão de login e uma senha local, se ela ainda não existir.
2. Crie um banco vazio chamado `sellerhub_poc`, escolhendo `sellerhub` como proprietário.
3. No banco, escolha **Restore** e selecione `sellerhub_poc.dump`, com formato **Custom**.
4. Escolha `sellerhub` como role da restauração e habilite as opções equivalentes a **No owner** e **No privileges**. Não habilite limpeza ou exclusão de objetos existentes.
5. Execute e confira se o processo terminou sem erros. Os nomes das opções podem variar entre versões do pgAdmin; o comando PowerShell acima é a referência exata.

## Configurar a API em cada máquina

Na pasta `SellerBack`, copie `.env.example` para `.env` somente se este ainda não existir. Preencha:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USER=sellerhub
DB_PASSWORD=sua_senha_local_do_banco
DB_NAME=sellerhub_poc
DB_SSLMODE=disable
FRONTEND_ORIGIN=http://localhost:4200
```

O `.env` é local e ignorado pelo Git. Use aspas simples em torno da senha se ela tiver caracteres especiais. Não compartilhe o `.env` de outra pessoa.

## Conferir a restauração

Na raiz do repositório:

```powershell
psql -h localhost -p 5432 -U sellerhub -d sellerhub_poc -c "SELECT id, email FROM users;"
```

Deve aparecer o usuário `teste@email.com`. Depois, na pasta `SellerBack`:

```powershell
$env:TEST_POSTGRES = '1'
go test ./internal/handler -run TestLoginPostgreSQL -count=1 -v
Remove-Item Env:TEST_POSTGRES
go run ./cmd
```

Em outro terminal, na pasta do front-end `SellerHub`, execute `npm ci` e `npm start`. Abra `http://localhost:4200` e teste `teste@email.com` / `123456`. Uma senha incorreta deve retornar credenciais inválidas.

## Gerar um novo dump

Com o banco contendo somente os dados fictícios que devem ser compartilhados, execute na raiz do repositório:

```powershell
pg_dump -h localhost -p 5432 -U sellerhub -d sellerhub_poc --format=custom --no-privileges --file=.\SellerBack\dump\sellerhub_poc.dump
```

Esse comando substitui o arquivo de dump. Revise os dados antes de gerar uma nova versão: backups posteriores podem incluir outras contas. `pg_dump` exporta o banco; roles e senhas de conexão são configuradas separadamente em cada máquina.

Referência: [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html) e [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html).
