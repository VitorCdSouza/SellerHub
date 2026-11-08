# Desenvolvimento do front-end

## Referências de trabalho

- [TODO.md](TODO.md): fila única de tarefas, critérios de aceite, dependências FE/BE, responsáveis e resultados de verificação.
- [AGENTS.md](AGENTS.md): convenções Angular e orientações de execução para os agentes.
- [README da aplicação](../README.md): instalação e execução do conjunto Angular/Go/PostgreSQL.

Andamento, entregas individuais, impedimentos e resultados de sessões ficam no TODO e nas instruções aplicáveis. O README da raiz apresenta o projeto e sua instalação/operação; não deve ser usado como diário de desenvolvimento. Os arquivos privados locais continuam separados da documentação compartilhada.

## Autenticação e navegação

`AuthService` envia login, consulta sessão e solicita logout. O estado fica em memória; não armazenar o JWT em localStorage/sessionStorage nem tentar ler o cookie HttpOnly.

O guard protege os filhos da estrutura interna. `401` de chamada protegida retorna ao login, enquanto `401` do próprio login é erro de credenciais. Indisponibilidade da consulta de sessão tem uma página com nova tentativa. Logout com falha mantém a conta e informa o problema. O logout da API remove o cookie; o JWT emitido continua válido até expirar.

As páginas usam carregamento sob demanda. Ao acrescentar uma funcionalidade, combinar seu caminho em `app.routes.ts`, proteção de acesso, título e foco inicial. Menu ativo deve apontar somente para páginas disponíveis. Os estados efetivamente implementados e as pendências de navegação estão no TODO.

## Serviço de produtos

Injetar `ProdutosService` de `src/app/produtos/produtos.service.ts`. Os modelos ficam em `produto.model.ts`.

| Método | Resultado |
| --- | --- |
| `listar(pagina = 1, limite = 20)` | `PaginaProdutos`: `itens` e `total`. |
| `consultar(id)` | `Produto`: `id`, `nome`, `sku`, `precoBase`. |
| `cadastrar(dados)` | Identificador criado: `{ id }`. |
| `atualizar(id, dados)` | Confirmação: `{ success, message }`. |

O serviço adapta o modelo interno para os nomes JSON `name`, `basePrice` e `items`. Preço é número decimal em reais, sem conversão para centavos. O usuário é obtido pela API a partir da sessão; não enviar `id_usuario` nos formulários.

Não há cache de catálogo nem fallback simulado nesse serviço. A página deve tratar carregamento, vazio, erro e nova tentativa, cancelar/desconsiderar respostas após destruição e descartar dados de uma sessão encerrada. Uma API indisponível não deve ser substituída silenciosamente por exemplos.

## Verificação

```bash
npm test -- --watch=false
npm run build
```

No PowerShell, usar `npm.cmd` se `npm.ps1` estiver bloqueado. Testes HTTP simulados verificam componentes e contratos; a integração exige API e banco reais. Registrar resultados, auditoria AXE e impedimentos em TODO.md, distinguindo os tipos de evidência.
