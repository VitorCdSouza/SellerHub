# Desenvolvimento do front-end

## Referências de trabalho

- [TODO.md](TODO.md): fila única de tarefas, critérios de aceite, dependências FE/BE, responsáveis e resultados de verificação.
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
| `cadastrar(dados)` | `HttpResponse<{ id: number }>`: confirmar `status === 201` e consultar `body?.id`. |
| `atualizar(id, dados)` | Confirmação: `{ success, message }`. |

O serviço adapta o modelo interno para os nomes JSON `name`, `basePrice` e `items`. Preço é número decimal em reais, sem conversão para centavos. O usuário é obtido pela API a partir da sessão; não enviar `id_usuario` nos formulários.

Não há cache de catálogo nem fallback simulado nesse serviço. A página deve tratar carregamento, vazio, erro e nova tentativa, cancelar/desconsiderar respostas após destruição e descartar dados de uma sessão encerrada. Uma API indisponível não deve ser substituída silenciosamente por exemplos.

## Desenvolvimento sem API ou banco

O simulador é uma ferramenta do front-end que responde somente ao contrato atual de login, sessão, saída e produtos. Não usa Go, PostgreSQL, JWT, Gemini ou marketplaces. Os registros ficam em memória e são descartados ao reiniciar o simulador. Não usar dados reais nesse ambiente.

Na pasta `web`, abrir dois terminais:

```bash
# Terminal 1: respostas HTTP fictícias na porta 8081
npm run api:simulada
```

```bash
# Terminal 2: Angular com proxy exclusivo para o simulador
npm run start:simulado
```

Abrir `http://localhost:4200`. O aviso **Ambiente simulado** permanece visível em todas as páginas. As contas fictícias `catalogo@exemplo.test` e `outra@exemplo.test` usam a senha de demonstração `123456`. A primeira começa com 25 produtos, suficientes para duas páginas de 20; a segunda começa vazia e mantém catálogo separado. Cadastro/edição ficam disponíveis durante a execução, inclusive após recarregar o Angular.

O comando habitual `npm start` continua usando a API real na porta 8080; `npm run build` continua gerando a configuração de produção sem habilitar a simulação. Não há troca automática de fonte em falha. Para mudar entre os ambientes, encerrar o Angular e iniciá-lo com o comando correspondente. Encerrar os dois terminais com `Ctrl+C` ao terminar.

### Cenários para desenvolver e verificar estados

Reiniciar apenas o simulador com as opções desejadas; o Angular pode continuar aberto:

| Comando | Resultado esperado |
| --- | --- |
| `npm run api:simulada -- --cenario=vazio` | Catálogos vazios; criação continua disponível. |
| `npm run api:simulada -- --cenario=falha-produtos` | Login/sessão funcionam; operações de produtos retornam `500`. |
| `npm run api:simulada -- --cenario=falha-sessao` | Login confirma credenciais; consulta de sessão retorna `500`, permitindo testar a recuperação de acesso. |
| `npm run api:simulada -- --cenario=falha-saida` | Saída retorna `500`; a interface deve manter a conta e permitir tentar novamente. |
| `npm run api:simulada -- --atraso=800` | Atraso de 800 ms em cada chamada para observar carregamento e bloquear repetição. |
| `npm run api:simulada -- --atraso=12000` | Respostas após o timeout de 10 segundos dos serviços Angular. |
| `npm run api:simulada -- --duracao-sessao=30` | Sessão simulada expira após 30 segundos; próxima chamada protegida retorna `401`. |

Opções podem ser combinadas. O cenário padrão é `catalogo`. Reiniciar restaura os dados e elimina as sessões simuladas: entrar novamente antes de continuar. Para testar recuperação de uma falha, reiniciar no cenário padrão; a sessão anterior deixa de existir, então a recuperação pode pedir novo login. `404` pode ser exercitado consultando um ID inexistente ou de outra conta. Parar o simulador permite testar indisponibilidade de rede pelo proxy.

O cookie `sellerhub_simulada` é separado do cookie real e serve apenas à simulação local. Validações e DTOs acompanham o recorte identificado em `api/internal/controller/product.go` e `api/internal/service/product.go`; manter a ferramenta alinhada quando o contrato mudar. A ordenação usa nome/ID e comparação PT-BR em JavaScript; não comprova a collation do PostgreSQL. Não há controle de SKU duplicado, versão, busca, exclusão nem APIs de módulos ainda bloqueados. Simulação não atende ao aceite de persistência, segurança ou integração real.

## Consumo pelas páginas do catálogo

Usar os mesmos métodos de `ProdutosService` nos dois ambientes, sem condições de simulação nos componentes. `listar(2, 20)`, por exemplo, retorna `{ itens, total }`; a resposta não traz página/limite. A página mantém esses parâmetros e permite avançar somente se `pagina * limite < total`.

