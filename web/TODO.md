# Front-end — telas, dependências e to-dos

Atualização em **08/11/2026**, sobre o último commit desta cópia: `88731577` (06/11/2026, middleware de sessão e produtos paginados), comparado ao seu pai `5449028c`. Substitui a fotografia de 05/11/2026 (`dde6975e`). Este documento concentra a fila compartilhada do front-end e os pedidos destinados ao back-end. As prioridades são uma sequência sugerida; não atribuem tarefas individuais nem autorizam implementar todas as funcionalidades de uma vez.

## Como interpretar o estado

- **Pode avançar agora:** implementação visual e comportamento local independentes da API.
- **Liberado para implementar e integrar:** há endpoint e contrato identificáveis no código, e `go vet` passou. O front pode começar a integração após alinhar URL/proxy; isso não comprova funcionamento com o banco e o navegador.
- **Pode avançar com simulação:** componentes, formulários e estados usando dados fictícios separados dos serviços HTTP. O contrato continua pendente; simulação não comprova persistência nem integração.
- **Integração bloqueada:** ainda não há API utilizável para concluir o fluxo real.

**Agora estão liberados para implementar e integrar login, consulta de sessão/saída e catálogo básico de produtos (listar, detalhar, cadastrar e editar).** O front permanece só com a tela de login e a URL antiga; nenhuma integração de negócio foi concluída. A liberação é técnica, limitada aos campos e às operações abaixo. Tabelas, dados de exemplo e imagens de protótipos não equivalem a endpoints disponíveis.

## O que o último commit desbloqueou

| Pendência anterior | Entrega em `88731577` | Situação após a revisão |
| --- | --- | --- |
| BE-01: API não compilava | Consulta de usuário restaurada, sqlc atualizado e identificador corrigido para `IDUsuario`/`int32`. | Resolvido; `go vet ./...` passou em 08/11. |
| BE-02: hashes fictícios no seed | Três usuários de desenvolvimento passaram a usar bcrypt; senha documentada no seed. | Código corrigido; aplicação no banco, login real e README continuam pendentes. |
| BE-03: só emissão de JWT | Validação HS256/expiração, middleware, `GET /api/sessao` e `POST /api/logout`. | Libera FE-03; logout remove cookie, sem revogar JWT. Homologação e decisão sobre revogação permanecem pendentes. |
| BE-04: produtos só no SQL | Controller/service/rotas HTTP autenticadas, paginação/total e atualização com contagem de linhas. | Base HTTP entregue; libera FE-04/FE-05/FE-06 para o cadastro básico. |
| BE-05: validações do produto | Nome/SKU obrigatórios com limites e preço positivo com até duas casas. | Parcial: sem unicidade de SKU, controle de versão ou campos adicionais do protótipo. |
| FE-01 a FE-15 | O commit não altera arquivos do Angular. | Nenhuma tarefa FE foi concluída por essa entrega de back-end. |

## Evidências do código

| Evidência | Consequência para o front-end |
| --- | --- |
| [`app.routes.ts`](src/app/app.routes.ts) só carrega o login; [`app.html`](src/app/app.html) contém apenas o outlet. | Não há navegação interna nem telas de negócio implementadas. |
| [`auth.service.ts`](src/app/services/auth.service.ts) e os testes ainda chamam `http://localhost:8080/login`; [`main.go`](../api/cmd/main.go) registra `POST /api/login` e as novas rotas de sessão/produtos. | Caminho e origem continuam incompatíveis. Não há CORS na API nem `proxy.conf.json` ou `proxyConfig` no Angular, apesar do README. FE-01 é o primeiro ajuste de front para integrar. |
| [`login.go`](../api/internal/service/login.go), [`queries.sql`](../api/internal/db/queries.sql) e sqlc agora usam `GetUserByEmail` e `IDUsuario`. | Bloqueio de compilação resolvido, confirmado por `go vet ./...`. |
| [`session.go`](../api/internal/service/session.go) valida assinatura HS256/expiração; [`middleware`](../api/internal/controller/session.go) protege sessão e todas as rotas de produto. | Já é possível consultar usuário e tratar `401`. Cookie `sessao` continua HttpOnly/SameSite Strict/8 horas. Não ler o cookie no Angular nem guardar JWT em localStorage. |
| [`login.go`](../api/internal/controller/login.go) implementa consulta de sessão e logout por remoção de cookie. | FE-03 está liberado para esse comportamento. Um JWT previamente copiado continua válido até expirar; não anunciar revogação no servidor. |
| [`dados.sql`](../db/dados.sql) agora contém bcrypt para os três usuários de desenvolvimento, mas o README ainda indica `teste@email.com`. | Usar os usuários atuais do seed no ensaio; não presumir que o banco instalado já recebeu essa carga. Não recriar banco automaticamente para esta avaliação. |
| [`product.go`](../api/internal/controller/product.go) e seu [`service`](../api/internal/service/product.go) expõem lista, detalhe, criação e atualização. SQL usa `LIMIT/OFFSET`, contagem e `:execrows`. | Libera catálogo básico com paginação. Produto inexistente ou de outro usuário retorna `404`; não se perde mais esse caso na atualização. |
| `CAD_PRODUTO` contém ID, usuário, SKU, nome e preço decimal. | Descrição, categoria, características, fotos, saldo e unicidade de SKU não estão implementados no schema. O protótipo de novo produto pede mais campos que o banco atual. |
| Existem tabelas de anúncios, marketplaces, auditoria e métricas. | Não há consultas e rotas desses módulos, conectores, OAuth ou chamadas Gemini. Os registros de exemplo não comprovam canais conectados. |
| Não há saldo de produto, API de estoque nem consulta externa de pedidos. | Estoque e Vendas ainda não têm fonte real de dados. A ausência de tabela de pedidos, isoladamente, não obriga sua persistência; o fluxo precisa ser acordado. |

## Contrato disponível para o front-end

Contrato extraído das rotas, controllers e services atuais; ainda sem ensaio HTTP com PostgreSQL nesta revisão. As chamadas do Angular devem usar a própria origem com proxy `/api` após FE-01. O navegador gerencia o cookie; não há token JWT no JSON de login.

| Operação | Requisição | Sucesso |
| --- | --- | --- |
| Entrar | `POST /api/login`, corpo `{ "email": "...", "password": "..." }` | `200`, `{ "success": true, "message": "..." }` e cookie `sessao`. |
| Consultar sessão | `GET /api/sessao`, autenticado | `200`, `{ "id": 2, "email": "..." }`. Não retorna nome ou loja. |
| Sair | `POST /api/logout`, sem corpo obrigatório | `200`, `{ "success": true, "message": "Sessão encerrada" }`; remove cookie. É idempotente para ausência de cookie e não exige middleware. |
| Listar produtos | `GET /api/produtos?pagina=1&limite=20`, autenticado | `200`, `{ "items": [{ "id": 3, "name": "Produto", "sku": "SKU-1", "basePrice": 35.50 }], "total": 1 }`; lista vazia devolve `items: []`. |
| Detalhar produto | `GET /api/produtos/{id}`, autenticado | `200`, objeto com `id`, `name`, `sku` e `basePrice`. |
| Cadastrar produto | `POST /api/produtos`, autenticado, corpo `{ "name": "Produto", "sku": "SKU-1", "basePrice": 35.50 }` | `201`, `{ "id": 5 }`. Reconsultar detalhe/listagem se necessário. |
| Editar produto | `PUT /api/produtos/{id}`, autenticado, mesmo corpo do cadastro | `200`, `{ "success": true, "message": "Produto atualizado" }`. Não usar PATCH. |