Ao carregar a página ou trocar o ID, usar `switchMap` para cancelar a leitura anterior, e `takeUntilDestroyed` para encerrar a assinatura ao destruir o componente. Tratar o erro dentro da leitura para que uma falha não encerre futuras tentativas. Não usar nova tentativa automática em POST/PUT; bloqueio de clique repetido e preservação dos campos ficam no formulário. Os testes de navegação em `src/app/autenticacao/navegacao.spec.ts` demonstram o uso da estrutura real com respostas HTTP controladas.

Rotas do catálogo: `/produtos`, `/produtos/novo`, `/produtos/:id` e `/produtos/:id/editar`, registradas sob o pai protegido. Produtos está ativo no menu; o login ainda direciona a `/inicio`. Usar `appFocoPagina` no título para foco inicial e manter somente o `<main>` fornecido pela estrutura. Catálogo não precisa consultar sessão novamente nem enviar identificador de usuário. O formulário de nome/SKU/preço é compartilhado por cadastro e edição.

## Verificação

```bash
npm test -- --watch=false
npm run test:simulador
npm run build
```

No PowerShell, usar `npm.cmd` se `npm.ps1` estiver bloqueado. Testes HTTP simulados verificam componentes e contratos; a integração exige API e banco reais. Registrar resultados, auditoria AXE e impedimentos em TODO.md, distinguindo os tipos de evidência.

### Verificação de cada entrega

Com Angular, Go e PostgreSQL reais em execução, usar:

```bash
npm run test:qualidade
npm run test:qualidade:conferir
```

O primeiro comando executa, em sequência, os testes do verificador, a suíte Angular (unitários e integração com HTTP controlado), o simulador, a checagem de tipos E2E, o build, as consultas HTTP reais pelo proxy e o Playwright/AXE. Não grava produtos, não inicia/encerra serviços e não cria commits. Corrigir os defeitos indicados, acrescentar regressões pertinentes e repetir a verificação; dependência de API/decisão deve permanecer identificada no TODO.

O resultado sanitizado fica em [QUALIDADE.md](QUALIDADE.md). Logs, resultados JSON e cópias das evidências são preservados por rodada em `tmp/qualidade/`, ignorado pelo Git. O verificador serializa execuções para não sobrescrever uma suíte Playwright em andamento; não rodar Playwright separadamente em paralelo.

Cada aprovação tem uma impressão SHA-256 dos arquivos relevantes de fontes, testes, configurações, assets e contratos Go/SQL, incluindo arquivos novos ainda não versionados. Alterações posteriores invalidam a prova; alteração durante o teste gera **DESATUALIZADO**. O comando `:conferir` apenas compara a última prova com o conteúdo atual, sem repetir testes. Dados privados, documentação e artefatos não entram nessa impressão.

| Estado | Significado | Código de saída |
| --- | --- | --- |
| APROVADO | Todos os checks obrigatórios passaram para a mesma impressão, sem testes ignorados/instáveis. | 0 |
| FALHOU | Há falha de teste/build/checagem. | 1 |
| BLOQUEADO | Falta ambiente, há execução concorrente ou algum check não pôde ser executado. | 2 |
| DESATUALIZADO | Não há prova atual, mudou o plano de checks ou o código mudou. | 3 |

A prova corresponde à árvore de trabalho. Para usá-la antes de um commit, o conjunto preparado precisa corresponder ao código testado, incluindo arquivos novos; um índice parcial diferente exige isolar e revalidar a alteração. Aprovação dos checks atuais não conclui todos os critérios do catálogo nem o MVP. A gravação real continua sendo uma verificação explícita separada.

### Verificação HTTP da API real

Com Go e PostgreSQL de desenvolvimento rodando, executar na pasta `web`:

```bash
npm run test:api-real
```

O comando usa `http://localhost:8080`, verifica autenticação/sessão, paginação, erros e isolamento entre as contas fictícias do seed atual. Mantém os cookies somente em memória e solicita logout ao terminar. Por padrão, não cria nem edita produtos. Se o catálogo estiver vazio, informa que a consulta de produto de outra conta não foi exercitada. Senhas reais, JWT_SECRET e configuração do banco não são lidos pelo script.

Para verificar também o proxy, iniciar Angular com `npm start` e executar:

```bash
npm run test:api-real -- --origem=http://localhost:4200
```

Para incluir cadastro/edição e tentativa de alteração por outra conta, habilitar explicitamente a gravação:

```bash
npm run test:api-real -- --origem=http://localhost:4200 --gravar
```

Essa opção **cria um produto fictício QA por execução e o mantém no banco**, exibindo ID/SKU ao final. A API não tem exclusão; o comando não limpa registros anteriores. Usar somente o banco de desenvolvimento. Não usar repetição automática em caso de timeout de gravação: consultar o banco/API antes de executar novamente.

O verificador aceita apenas origens HTTP locais, rejeita respostas identificadas pelo simulador e encerra com erro se a API/proxy falhar. O cookie recebido é gerenciado pelo próprio comando; isso não comprova a política de cookies do navegador nem revogação de JWT no servidor. Não substitui o ensaio de interface e acessibilidade.

### Testes automatizados no navegador — Playwright e AXE