- IDs são inteiros; `basePrice` é número JSON em valor monetário decimal, não centavos nem texto formatado em reais. Manter o nome inglês dos campos no DTO HTTP e adaptar os rótulos/nomes internos do Angular em português, sem renomear unilateralmente o contrato.
- `pagina` começa em 1; `limite` padrão 20, entre 1 e 100. A API não devolve página/limite: o front os mantém e usa `total` para a navegação. A ordenação é nome e ID. Ainda não há busca ou filtros por texto/canal/saldo; não pesquisar só a página corrente como se fosse o catálogo inteiro.
- Nome/SKU têm espaços das pontas removidos e limites de 255/100 caracteres; preço deve ser maior que zero, menor que 100.000.000 e ter até duas casas decimais. Corpo de login/produto tem limite de 4 KiB.
- Erros usam `{ "success": false, "message": "..." }`: `400` para entrada/paginação inválida, `401` para cookie ausente/inválido/expirado, `404` para ID inválido/inexistente ou produto de outro usuário e `500` para falha interna. Não há erros por campo ou `409` de SKU/versão no código atual.
- Produtos são filtrados pelo ID obtido do JWT. Não enviar `id_usuario` no formulário. Esse isolamento já está implementado; o eventual compartilhamento do catálogo da conta única continua em DEC-02. Não há exclusão de produto.

## Quais telas podem ser feitas

| Tela ou fluxo | O que pode ser feito agora no front-end | O que impede concluir com dados reais | To-dos |
| --- | --- | --- | --- |
| Login (RF01) | **Liberado para integrar:** corrigir URL/proxy/testes e usar a API atual. | Falta FE-01 e preparar/verificar o banco de desenvolvimento. Não há mais bloqueio de compilação. | FE-01, BE-02, BE-15 |
| Estrutura interna e navegação | **Liberado:** construir menu/rotas e integrar usuário por ID/e-mail, guard, tratamento de expiração e saída. | Nome/loja não vêm da sessão. Logout remove cookie; revogação do JWT continua pendente de decisão. | FE-02, FE-03, BE-03 |
| Produtos — listagem (RF03) | **Liberado para integrar:** lista de nome, SKU e preço, paginação e total, estados vazio/erro/carregamento. | Implementação Angular e ensaio real pendentes. Busca, saldo e canais não vêm desse endpoint. | FE-01, FE-03, FE-04, BE-15 |
| Novo produto (RF02) | **Liberado no recorte básico:** cadastrar nome, SKU e preço pela API. | Não inclui todos os campos do protótipo; confirmar recorte em DEC-02. Não há rejeição de SKU duplicado/controle de versão. | FE-05, BE-05, BE-15, DEC-02 |
| Detalhe/edição de produto (RF04) | **Liberado no recorte básico:** consultar por ID e salvar os três campos via PUT, tratando `400`/`401`/`404`/`500`. | Campos adicionais, conflito de versão e SKU único não estão liberados. Validar persistência e isolamento no ensaio. | FE-06, BE-05, BE-15 |
| Fotos e características do produto | Preparar seleção e prévia local de foto real, se esse incremento for priorizado. | Não há upload, metadados ou persistência de características. Prévia não significa arquivo salvo. | FE-07, BE-05, BE-06 |
| Anúncios — listagem/gestão (RF05) | Estrutura visual com filtros e situações simuladas. | Não há listagem HTTP, vínculo exposto com produto/canal ou ações reais. | FE-08, BE-07 |
| Novo/editar anúncio, revisão e publicação (RF06) | Formulário e prévia simulados; revisão humana explícita antes da publicação. | Faltam rascunhos HTTP, requisitos por canal, revisão/aprovação, conector e retorno da operação. | FE-09, BE-07, BE-08, DEC-03 |
| Sugestões de IA e tratamento de imagens | Preparar estados de geração, edição e erro após combinar o contrato. | Não há API Gemini nem tratamento de fotos. Escrita manual deve continuar possível; sugestão nunca é publicação automática. | FE-09, BE-06, BE-09 |
| Vendas/pedidos — consulta (RF07) | Lista, filtros e detalhe com dados fictícios, após acordo dos campos e situações. | Não há endpoint ou conector para consultar vendas. Ação de cancelamento/reposição tem divergência de escopo. | FE-10, BE-10, DEC-01 |
| Estoque e divergências (RF08) | Preparar visualização simulada de saldo, situação por canal e última atualização. | Não há saldo persistido, consulta, sincronização ou divergências calculadas. Entrada/ajuste manual depende de decisão. | FE-11, BE-11, DEC-01 |
| Indicadores (RF09/RF10) | Layout de filtros, cartões e gráficos com simulação identificada. | Tabela de histórico não tem API; faltam agregações, período, origem e disponibilidade das métricas. | FE-12, BE-12 |
| Administração — conta | Estrutura do formulário e identificação por ID/e-mail já obtidos da sessão. | Não há perfil completo, edição da conta, loja ou troca de senha. Não afirmar que alterações são salvas nem acrescentar CRUD de usuários/perfis. | FE-03, FE-13, BE-13 |
| Administração — canais e sincronização | Estados visuais de desconectado, indisponível, expirado e falha. | Não há OAuth, estado de conexão, preferências ou execução de sincronização. | FE-13, BE-08, BE-11, BE-13 |
| Recuperação/redefinição de senha (RF12) | Apenas desenho do fluxo até acordar mecanismo e contrato. | Não há emissão/validação de token, redefinição ou envio de instruções. | FE-14, BE-14 |

Não foi identificada uma tela de auditoria nos protótipos/requisitos de interface. A existência de `CAD_AUDITORIA` não autoriza acrescentá-la à fila de telas. Também não há suporte para cadastro público, múltiplos perfis ou gestão de usuários.

## To-do do front-end

### Prioridade 0 — integrar a base já exposta pela API

- [ ] **FE-01 — Alinhar o login ao contrato atual (liberado):** usar `/api/login`, criar/configurar proxy local para `http://localhost:8080`, atualizar expectativas dos testes e preservar tratamento de `400`, `401`, indisponibilidade e envio repetido. BE-01 foi resolvido; não aguardar novas rotas para começar. O ensaio precisa de banco preparado com o seed atual (BE-02/BE-15). Validar o cookie pelo comportamento das requisições, sem tentar lê-lo no JavaScript.
- [ ] **FE-02 — Criar a estrutura interna (liberado):** navegação acessível, conteúdo responsivo, rotas sob demanda e tratamento de rota inexistente. Associar FE-03 para proteger a navegação; identificar usuário pelo e-mail retornado, sem inventar nome/loja.
- [ ] **FE-03 — Integrar sessão e saída (liberado):** `GET /api/sessao` na entrada/reabertura, guard de navegação, retorno ao login em `401`, tratamento separado de indisponibilidade e `POST /api/logout`. Não usar booleano persistido nem tentar ler cookie HttpOnly. Após sair, limpar estado da interface e verificar ausência de sessão no navegador. Não anunciar revogação do JWT; limite registrado em BE-03.
- [ ] **FE-04 — Construir/integrar a listagem de produtos (liberado):** consumir `items`/`total` com `pagina`/`limite`, nome, SKU e preço; carregamento, vazio, erro e nova tentativa. Manter página/limite no front e tratar `401`. Sem busca remota, saldo ou canais por suposição.
- [ ] **FE-05 — Construir/integrar o cadastro básico (liberado):** enviar `name`, `sku`, `basePrice` por POST; tratar `201`/ID e falhas, sem simular sucesso no serviço real. Confirmar DEC-02 antes de apresentar o recorte básico como cadastro completo. Unicidade/versão e campos adicionais permanecem em BE-05, sem bloquear a construção dos três campos já suportados.
- [ ] **FE-06 — Construir/integrar detalhe e edição básicos (liberado):** GET por ID e PUT com os três campos; reutilizar formulário, preservar valores em falha e tratar `404` inclusive para produto de outro usuário. Não inventar `409` ou controle de conflito ainda ausentes; acompanhá-los em BE-05.

### Prioridade 1 — verificar o primeiro fluxo e ampliar o cadastro conforme liberação

- [ ] **FE-07 — Complementar o produto:** características, descrição, categoria e fotos reais conforme DEC-02 e BE-05/BE-06. Diferenciar seleção/prévia local de upload concluído.
- [ ] **FE-15 — Verificar o primeiro fluxo real:** após implementar FE-01 a FE-06, ensaiar login válido/inválido → consultar sessão → listar/paginar → cadastrar → recarregar → detalhar/editar → sair → tentar retornar à rota. Conferir persistência, cookie ausente/expirado, isolamento entre os usuários de teste, ID inexistente e paginação inválida. Validar teclado, foco, mensagens por campo e AXE/WCAG AA. Em paralelo, BE-15 verifica a API com PostgreSQL; `go vet` sozinho não conclui essa tarefa.