Instalar as dependências **na pasta `web`** e preparar o Chromium:

```bash
npm ci
npx playwright install chromium
```

Manter PostgreSQL e a API Go em execução conforme o guia da aplicação e iniciar o Angular com `npm start` em outro terminal. A configuração usa `http://localhost:4200` e o proxy real para Go/8080. Não precisa de extensão de navegador nem de “Share with Agent”. O teste não inicia, encerra ou reinicia esses serviços; a preparação falha com diagnóstico se não estiverem disponíveis ou se o proxy identificar o simulador.

Executar em `web`:

```bash
npm run test:e2e:tipos
npm run test:e2e
npm run test:e2e:relatorio
```

A suíte padrão usa Chromium em **1440 × 900 e 390 × 844**, com contexto/cookies isolados por teste, locale PT-BR, um worker e nenhuma repetição automática. Usa as contas fictícias do seed e exige ao menos um produto de `caio@sellerhub.com` para as consultas. Não altera os produtos existentes. Login, navegação, recarga, saída, isolamento e recuperação de destino usam a API real. Os testes identificados como **falha controlada** interceptam somente a chamada indicada para provocar erro de rede/`500`; a recuperação consulta a API real. Remover o cookie testa perda de sessão, sem comprovar expiração temporal do JWT no Go.

Os arquivos ficam em `e2e/`, separados dos testes Angular em `src/`. Para executar apenas os testes funcionais, usar `npm run test:e2e -- acesso-catalogo.spec.ts`. A auditoria roda AXE sem excluir regras e verifica foco inicial e ausência de rolagem horizontal na página; uma tabela pode ter rolagem interna. AXE não substitui toda a avaliação por teclado/leitor de tela.

Capturas das seis páginas, laudos `axe.json`, resumo JSON e evidências de falha ficam em `test-results/`; o relatório HTML fica em `playwright-report/`. Esses diretórios são ignorados pelo Git. Traces de falha podem conter dados de requisições e cookies: manter os artefatos locais e revisar antes de compartilhar. São capturas para inspeção; não há comparação com imagens de referência aprovada. Resultados e correções ficam em [TODO.md](TODO.md), sem desabilitar verificações para contornar falhas das páginas.

Para testar cadastro/edição reais pela interface, habilitar a configuração separada:

```bash
npm run test:e2e:gravar
```

Esse comando **cria um produto `QA-E2E-*` por execução**, edita somente esse registro e verifica a persistência após recarga e o bloqueio de outra conta. O ID/SKU aparece no terminal e no relatório; o produto permanece no banco porque não há exclusão HTTP. Usar somente o banco de desenvolvimento. Não repetir cegamente após uma falha: conferir o ID/SKU registrado antes. Evidências ficam em `test-results/gravacao/` e `playwright-report/gravacao/`; para abri-las, usar `npx playwright show-report playwright-report/gravacao`. Uma nova execução da suíte padrão substitui os artefatos anteriores, inclusive os da gravação.

Para retomar a edição de um QA já criado, definir `E2E_PRODUTO_QA` com seu ID. A suíte exige SKU `QA-E2E-*` e nome no padrão da ferramenta antes de permitir a alteração. Exemplo no PowerShell, substituindo `ID_DO_QA` pelo número informado na execução anterior:

```powershell
$env:E2E_PRODUTO_QA = 'ID_DO_QA'
try { npm.cmd run test:e2e:gravar } finally { Remove-Item Env:E2E_PRODUTO_QA }
```

Esse modo não executa novo cadastro; comprova somente a retomada/edição e as verificações seguintes. Apagar a variável ao terminar restabelece o comportamento de criar um QA na próxima execução explícita de gravação.

### Roteiro integrado no navegador

Com a configuração real, seguir a ordem abaixo usando as contas fictícias de desenvolvimento. O destino inicial continua `/inicio`, com acesso à lista e ao cadastro.

| Passo | Resultado esperado |
| --- | --- |
| Login → Ver produtos → Novo produto | Rotas protegidas, conta correta e formulário básico disponíveis. |
| Preencher nome/SKU e preço `35,50`; salvar uma vez | Retornar à lista com o novo registro e preço em reais. |
| Abrir detalhe e recarregar | Mesmo ID e dados persistidos; sem formulário de cadastro vazio. |
| Abrir edição, alterar nome/preço, salvar e voltar à lista | Detalhe/lista mostram a gravação; nova recarga mantém os valores. |
| Sair, tentar voltar e entrar com outra conta | Login exigido após saída e dados da conta anterior ausentes. O ID da outra conta retorna não encontrado. |
| Navegar por teclado e em 390 px | Ações legíveis/operáveis, foco coerente e erros associados; executar AXE nos estados principais. |

Testes de rotas/componentes com HttpTestingController cobrem a composição da estrutura sem banco. O arquivo `src/app/estrutura/catalogo-integracao.spec.ts` usa as rotas, configuração, componentes e serviço reais do Angular com respostas controladas; não equivale à execução desse roteiro no navegador.