### Prioridade 2 — preparar módulos dependentes conforme os contratos forem liberados

- [ ] **FE-08 — Listagem/gestão de anúncios:** implementar e depois integrar situações e ações efetivamente disponíveis; depende de BE-07.
- [ ] **FE-09 — Editor de anúncio e prévia:** seleção de produto/canal, campos exigidos, rascunho, revisão/aprovação humana e acompanhamento de publicação. Sugestões de IA devem ser editáveis, com alternativa manual em falha. Publicação real depende de BE-07/BE-08; IA depende de BE-09 e imagens de BE-06. Resolver DEC-03 antes de bloquear canais com anúncio existente.
- [ ] **FE-10 — Vendas/pedidos:** consulta e detalhe com situações acordadas em BE-10. Manter qualquer ação de cancelamento/reposição pendente até DEC-01.
- [ ] **FE-11 — Estoque:** saldo e divergências, canal afetado, última atualização, falha e processamento pendente, conforme BE-11. Não acrescentar entrada/ajuste manual até DEC-01.
- [ ] **FE-12 — Indicadores:** filtros de período/canal e apresentação das métricas de BE-12. Diferenciar zero de dado indisponível e identificar atualização/origem.
- [ ] **FE-13 — Administração:** pode reutilizar ID/e-mail da sessão de FE-03, sem edição. Perfil completo, canais e preferências seguem por incrementos de BE-08/BE-11/BE-13. Não apresentar salvamento indisponível nem exibir canais como conectados com base no cadastro de marketplaces.
- [ ] **FE-14 — Recuperação/redefinição de senha:** implementar após BE-14 definir contrato, expiração e mensagens de resultado; não exibir confirmação fictícia de envio.

Para toda tela: componentes standalone, `OnPush`, signals, formulários reativos e serviço HTTP por funcionalidade. Separar simulação e acesso real, sem fallback silencioso para dados fictícios quando a API falhar. Testar os riscos do fluxo, sem criar testes que apenas repitam o HTML.

## To-do específico do time de back-end

Estes itens são dependências de Samuel/Vitor, cruzadas com o último commit. `[x]` registra entrega de código confirmada por leitura e `go vet`; homologação integrada é separada em BE-15/FE-15. Itens parciais permanecem abertos com o restante explícito. Não houve implementação de back-end nesta revisão.

- [x] **BE-01 — Restaurar compilação do login (entregue em `88731577`):** consulta por e-mail restaurada no SQL/sqlc, identificador adequado e `go vet ./...` aprovado em 08/11. Login normaliza o e-mail na entrada; a garantia de normalização dos registros existentes ainda deve ser conferida em BE-15. Não é mais bloqueio de FE-01.
- [ ] **BE-02 — Carga de desenvolvimento (parcial):** bcrypt e campos de pessoa/usuário já estão no seed. Restam confirmar a carga no banco usado pelo grupo, verificar login válido/inválido/e-mail inexistente e corrigir README, que ainda divulga `teste@email.com`. O seed contém `samuel@sellerhub.com`, `caio@sellerhub.com` e `vitor@sellerhub.com`, com senha de demonstração `123456`. Não recriar ou sobrescrever um banco existente sem avaliar seus dados. Não bloqueia implementar FE-01; é requisito do ensaio real.
- [ ] **BE-03 — Sessão (parcial; contrato já liberado para FE-03):** assinatura/expiração, middleware de produtos, consulta de sessão e logout estão implementados. Resta homologar os fluxos e definir com o grupo se a remoção do cookie atende ao recorte local ou se é necessária revogação no servidor; hoje, um JWT previamente copiado continua válido até expirar. Validar também a proteção das operações de escrita no ambiente de uso. Não exigir troca de mecanismo de autenticação nesta fila nem bloquear a integração do comportamento atual por essa decisão.
- [x] **BE-04 — Catálogo HTTP básico autenticado (entregue em `88731577`):** GET paginado com total, GET por ID, POST e PUT; usuário obtido do JWT; DTO de preço/IDs identificado; `:execrows` permite responder `404` quando não há linha acessível. Desbloqueia FE-04/FE-05/FE-06. A validação com PostgreSQL segue em BE-15 e o eventual catálogo compartilhado segue em DEC-02. Busca textual e novos campos não fazem parte da API entregue.
- [ ] **BE-05 — Campos e validações do produto (parcial):** nome/SKU obrigatórios com trim/limites e preço positivo com até duas casas já estão implementados. Restam resolver DEC-02, definir unicidade de SKU no domínio aprovado, controle de edição concorrente e respectivas respostas de conflito. Acrescentar persistência dos campos adicionais aprovados e combinar evolução do schema. Libera somente o cadastro básico; cadastro completo/FE-07 continuam dependentes desses itens.
- [ ] **BE-06 — Expor fotos e tratamento:** upload, consulta e vínculo ao produto/anúncio, validação de arquivo e retorno de prévia/versão tratada. Definir limites e falhas para o front-end, preservando foto real e aprovação da prévia. Desbloqueia FE-07 e imagens em FE-09.
- [ ] **BE-07 — Expor anúncios:** listar/consultar/criar/editar rascunhos, dados de produto/canal e situações; fornecer requisitos de categoria/canal e erros por campo. Implementar aprovação do conteúdo exato e retorno consultável da publicação, com proteção contra repetição. A tabela atual sozinha não implementa esses fluxos. Desbloqueia FE-08/FE-09.
- [ ] **BE-08 — Disponibilizar conexão e conector de marketplace:** fluxo de autorização, situação da conexão, reconexão e publicação/atualização autorizada, com resultado e falhas consultáveis. Informar capacidades por canal; ter Mercado Livre, Shopee e Amazon na tabela não implica suporte real. Desbloqueia publicação em FE-09 e canais em FE-13.
- [ ] **BE-09 — Expor geração assistida:** contrato de título/descrição, limites, falha/quota e retorno sempre como sugestão editável. Credenciais e chamadas ao provedor ficam na API. Desbloqueia a parte de IA de FE-09.
- [ ] **BE-10 — Expor consulta de vendas/pedidos:** paginação, filtros, itens, vínculo com produto, situações padronizadas e informação de atualização/falha por canal. Acordar os dados devolvidos à interface e resolver DEC-01 antes de qualquer comando de reposição. Desbloqueia FE-10.
- [ ] **BE-11 — Expor estoque e sincronização:** disponibilizar saldo por produto, situação por canal, divergências, última execução e pendências/falhas; combinar ações realmente suportadas e suas respostas. Garantir consistência e tratamento de repetição no servidor; não delegar cálculo do saldo ao Angular. Resolver DEC-01 para ajustes/reposições. Desbloqueia FE-11 e preferências de FE-13.
- [ ] **BE-12 — Expor indicadores:** definir métricas disponíveis, período, filtros, agregações, origem e atualização; distinguir indisponibilidade de valor zero. Não apresentar o histórico de exemplo como dado obtido dos canais. Desbloqueia FE-12.
- [ ] **BE-13 — Expor conta e preferências:** a sessão já retorna ID/e-mail, mas faltam perfil completo, edição dos campos aprovados, alteração de senha e preferências suportadas. O campo loja do protótipo não está no schema atual. Não expor hashes/credenciais na resposta. Desbloqueia as partes correspondentes de FE-13.
- [ ] **BE-14 — Definir recuperação de senha:** emissão/expiração/uso único do mecanismo de recuperação, redefinição e envio de instruções, com erros seguros e verificáveis. Desbloqueia FE-14.
- [ ] **BE-15 — Contratos e homologação por incremento (parcial):** o contrato atual de sessão/catálogo foi identificado e registrado neste documento; faltam ensaio HTTP com PostgreSQL e documentação do time reconciliada com o código. Verificar login/normalização, cookie e expiração, remoção do cookie no logout, persistência de cadastro/edição, isolamento por usuário, `404`, paginação e limites de entrada. Registrar evidências e incluir testes de comportamento: não há arquivos de teste Go versionados. Confirmar nomes/campos do contrato antes de novas mudanças incompatíveis. As rotas existentes liberam a implementação do front; não declarar integração concluída só com `go vet`.

## Decisões que precisam de alinhamento

- [ ] **DEC-01 — Vendas e estoque:** RF11 e o capítulo 4 preveem marcar pedido como cancelado e repor saldo; há orientação local de pedidos somente para consulta no MVP. O capítulo 4 também admite reposição repetida, e o registro de entrada aparece no protótipo sem requisito confirmado. Alinhar o recorte com o grupo antes de implementar botões de escrita; se houver reposição, definir controle contra duplicidade no servidor. Esta revisão não escolhe persistência de pedidos nem algoritmo de sincronização.
- [ ] **DEC-02 — Produto mínimo e vínculo ao usuário:** protótipo inclui descrição, categoria e características; API só persiste nome, SKU e preço, vinculados ao usuário do JWT. Já é possível construir/integrar esse recorte técnico; confirmar se ele atende à primeira entrega e quais campos devem ser acrescentados. A implementação isola produtos por usuário; confirmar se a conta única precisa de catálogo compartilhado. Não tratar o comportamento atual como aprovação automática de uma regra de produto.
- [ ] **DEC-03 — Canais e anúncios:** o protótipo impede selecionar canal já anunciado; o banco não garante anúncio único por produto/canal. Confirmar essa regra antes de bloquear na interface. Acordar campos obrigatórios e capacidades reais de cada canal; não assumir que os três do protótipo já serão integrados.

## Ordem de início definida em 08/11/2026 e critério de conclusão

Primeira frente: **login → estrutura interna/sessão → listagem de produtos → novo produto → detalhe/edição de produto**. O resumo por página e a prioridade de apoio do back-end estão em [AGENTS.md](AGENTS.md), para orientar os integrantes e seus agentes. As tarefas detalhadas e seus estados continuam somente nesta fila; nenhuma tarefa FE foi marcada como iniciada/concluída por essa definição.

Começar **FE-01 → FE-02/FE-03 → FE-04 → FE-05/FE-06**, integrando as rotas já entregues, sem esperar novos endpoints de catálogo. Preparar o ambiente e a homologação em BE-02/BE-15; fechar o fluxo com FE-15. BE-05 e DEC-02 condicionam a ampliação/aceite do cadastro completo, sem impedir a construção do recorte básico. Depois, avançar anúncios e conexão de canal; liberar Vendas, Estoque, Indicadores e Administração conforme os contratos correspondentes. A ordem entre módulos posteriores pode mudar por decisão do grupo.

Marcar um item como concluído somente após registrar o que foi entregue e sua verificação. Uma tela visualmente pronta pode fechar a parte de interface, mas deve manter a integração pendente com o respectivo ID de back-end. Em cada retomada, conferir arquivos/rotas e atualizar este documento, sem presumir que esta fotografia permanece atual.

## Verificações desta avaliação

- Revisão de 08/11: leitura do diff completo de `88731577` contra seu pai, dos 11 arquivos de API/seed alterados, do schema e dos arquivos atuais de autenticação/rotas/configuração Angular. A árvore estava limpa antes da avaliação; não houve busca de alterações remotas.
- `go vet ./...` em `api/`: **aprovado em 08/11/2026**. Confirma a correção do bloqueio de compilação relatado em 05/11; não verifica banco, comportamento HTTP ou integração Angular.
- Não há testes Go versionados. Não foram executados API/PostgreSQL, ensaio de cookie/navegador ou chamadas a marketplaces. A carga do seed no banco local não foi presumida.
- Última execução conhecida de `npm.cmd test -- --watch=false`: **6 testes/2 arquivos aprovados em 05/11/2026**. Não repetida nesta revisão, pois o último commit não altera Angular e esta atualização só altera documentação/instruções. São testes HTTP simulados que ainda esperam a URL antiga.
- `git diff --check`, referências dos IDs da fila e links locais conferidos ao concluir. Nenhum código de aplicação, schema ou arquivo gerado foi alterado; sem commit/push.
