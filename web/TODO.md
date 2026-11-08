# Front-end — telas, dependências e to-dos

Atualização em **08/11/2026**, com desenvolvimento local iniciado após `5e17d586` (planejamento). A base de back-end permanece em `88731577` (06/11/2026, middleware de sessão e produtos paginados). Este documento concentra a fila compartilhada, o detalhamento das 15 tarefas FE, os pedidos ao back-end, a distribuição entre Caio e Leticia e as verificações realizadas. Os checklists distinguem código implementado de fluxo integralmente validado.

## Como interpretar o estado

- **Pode avançar agora:** implementação visual e comportamento local independentes da API.
- **Liberado para implementar e integrar:** há endpoint e contrato identificáveis no código, e `go vet` passou. O front pode começar a integração após alinhar URL/proxy; isso não comprova funcionamento com o banco e o navegador.
- **Pode avançar com simulação:** componentes, formulários e estados usando dados fictícios separados dos serviços HTTP. O contrato continua pendente; simulação não comprova persistência nem integração.
- **Integração bloqueada:** ainda não há API utilizável para concluir o fluxo real.

**Login/proxy, consulta de sessão/saída e estrutura interna já têm implementação local.** O serviço HTTP de produtos está preparado; páginas de catálogo continuam pendentes com Leticia. O ensaio HTTP com Go/PostgreSQL passou em 42 cenários e o produto criado/editado foi conferido por SQL. O usuário confirmou no navegador senha incorreta/correta, entrada em `/inicio`, identificação, recarga, saída e bloqueio de acesso após sair. Acessibilidade, demais cenários e fluxo completo do catálogo continuam pendentes. A liberação é limitada aos campos e operações abaixo; tabelas, exemplos e protótipos não equivalem a endpoints disponíveis.

## O que o commit de aplicação `88731577` desbloqueou

| Pendência anterior | Entrega em `88731577` | Situação após a revisão |
| --- | --- | --- |
| BE-01: API não compilava | Consulta de usuário restaurada, sqlc atualizado e identificador corrigido para `IDUsuario`/`int32`. | Resolvido; `go vet ./...` passou em 08/11. |
| BE-02: hashes fictícios no seed | Três usuários de desenvolvimento passaram a usar bcrypt; senha documentada no seed. | Carga e login HTTP real verificados nesta cópia; ambientes dos demais integrantes e ensaio pelo navegador seguem pendentes. |
| BE-03: só emissão de JWT | Validação HS256/expiração, middleware, `GET /api/sessao` e `POST /api/logout`. | Libera FE-03; logout remove cookie, sem revogar JWT. Homologação e decisão sobre revogação permanecem pendentes. |
| BE-04: produtos só no SQL | Controller/service/rotas HTTP autenticadas, paginação/total e atualização com contagem de linhas. | Base HTTP entregue; libera FE-04/FE-05/FE-06 para o cadastro básico. |
| BE-05: validações do produto | Nome/SKU obrigatórios com limites e preço positivo com até duas casas. | Parcial: sem unicidade de SKU, controle de versão ou campos adicionais do protótipo. |
| FE-01 a FE-15 | O commit não altera arquivos do Angular. | Nenhuma tarefa FE foi concluída por essa entrega de back-end. |

## Evidências do código

| Evidência | Consequência para o front-end |
| --- | --- |
| [`app.routes.ts`](src/app/app.routes.ts) contém login, tratamento de indisponibilidade, página inicial protegida e página não encontrada, com carregamento sob demanda. | A estrutura está implementada. `/inicio` é o destino provisório até as páginas de catálogo serem entregues; o menu identifica os módulos pendentes. |
| [`auth.service.ts`](src/app/services/auth.service.ts) usa `/api/login`, `/api/sessao` e `/api/logout`; [`proxy.conf.json`](proxy.conf.json) encaminha `/api/**` para a API local. | A incompatibilidade de URL/origem foi corrigida no código Angular. O proxy foi verificado com resposta de um serviço temporário simulado; não com Go/PostgreSQL. |
| [`login.go`](../api/internal/service/login.go), [`queries.sql`](../api/internal/db/queries.sql) e sqlc agora usam `GetUserByEmail` e `IDUsuario`. | Bloqueio de compilação resolvido, confirmado por `go vet ./...`. |
| [`session.go`](../api/internal/service/session.go) valida assinatura HS256/expiração; [`middleware`](../api/internal/controller/session.go) protege sessão e todas as rotas de produto. | Já é possível consultar usuário e tratar `401`. Cookie `sessao` continua HttpOnly/SameSite Strict/8 horas. Não ler o cookie no Angular nem guardar JWT em localStorage. |
| [`login.go`](../api/internal/controller/login.go) implementa consulta de sessão e logout por remoção de cookie. | FE-03 está liberado para esse comportamento. Um JWT previamente copiado continua válido até expirar; não anunciar revogação no servidor. |
| [`dados.sql`](../db/dados.sql) contém bcrypt para os três usuários de desenvolvimento e o guia de execução usa uma conta fictícia desse seed. | Carga local conferida e login HTTP de duas contas aprovado; senha incorreta/e-mail inexistente retornaram `401`. Não recriar banco automaticamente. |
| [`product.go`](../api/internal/controller/product.go) e seu [`service`](../api/internal/service/product.go) expõem lista, detalhe, criação e atualização. SQL usa `LIMIT/OFFSET`, contagem e `:execrows`. | Libera catálogo básico com paginação. Produto inexistente ou de outro usuário retorna `404`; não se perde mais esse caso na atualização. |
| `CAD_PRODUTO` contém ID, usuário, SKU, nome e preço decimal. | Descrição, categoria, características, fotos, saldo e unicidade de SKU não estão implementados no schema. O protótipo de novo produto pede mais campos que o banco atual. |
| Existem tabelas de anúncios, marketplaces, auditoria e métricas. | Não há consultas e rotas desses módulos, conectores, OAuth ou chamadas Gemini. Os registros de exemplo não comprovam canais conectados. |
| Não há saldo de produto, API de estoque nem consulta externa de pedidos. | Estoque e Vendas ainda não têm fonte real de dados. A ausência de tabela de pedidos, isoladamente, não obriga sua persistência; o fluxo precisa ser acordado. |

## Implementação local disponível para a dupla

| Item | Entrega | O que falta para concluir |
| --- | --- | --- |
| FE-01 | Login relativo, proxy, validações preservadas, confirmação de sessão e ensaio real básico no navegador confirmado pelo usuário. | Auditoria de acessibilidade e cenários de falha restantes. |
| FE-02 | Estrutura responsiva, conta por e-mail, menu, saída, foco inicial e tratamento de rota inexistente. | Integração das páginas FE-04/FE-05/FE-06 e conferência visual/AXE. |
| FE-03 | Guard, consulta de sessão, recuperação de indisponibilidade, interceptor de `401`, logout e proteção contra respostas atrasadas de outra sessão. | Ensaio real de cookie/expiração/saída e conferência de interface. |
| Serviço de produtos | [`ProdutosService`](src/app/produtos/produtos.service.ts) e [`modelos`](src/app/produtos/produto.model.ts) para as páginas de Leticia. | Usar nas páginas e verificar persistência com Go/PostgreSQL. Não conclui FE-04/FE-05/FE-06. |
| Ambiente de desenvolvimento sem banco | Simulador HTTP isolado, comandos próprios, aviso permanente e cenários de catálogo/vazio/falhas/atraso/expiração; instruções em [README.md](README.md). | As páginas continuam com Leticia. O simulador apoia o desenvolvimento; não conclui integração ou homologação real. |
| Verificação da base | Testes Angular, 42 cenários HTTP reais, conferência SQL e roteiro de acesso/recarga/saída no navegador confirmado pelo usuário. | AXE/390 px/teclado, indisponibilidade no navegador, expiração temporal e persistência após reinício. |

O serviço disponibiliza `listar(pagina, limite)`, `consultar(id)`, `cadastrar(dados)` e `atualizar(id, dados)`. O modelo interno usa `nome`, `sku` e `precoBase`; `listar` retorna `itens`/`total`. O serviço adapta o JSON da API (`name`, `basePrice`, `items`), sem cache de produtos, conversão para centavos ou fallback simulado. As páginas devem tratar erros e descartar seus dados ao serem destruídas/encerrar a sessão. Nenhum serviço foi inventado para anúncios/pedidos enquanto faltam esses contratos.

## Contrato disponível para o front-end

Contrato extraído das rotas, controllers e services atuais, posteriormente verificado por HTTP direto com PostgreSQL local. As chamadas do Angular devem usar a própria origem com proxy `/api` após FE-01. O navegador gerencia o cookie; não há token JWT no JSON de login. Verificações de navegador/proxy são separadas do ensaio HTTP direto.

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
| Login (RF01) | **Implementado e verificado no recorte básico:** API/seed e roteiro no navegador confirmados. | Falta auditoria de acessibilidade e cenários de falha restantes. | FE-01, BE-02, BE-15 |
| Estrutura interna e navegação | **Implementada em parte:** `/inicio`, menu, usuário por e-mail, guard, expiração/saída e página não encontrada. | Páginas do catálogo e verificação visual pendentes. Nome/loja não vêm da sessão; revogação do JWT segue em BE-03. | FE-02, FE-03, BE-03 |
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

### Regras de desenvolvimento e conclusão

FE-01/FE-02/FE-03 têm implementação iniciada, com código e testes abaixo; permanecem abertas até cumprir as verificações de aceite. Demais tarefas continuam pendentes. Caio coordena infraestrutura, contratos, serviços/modelos compartilhados e integrações externas. Leticia desenvolve as páginas, formulários e componentes indicados na divisão, incluindo seus estados e testes. FE-09 e FE-13 têm partes atribuídas a cada pessoa; FE-15 reúne o ensaio integrado, sem concentrar todos os testes no fim.

- **Estrutura:** Angular standalone, `OnPush`, signals para estado local, formulários reativos, rotas sob demanda e tipos sem `any`. Criar serviços/componentes compartilhados quando houver uso concreto, sem biblioteca de estado global ou framework de CRUD antecipado.
- **Interface:** usar os protótipos existentes como referência; contemplar desktop e largura de 390 px, teclado, foco visível, labels, mensagens associadas aos campos e anúncios de carregamento/erro/sucesso. Atender WCAG AA e verificar AXE nas telas alteradas.
- **Estados:** diferenciar carregando, vazio, falha, sucesso e processamento pendente quando aplicável. Evitar envios duplicados e preservar os dados digitados quando uma gravação falhar.
- **Contrato:** manter DTOs HTTP compatíveis com a API e rótulos em português. Credenciais, autorização de marketplaces e Gemini ficam no Go. Um guard Angular não substitui a autorização da API.
- **Liberação:** FE-01 a FE-06 podem integrar a API atual após o ajuste de proxy. Nas demais, interface/simulação e integração são entregas separadas; não presumir nomes de novos endpoints ou campos ainda não combinados.
- **Simulação:** usar dados fictícios em fonte explicitamente selecionada para desenvolvimento; falha da API real nunca deve trocar silenciosamente para dados simulados. Registrar qual parte foi verificada com simulação.
- **Verificação:** rodar os testes pertinentes à mudança e `npm.cmd run build`; cobrir riscos do fluxo, sem espelhar cada linha de HTML. Integração precisa de evidência com API/banco reais e, no caso de publicação, execução externa autorizada.
- **Registro:** marcar a tarefa somente quando seus critérios e as regras comuns forem atendidos. Se apenas a interface estiver pronta, registrar essa entrega e manter a integração aberta com seu ID BE. Não alterar status de back-end sem evidência.

### FE-01 — Login e comunicação com a API

- [ ] **FE-01 — Alinhar e integrar o login.**

**Responsável:** Caio. **Situação:** implementado; HTTP real e roteiro básico no navegador confirmados, aguardando acessibilidade e cenários de falha restantes. **Dependências:** BE-02/BE-15 para o ensaio; FE-03 para entrada na área interna. **Referência:** RF01.

**Requisitos de desenvolvimento**

- Reaproveitar `login/` e `AuthService`; trocar a URL absoluta antiga por `POST /api/login`, mantendo `email`/`password` no corpo.
- Criar/configurar o proxy de desenvolvimento para `http://localhost:8080` em `angular.json`. Documentar reinício do servidor após a configuração e manter o acesso de produção dependente da origem configurada para implantação, ainda não definida.
- Preservar validações existentes: e-mail obrigatório/válido, senha obrigatória e limite de 72 bytes; manter bloqueio de repetição, limpeza da senha e mensagens acessíveis.
- Tratar `400`, credenciais inválidas (`401`), falha interna, indisponibilidade e timeout. Em sucesso, integrar FE-03 antes de entrar no catálogo; não usar apenas a mensagem de sucesso como prova de sessão.

**Critérios de aceite**

1. No teste HTTP, formulário válido envia uma única requisição ao caminho relativo e com o corpo correto; inválido não envia. Cliques repetidos durante envio não duplicam o POST.
2. Sucesso, senha incorreta, dados inválidos e API indisponível têm resultados distintos; nova tentativa fica disponível sem reter a senha.
3. Com API e banco preparados, o navegador recebe o cookie via proxy e a consulta de sessão posterior funciona, sem ler o JWT em JavaScript ou guardá-lo no navegador por código da aplicação.
4. As expectativas dos testes deixam de exigir `http://localhost:8080/login`; navegação e foco são conferidos em sucesso/erro.

### FE-02 — Estrutura interna e navegação

- [ ] **FE-02 — Construir a estrutura das páginas internas.**

**Responsável:** Caio. **Situação:** estrutura implementada; integração do catálogo e verificação visual pendentes. **Dependências:** FE-03 para acesso autenticado e FE-04 para o destino definitivo; `/inicio` é o destino provisório.

**Requisitos de desenvolvimento**

- Criar estrutura com menu, área principal, título da página, identificação pelo e-mail da sessão e ação de saída. Evitar nome/loja fixos do protótipo.
- Organizar rotas por funcionalidade e carregar as páginas sob demanda. Proposta de caminhos internos: `/produtos`, `/produtos/novo`, `/produtos/:id` e `/produtos/:id/editar`; conservar o login atual na raiz, salvo ajuste combinado entre a dupla.
- Definir tratamento de rota desconhecida e retorno para uma página disponível. Menus de módulos sem entrega devem indicar indisponibilidade ou permanecer fora da navegação ativa.
- Manter a estrutura utilizável em tela estreita, com ordem de foco coerente, identificação da opção ativa e atualização do título/foco ao navegar.

**Critérios de aceite**

1. Depois de autenticado, é possível ir da lista ao cadastro/detalhe/edição e voltar; acesso direto e recarga de uma URL interna preservam a rota após a validação de sessão.
2. Usuário sem sessão não recebe conteúdo interno enquanto FE-03 consulta a API; rota inválida tem recuperação sem ciclo de redirecionamento.
3. Menu, saída e conteúdo são operáveis por teclado e a 390 px, sem esconder ações essenciais.
4. A estrutura não cria páginas vazias apresentadas como funcionalidades prontas nem exibe identidade fictícia em acesso real.

### FE-03 — Sessão, proteção de navegação e saída

- [ ] **FE-03 — Integrar consulta de sessão, expiração e logout.**

**Responsável:** Caio. **Situação:** testes Angular/HTTP real aprovados; usuário confirmou sessão após F5, saída e bloqueio de retorno no navegador. Expiração temporal, acessibilidade e recuperação de indisponibilidade no navegador pendentes. **Dependências:** FE-01; BE-03/BE-15 para homologação. **Referência:** RF01/RNF02.

**Requisitos de desenvolvimento**

- Ampliar o serviço de autenticação para `GET /api/sessao` e `POST /api/logout`, mantendo estado em memória de consulta pendente, autenticado ou sem sessão.
- Criar guard para rotas internas e tratamento comum de `401` nas chamadas protegidas, sem interpretar `401` do próprio login como expiração. Evitar loops e redirecionamentos duplicados em falhas simultâneas.
- Diferenciar sessão inválida de indisponibilidade: erro de rede/`500` permite tentar consultar novamente e não equivale a senha incorreta ou logout confirmado.
- Em saída confirmada, limpar usuário e dados carregados da conta, voltar ao login e impedir reaproveitamento visual do catálogo após troca de usuário. Em falha de saída, informar o problema sem declarar cookie removido.
- Respeitar o limite atual: logout remove cookie, mas não revoga JWT já emitido. Qualquer alteração dessa semântica é BE-03.

**Critérios de aceite**

1. Sessão válida permite acesso direto e recarga; cookie ausente/expirado encaminha ao login sem exibir dados protegidos.
2. Testes de guard/serviço cobrem `200`, `401`, indisponibilidade e sucesso/falha de logout; os fluxos de erro não entram em repetição.
3. Depois de sair e tentar voltar/recarregar, o navegador precisa autenticar de novo; uma nova conta não recebe dados mantidos em memória da anterior.
4. Não há leitura de cookie HttpOnly, persistência de JWT em localStorage/sessionStorage ou falsa promessa de revogação no servidor.

### FE-04 — Listagem paginada de produtos

- [ ] **FE-04 — Construir e integrar a lista de produtos.**

**Responsável:** Leticia. **Situação:** liberado. **Dependências:** FE-01/FE-03 para integração; BE-15 para homologação. **Referência:** RF03.

**Requisitos de desenvolvimento**

- Construir a página de produtos consumindo os tipos e o serviço HTTP preparados por Caio, com `id`, `name`, `sku`, `basePrice` e resposta `items`/`total`. Leticia implementa tabela, paginação, ações e estados da tela.
- Exibir nome, SKU e preço formatado em reais, acesso a novo produto e detalhe/edição. Não acrescentar exclusão, saldo, canais ou busca remota ainda ausentes.
- Consumir `GET /api/produtos` com página inicial 1 e limite inicial 20; manter página/limite na tela e calcular a navegação a partir do total. Aceitar somente limites suportados, entre 1 e 100.
- Prever carregamento, resultado vazio, erro e nova tentativa; impedir que uma resposta antiga substitua a página mais recente durante mudanças rápidas de paginação.

**Critérios de aceite**

1. Testes HTTP verificam parâmetros e mapeamento; total zero exibe vazio, total maior que o limite permite avançar e a última página impede avanço indevido.
2. `401` aciona FE-03; falha de rede/`500` oferece nova tentativa sem trocar para simulação.
3. Após cadastrar/editar, a listagem consultada apresenta os valores atualizados. A ordem e o total vêm da API.
4. No ensaio com banco, cada usuário vê apenas seu catálogo atual; leitura em desktop e tela estreita mantém nome, SKU, preço e ações acessíveis.

### FE-05 — Cadastro básico de produto

- [ ] **FE-05 — Construir e integrar o formulário de novo produto.**

**Responsável:** Leticia. **Situação:** liberado para três campos. **Dependências:** FE-04 e FE-01/FE-03; BE-05/DEC-02 para o recorte completo. **Referência:** RF02.

**Requisitos de desenvolvimento**

- Criar formulário reutilizável pelo cadastro/edição, com nome, SKU e preço base; ações salvar/cancelar e mensagens por campo.
- Validar nome/SKU após trim, obrigatoriedade e limites de 255/100 caracteres conforme contrato; preço obrigatório, maior que zero, menor que 100.000.000 e com até duas casas decimais. Não arredondar silenciosamente uma entrada inválida.
- Aceitar a entrada monetária em formato compreensível ao usuário e enviar `basePrice` como número JSON decimal, sem símbolo monetário e sem conversão para centavos no contrato atual.
- Enviar POST com `name`, `sku`, `basePrice`, sem `id_usuario`; tratar `201`/ID e encaminhar para detalhe ou atualizar a lista, conforme navegação combinada.
- Manter unicidade de SKU, campos adicionais e eventual catálogo compartilhado como pendências explícitas; o front não pode garantir unicidade consultando apenas a página carregada.

**Critérios de aceite**

1. Testes de formulário cobrem valores vazios, limites e preço zero/negativo/com mais de duas casas; envio inválido não chama a API e indica o campo a corrigir.
2. Requisição válida tem nomes/tipos do contrato; um clique duplo não cria duas requisições durante o envio.
3. Somente `201` confirma o cadastro; falha preserva os campos e oferece correção/nova tentativa. O ID retornado pode ser aberto no detalhe.
4. Cadastro feito no ensaio continua disponível após recarga. A entrega dos três campos é identificada como básica até DEC-02 definir o aceite do cadastro completo.

### FE-06 — Detalhe e edição de produto

- [ ] **FE-06 — Construir e integrar consulta por ID e edição básica.**

**Responsável:** Leticia. **Situação:** liberado para três campos. **Dependências:** FE-04/FE-05; BE-05 para conflitos/campos adicionais. **Referência:** RF04.

**Requisitos de desenvolvimento**

- Carregar `GET /api/produtos/{id}` antes de mostrar o formulário preenchido; disponibilizar detalhe, ação editar e retorno à lista.
- Reutilizar os controles/validações de FE-05 e salvar por PUT com o corpo completo dos três campos suportados.
- Tratar carregamento, ID inválido, `404`, `401`, erro de leitura e falha de gravação. Produto de outro usuário também aparece como não encontrado conforme API atual.
- Cancelar a edição sem enviar alterações; preservar dados digitados em erro de gravação. Não simular controle de versão ou tratamento de `409` inexistente; ampliá-los quando BE-05 entregar o contrato.

**Critérios de aceite**

1. Abertura direta por URL consulta o ID correto; sucesso preenche nome/SKU/preço, `404` exibe recuperação para a lista e não abre formulário vazio como se fosse cadastro.
2. Testes verificam GET/PUT, corpo e validações; cancelar não envia PUT, e falha de gravação preserva alterações locais.
3. Após `200`, detalhe/lista e nova recarga exibem o valor persistido; troca de ID não reaproveita dados do produto anterior.
4. Ensaio confirma que consultar/editar registro de outro usuário não altera o catálogo e recebe o tratamento de `404`.

### FE-07 — Dados complementares e fotos reais

- [ ] **FE-07 — Complementar o produto conforme contrato aprovado.**

**Responsável:** Leticia, com serviço de upload/tratamento preparado por Caio após definição do contrato. **Situação:** prévia visual possível; integração bloqueada. **Dependências:** FE-05/FE-06, BE-05, BE-06 e DEC-02.

**Requisitos de desenvolvimento**

- Confirmar com o back-end quais campos entram no incremento: descrição base, categoria e características do produto. Acrescentar somente campos com regra e persistência acordadas.
- Construir seleção e prévia de foto real, indicação de arquivo selecionado/enviando/salvo/erro e vínculo ao produto. Quantidade, formatos, tamanho e dimensões seguem limites fornecidos pela API, sem números inventados pelo front.
- Oferecer recorte/redimensionamento ou prévia de tratamento somente quando o recurso for suportado; preservar a distinção entre original e versão tratada e exigir revisão da prévia.
- Remover seleção local sem afirmar exclusão remota; remoção/substituição/ordenação persistidas dependem de operações definidas em BE-06. Não gerar foto de produto fictício.

**Critérios de aceite**

1. Prévia local é identificada como seleção ainda não salva; sucesso de upload só é indicado após confirmação da API.
2. Arquivo inválido ou upload com falha recebe mensagem e recuperação, sem desaparecer com campos já preenchidos.
3. Após salvar e reabrir o produto no ensaio, campos/fotos persistidos retornam corretamente; seleção local isolada não atende esse critério.
4. A prévia permite revisar o produto sem deformação; aprovação não é reaproveitada automaticamente se o arquivo tratado mudar.

### FE-08 — Listagem e gestão de anúncios

- [ ] **FE-08 — Construir e integrar a consulta de anúncios por produto/canal.**

**Responsável:** Leticia, usando o serviço e o modelo de anúncios preparados por Caio. **Situação:** interface com simulação possível; integração bloqueada. **Dependências:** FE-03/FE-04, BE-07 e BE-08 para ações externas. **Referência:** RF05.

**Requisitos de desenvolvimento**

- Listar anúncio, produto/SKU, canal, preço e situação conforme DTO acordado; permitir abrir rascunho/detalhe/edição e iniciar novo anúncio.
- Implementar paginação e filtros apenas quando o contrato suportar; distinguir rascunho, situação remota e operação em processamento/falha sem reduzi-los a um único sucesso genérico.
- Mostrar identificador/link externo quando devolvido pela API. Pausar, reativar ou outras ações de gestão só entram quando houver capacidade e contrato disponíveis.
- Exibir lista vazia, carregamento, falha e nova tentativa. Canais cadastrados no banco não devem aparecer como conectados por esse motivo.

**Critérios de aceite**

1. Testes com respostas acordadas verificam associação produto/canal e situações; filtros/paginação não alteram silenciosamente a fonte dos dados.
2. Abrir anúncio encaminha ao registro correto; ação indisponível não pode ser acionada como operação real.
3. Operação pendente/falha não aparece como anúncio publicado ou removido sem confirmação da API.
4. Integração só é concluída com listagem real de BE-07; retorno de publicação de FE-09 atualiza o registro correspondente.

### FE-09 — Editor, IA, revisão e publicação de anúncio

- [ ] **FE-09 — Construir o fluxo completo de preparação e publicação.**

**Responsáveis:** Leticia pelo formulário/editor manual e prévia; Caio pelos serviços, geração assistida, controle de aprovação e publicação. **Situação:** interface possível; integrações bloqueadas. **Dependências:** FE-04/FE-07/FE-08 e canais de FE-13; BE-07/BE-08, BE-09 para IA, BE-06 para fotos; DEC-03. **Referência:** RF06.

**Divisão das subentregas:** Leticia implementa seleção de produto/canal, campos, validações locais, prévia de texto/fotos/preço, apresentação dos estados e testes desses componentes. Caio fornece métodos/modelos, integra Gemini e publicação e implementa a coordenação de revisão/operação com o back-end. Combinar entradas/saídas dos componentes antes de alterar os mesmos arquivos. Cada parte mantém registro de entrega próprio até o fluxo completo atender aos critérios abaixo.

**Requisitos de desenvolvimento**

- **Preparação:** selecionar produto persistido e canal disponível, aproveitar seus dados, editar título/descrição/preço e apresentar categoria/atributos obrigatórios retornados pela API. Preservar rascunho por confirmação do servidor; não inventar campos universais para todos os canais.
- **IA:** solicitar sugestões pelo Go, apresentar carregamento/falha/quota e permitir aplicar/editar título e descrição. Gerar novamente não pode substituir texto revisado sem ação explícita; edição manual continua disponível se a IA falhar.
- **Revisão:** mostrar conteúdo, fotos, preço e destino em prévia; exigir ação humana explícita para aprovar/publicar. Mudança de conteúdo, foto, preço ou canal exige nova revisão, em conjunto com o controle de versão do servidor.
- **Publicação:** impedir duplo envio e acompanhar retorno/ID de operação conforme contrato. Distinguir aceitação/processamento de publicação concluída; mostrar ID/link externo somente quando confirmado.
- **Recuperação:** em timeout/resultado desconhecido, consultar a operação antes de oferecer repetição de criação; o front não deve repetir o POST de publicação automaticamente. Resolver DEC-03 antes de impedir canal com anúncio existente.

**Critérios de aceite**

1. Rascunho salvo pode ser reaberto com seus dados; campos obrigatórios ausentes bloqueiam o envio e ficam identificados. A validação final continua na API.
2. Testes de IA mostram sugestão editável e preservação do texto manual em falha/regeneração; nenhuma geração dispara publicação.
3. Testes de aprovação cobrem alteração posterior e clique duplo; a operação referencia a revisão efetivamente mostrada e aprovada, conforme contrato de BE-07.
4. Uma resposta de processamento não exibe sucesso final; falha/resultado desconhecido mantém caminho de consulta e recuperação sem duplicar envio.
5. Conclusão exige publicação real autorizada no Mercado Livre com ID externo verificável, além de sugestão Gemini revisável e fotos suportadas. Subentregas de editor, IA e publicação devem ser registradas separadamente até esse fluxo completo existir.

### FE-10 — Consulta de vendas e pedidos

- [ ] **FE-10 — Construir listagem e detalhe de pedidos para consulta.**

**Responsável:** Leticia, usando o serviço e o modelo de pedidos preparados por Caio. **Situação:** interface com simulação possível; integração bloqueada. **Dependências:** FE-03, BE-10 e DEC-01 para qualquer escrita. **Referência:** RF07; RF11 permanece em decisão.

**Requisitos de desenvolvimento**

- Acordar campos e situações; como base de consulta, prever ID externo, canal, data, situação, itens/quantidades e valores disponibilizados, sem exigir dados pessoais de compradores para preencher a tela.
- Implementar paginação, filtros por período/canal/situação e detalhe somente conforme recursos da API. Exibir origem, atualização e falha parcial de canal quando informadas.
- Manter o recorte de consulta: cancelamento/reposição depende de DEC-01 e de operação segura do back-end; envio, faturamento e pós-venda não fazem parte desta tarefa.
- Distinguir nenhuma venda no período de falha ao consultar o canal; não calcular ou movimentar estoque no Angular a partir da lista.

**Critérios de aceite**

1. Lista/detalhe exibem o mesmo pedido e seus itens; filtros respeitam o contrato e a situação exibida segue a padronização acordada.
2. Testes cobrem vazio, múltiplas páginas, falha parcial/total e nova tentativa; indisponibilidade não vira total zero de vendas.
3. O ensaio integrado usa consulta real e permite reconhecer atualização/origem. Ações de escrita continuam ausentes até decisão/contrato específicos.

### FE-11 — Estoque e divergências

- [ ] **FE-11 — Construir acompanhamento de saldo e sincronização.**

**Responsável:** Leticia, consumindo o serviço/modelo de estoque preparado por Caio. **Situação:** interface com simulação possível; integração bloqueada. **Dependências:** FE-03/FE-04, BE-11 e DEC-01 para ajustes manuais. **Referência:** RF08.

**Requisitos de desenvolvimento**

- Mostrar produto/SKU, saldo local, situação por canal, última atualização e divergências/pendências devolvidas pela API. Manter visíveis dados desatualizados e falhas com identificação clara.
- Diferenciar sincronizado, processando e com falha conforme contrato; não inferir estoque a partir de preço, número de anúncios ou linhas de pedidos.
- Ação de sincronizar novamente ou ajuste de saldo só entra após contrato/capacidade explícitos, com bloqueio de repetição e retorno da operação. Entrada/reposição manual continua sujeita a DEC-01.
- Refletir a exceção já aprovada: sincronização de saldo após vendas pode ser automática; isso não aprova conteúdo/preço de anúncio. A tela acompanha a rotina do servidor.

**Critérios de aceite**

1. Testes apresentam saldo, divergência, canal afetado e horário corretamente; informação ausente/desatualizada não aparece como sincronização confirmada.
2. Uma falha de atualização preserva o último dado com aviso, permite nova consulta e não recalcula saldo no cliente.
3. No ensaio, uma mudança controlada de saldo executada pelo back-end aparece após consulta; confirmações dependem do estado real da operação/canal, sem promessa de atualização instantânea.
4. Botões sem operação disponível não simulam ajuste/sincronização bem-sucedida; saldo com falta, se suportado, segue o significado definido pela API.

### FE-12 — Indicadores

- [ ] **FE-12 — Construir consulta dos indicadores disponíveis.**

**Responsável:** Leticia, consumindo o serviço/modelo de indicadores preparado por Caio. **Situação:** interface com simulação possível; integração bloqueada. **Dependências:** BE-12 e contratos de vendas/anúncios pertinentes. **Referência:** RF09/RF10.

**Requisitos de desenvolvimento**

- Acordar quais métricas existem, suas definições, período, moeda/unidade, origem e filtros. Prever acessos a anúncios e desempenho das vendas apenas quando esses dados forem fornecidos.
- Apresentar valores e, quando útil, gráficos simples com rótulos, unidades e alternativa textual/tabular acessível; não introduzir biblioteca antes da necessidade concreta.
- Distinguir zero, sem dados, indisponível e informação desatualizada. Não inferir conversão, receita ou comparações a partir de registros incompletos ou de denominador não acordado.

**Critérios de aceite**

1. Alterar filtros consulta o período/canal correto; valores e unidades exibidos correspondem à resposta, com indicação de atualização.
2. Testes cobrem valor zero, ausência de dado e falha; não há percentuais indefinidos, números fictícios em modo real ou gráfico sem leitura textual equivalente.
3. Resultado integrado confere com a fonte retornada pelo back-end para uma amostra conhecida; dados de demonstração não contam como métrica real.

### FE-13 — Administração, canais e preferências

- [ ] **FE-13 — Construir a administração por subentregas independentes.**

**Responsáveis:** Leticia pelas seções de conta e preferências; Caio pela conexão/reconexão de canais e pelos serviços compartilhados. **Situação:** ID/e-mail liberados; perfil/canais/preferências bloqueados. **Dependências:** FE-03, BE-08, BE-11 e BE-13.

**Divisão das subentregas:** Leticia entrega apresentação de ID/e-mail, formulários dos campos aprovados, preferências, mensagens, validação e testes dessas seções. Caio entrega o fluxo de canais e seus adaptadores HTTP, além dos métodos para consultar/salvar conta e preferências quando liberados. As seções devem ser componentes separados, sem uma pessoa reimplementar o formulário da outra.

**Requisitos de desenvolvimento**

- **Canais, primeiro subincremento após a base:** exibir capacidades e situações reais de conexão; oferecer conectar/reconectar pelo fluxo indicado pela API. Troca de código, tokens e credenciais ficam no Go; não implementar OAuth no Angular nem exibir token na tela.
- **Conta:** reutilizar ID/e-mail da sessão inicialmente em leitura; mostrar nome/loja, permitir edição e alterar senha apenas após BE-13 expor esses recursos. Nunca preencher formulário com hash ou senha armazenada.
- **Preferências:** representar somente opções suportadas de estoque/sincronização, validar campos e salvar por confirmação do servidor. Os valores do protótipo não são configuração real nem regras aprovadas por si só.
- Manter carregamento, falha e salvamento separados por seção, preservando mudanças em erro e evitando que salvar uma seção sobrescreva outra com valores padrão.

**Critérios de aceite**

1. Sem BE-13, ID/e-mail podem ser exibidos, mas a página não anuncia gravação de perfil/preferências inexistente.
2. Testes de canais cobrem desconectado, conectado, expirado e falha conforme contrato; ter canal na tabela não basta para indicar conexão.
3. No ensaio de conexão real, o retorno é conferido consultando a API antes de mostrar conectado; nenhuma credencial de marketplace é persistida pelo código Angular.
4. Perfil/preferências, quando liberados, persistem após reabrir a seção; falha não apaga os valores editados ou afirma sucesso.
5. As três subentregas são registradas separadamente até todas as seções aprovadas estarem integradas. Não acrescentar gestão de perfis ou cadastro público.

### FE-14 — Recuperação e redefinição de senha

- [ ] **FE-14 — Construir solicitação e redefinição conforme mecanismo da API.**

**Responsável:** Leticia, com serviço e contrato de recuperação coordenados por Caio com o back-end. **Situação:** desenho possível; integração bloqueada. **Dependências:** BE-14 e FE-01; requisito continua pendente, sem adiamento aprovado. **Referência:** RF12.

**Requisitos de desenvolvimento**

- Após definir contrato, criar acesso a partir do login, formulário de solicitação e formulário de redefinição com nova senha/confirmação e regras devolvidas/acordadas com a API.
- Seguir as mensagens e estados seguros do servidor, inclusive solicitação recebida, link/token inválido, expirado ou já utilizado. Não apresentar envio de instruções sem resposta real.
- Permitir voltar ao login ao concluir. Não guardar nova senha ou token de recuperação em logs, armazenamento do navegador ou mensagens de diagnóstico da aplicação.

**Critérios de aceite**

1. Testes cobrem e-mail inválido, divergência de confirmação, erro do serviço e estados de link/token definidos no contrato; formulário inválido não envia.
2. O ensaio usa o mecanismo de entrega realmente implementado pelo back-end e confirma que a senha redefinida permite login; a anterior deixa de funcionar conforme regra do servidor.
3. Reutilização/expiração do link recebe o resultado da API e oferece recuperação; senha e token não ficam no estado após concluir/sair do fluxo.

### FE-15 — Verificação integrada e entrega do incremento

- [ ] **FE-15 — Executar e registrar o aceite dos fluxos reais.**

**Responsáveis:** Caio e Leticia. **Situação:** em execução; base de acesso conferida no navegador pelo usuário e API real testada, catálogo e demais marcos pendentes. **Dependências:** BE-02/BE-03/BE-15; FE-01 a FE-06 no primeiro marco; demais FE/BE para os marcos seguintes.

**Requisitos de desenvolvimento**

- **Marco inicial:** login válido/inválido → sessão → lista/paginação → cadastro → recarga → detalhe/edição → logout → tentativa de voltar. Usar duas contas de demonstração para conferir isolamento sem dados reais de compradores.
- **Marco de publicação:** produto/foto → conexão → rascunho → sugestão de IA revisável → aprovação → publicação autorizada com ID externo. Incluir clique duplo, falha da IA e resultado de publicação pendente/desconhecido.
- **Marco operacional:** consulta de pedidos e estoque, origem/atualização, falhas e recuperação conforme integrações liberadas. Indicadores/administração/recuperação têm aceite próprio, sem retirada silenciosa do escopo.
- Conferir teclado, foco, leitura em 390 px e AXE nas telas/estados principais alterados. Registrar ambiente, dados fictícios usados, resultado esperado/obtido e limitações; distinguir execução real, teste HTTP simulado e cenário bloqueado.

**Critérios de aceite**

1. Cada marco pode ser repetido pela outra pessoa a partir do roteiro, com persistência e respostas esperadas. Falhas impedem concluir apenas o marco afetado, com pendência registrada.
2. Testes pertinentes e build passam; verificações de acessibilidade têm evidência e correções necessárias. Não substituir teste real de API/banco por testes de frontend simulados.
3. Bloqueios de API geram ou atualizam o item BE correspondente; operações externas só são executadas dentro de autorização e ambiente combinados com o parceiro.
4. A fila registra os marcos concluídos e os restantes; FE-15 permanece aberta enquanto houver marco de entrega pendente. Não declarar o MVP completo com apenas catálogo ou conector simulado.

## Próximos passos de Caio e dependências entre as frentes

Referência: código de front em `f4013d63`, com API ainda na base `88731577`. O serviço de produtos já foi entregue, mas o catálogo não tem páginas/rotas disponíveis. As dependências abaixo distinguem desenvolvimento isolado, integração de telas e conclusão com API real.

**Apoio preparado após `0391ceb0`:** Leticia já pode usar `ProdutosService` e iniciar FE-04/FE-05/FE-06 com `npm run api:simulada` + `npm run start:simulado`, sem preparar banco ou aguardar outro serviço de Caio. Há 25 registros, segunda conta vazia, criação/edição em memória e cenários controlados. Comandos, campos e cuidados de consumo estão em `web/README.md`. Formulários, paginação visual, validações locais e seus testes continuam sob a responsabilidade definida para cada página; não foram implementados neste apoio.

| Ordem sugerida | O que Caio pode adiantar sem aguardar as páginas de Leticia | O que ainda condiciona a conclusão |
| --- | --- | --- |
| 1 | FE-01/FE-03: completar acessibilidade, indisponibilidade no navegador, expiração temporal e persistência após reinício. Login, recarga, saída e bloqueio de retorno foram confirmados pelo usuário no Angular real; 42 cenários HTTP aprovados. | BE-02/BE-03/BE-15 para os cenários restantes. Isso não depende da interface do catálogo. |
| 2 | FE-02: conferir layout, foco, teclado, página não encontrada e tratamento de indisponibilidade em desktop e 390 px; executar AXE. | Ferramenta/ambiente de navegador utilizáveis. Navegação do catálogo só pode ser conferida depois de FE-04/FE-05/FE-06. |
| 3 | FE-13: preparar a seção de canais e seus estados e combinar o contrato de conexão com o back-end. Disponibilizar o contrato de ID/e-mail já existente para a seção de conta entregue por Leticia. | BE-08 para conectar/reconectar de verdade; BE-13 para editar conta/preferências. Não depende de a lista de produtos estar pronta. |
| 4 | FE-07: alinhar contrato e preparar o adaptador HTTP de fotos/tratamento. O componente de seleção/prévia e sua incorporação ao cadastro ficam com Leticia. | Limites e persistência de BE-05/BE-06/DEC-02; os componentes dependem das entregas de Leticia, sem bloqueá-la de começar a prévia isoladamente. |
| 5 | FE-09: preparar serviços/modelos de rascunho/IA/publicação e coordenação da revisão/operação. Combinar entradas/saídas para que Leticia construa editor manual e prévia usando ProdutosService. | BE-07/BE-08/BE-09 e BE-06 para as operações reais. A integração final usa os componentes e listagem entregues por Leticia; o trabalho de serviço não exige esperar essas páginas. |
| 6 | FE-11/FE-12/FE-14: combinar contratos e preparar serviços/tipos de estoque, indicadores e recuperação de senha. As respectivas páginas/formulários ficam com Leticia. | APIs BE-11/BE-12/BE-14 e regras correspondentes; implementação de páginas e testes de interface conforme sua responsável. |
| 7 | Preparar os serviços/modelos de anúncios e pedidos assim que os contratos forem combinados. | BE-07/BE-10 precisam definir campos, operações e erros; não inventar endpoints para adiantar integração. A definição do contrato não precisa esperar FE-08/FE-10. |

### O que aguarda as entregas de Leticia

- **FE-04:** registrar a rota da listagem protegida, habilitar Produtos no menu e avaliar a troca do destino provisório `/inicio` pelo catálogo. Só ativar esses caminhos quando a página estiver disponível.
- **FE-05/FE-06:** integrar rotas/retornos de cadastro e detalhe/edição, encaixar os complementos/fotos de FE-07 no formulário existente e concluir o marco de catálogo em FE-15, com cadastro → recarga → edição → listagem.
- **FE-08:** ligar lista/detalhe ao editor de anúncios e verificar a atualização da lista após operações reais de FE-09. Isso condiciona o fluxo entre páginas, não a construção prévia do editor.
- **FE-10:** ligar a consulta de pedidos às demais páginas e conferir a apresentação do fluxo operacional junto ao estoque. O cálculo e a sincronização continuam responsabilidade da API.
- **FE-07/FE-11/FE-12/FE-14 e partes de FE-09/FE-13:** integrar os serviços às entregas de fotos, estoque, indicadores, recuperação, editor/prévia e conta/preferências construídas por Leticia; revisar os critérios sem substituir sua implementação.

Essas entregas não são motivo para iniciar as páginas da outra pessoa ou duplicar seus componentes. Caio pode revisar os componentes entregues, integrar a estrutura e preparar as próprias funcionalidades em paralelo. As dependências FE-04/FE-07/FE-08 citadas em FE-09 representam o fluxo completo; o editor isolado pode avançar antes delas.

## Divisão proposta entre duas pessoas

Distribuição preparada em **08/11/2026** para a dupla de front-end já identificada no projeto: **Caio Beneton e Leticia Dias Rangel**. Organiza entregas futuras, sujeitas a ajuste pela dupla, sem definir prazos ou atribuir autoria de código existente. Cada responsável implementa e verifica as entregas atribuídas; a outra pessoa participa da revisão.

| Responsável principal | Tarefas | Frente de trabalho |
| --- | --- | --- |
| **Caio** | FE-01, FE-02, FE-03 | Login/proxy, estrutura compartilhada, navegação, sessão/guard e logout. Preparação dos serviços HTTP e modelos consumidos pelas páginas da dupla. |
| **Leticia** | FE-04, FE-05, FE-06, FE-07 | Catálogo completo por etapas: listagem, cadastro, detalhe/edição, campos complementares, componente de seleção/prévia de fotos e apresentação de upload/tratamento. Validações, estados e testes dessas interfaces. |
| **Leticia** | FE-08, FE-10 | Listagem de anúncios e consulta/detalhe de pedidos, com tabelas, filtros suportados e estados vazio/carregamento/erro. Consumir serviços e modelos preparados por Caio; ações externas ficam nos fluxos correspondentes de Caio. |
| **Leticia** | FE-11, FE-12, FE-14 | Páginas de estoque/divergências e indicadores, formulários de recuperação/redefinição de senha, seus estados e testes, consumindo os contratos disponíveis. |
| **Leticia** | Partes de FE-09 e FE-13 | Editor manual e prévia do anúncio; componentes/formulários de conta e preferências. Cada subentrega tem aceite próprio conforme o detalhamento da tarefa. |
| **Caio** | Integrações de FE-07/FE-09/FE-11/FE-12/FE-14 | Contratos, serviços HTTP e modelos; upload/tratamento pelo back-end, geração Gemini, revisão/operação e publicação. Adaptadores de estoque, indicadores e recuperação de senha. |
| **Caio** | Parte de FE-13 | Conexão/reconexão e estados de canais; métodos HTTP para conta e preferências quando liberados. |
| **Ambos** | FE-15 | Revisão cruzada, integração dos fluxos, acessibilidade, ensaio e registro das limitações. |

Leticia inicia por **FE-04 → FE-05 → FE-06**. Depois entrega **FE-07**, **FE-08 e o editor/prévia de FE-09**, **FE-10/FE-11**, e as seções de conta/preferências, indicadores e recuperação conforme liberação. Caio mantém base/serviços e conduz as integrações externas. Isso atribui a Leticia nove tarefas principais de páginas/componentes e partes definidas de FE-09/FE-13; FE-15 é compartilhada. As entregas incluem testes e estados previstos nos critérios, sem alterar a exigência de integração real.

### Sequência de trabalho em paralelo

| Etapa | Caio | Leticia | Ponto de encontro e apoio do back-end |
| --- | --- | --- | --- |
| 1. Preparar a primeira entrega | FE-01/FE-02/FE-03: proxy, sessão e estrutura; disponibilizar tipos e serviço de produtos com exemplos de uso e respostas de teste. | FE-04: tabela/lista, paginação, ações e estados de produtos; depois FE-05 e FE-06 reutilizando o formulário. | Combinar rotas, formato de erros e retorno do cadastro/edição; usar o contrato existente. Componentes podem começar com respostas simuladas do serviço. BE-02/BE-03/BE-15 apoiam o ensaio real. |
| 2. Integrar o catálogo | Integrar guard/navegação, conferir serviços HTTP e revisar formulário/paginação. | Conectar páginas ao serviço disponibilizado, verificar validações e persistência de cadastro/edição e executar o roteiro do catálogo. | Ambos executam o marco inicial de FE-15 com banco real; corrigir bloqueios antes de considerar o catálogo entregue. |
| 3. Preparar publicação | Adaptadores de fotos e anúncios; canais de FE-13, geração/coordenação de aprovação/publicação de FE-09. Combinar as interfaces dos componentes antes de editar arquivos compartilhados. | FE-07: campos/fotos/prévia; FE-08: listagem de anúncios; parte de FE-09: formulário/editor manual e prévia com estados/validações. | BE-05/BE-06/BE-07/BE-08/BE-09 liberam contratos; API de publicação e componentes são unidos no marco de FE-15. Iniciar autorização do Mercado Livre cedo no back-end, sem presumir aprovação da conta. |
| 4. Completar operação | Serviços/modelos de pedidos, estoque, indicadores, conta/preferências e recuperação; concluir integrações externas e revisar contratos consumidos. | FE-10/FE-11, seções de conta/preferências de FE-13, FE-12 e FE-14: páginas e formulários completos com seus testes e estados, conforme contratos. | Marcos seguintes de FE-15; BE-10/BE-11/BE-12/BE-13/BE-14 conforme funcionalidade. Pedidos e estoque continuam no escopo do MVP. |

Essa sequência não aprova retirada de indicadores ou recuperação de senha dos requisitos. Caso o grupo precise adiar uma entrega, registrar a decisão e sua justificativa; bloqueio ou prioridade menor não equivale a conclusão.

### Coordenação para evitar conflito entre alterações

- **Arquivos compartilhados:** Caio coordena proxy, `app.config.ts`, `app.routes.ts`, estrutura/menu, autenticação e serviços HTTP/modelos compartilhados. Leticia mantém componentes, templates, estilos e testes de suas nove tarefas e das partes de FE-09/FE-13. Caio mantém os componentes de conexão/publicação que coordenam operações externas. Rotas e composição dos componentes entram em pequenas alterações combinadas.
- **Serviços e modelos:** Caio disponibiliza métodos/tipos de produtos, fotos, anúncios, pedidos, estoque, indicadores, conta/preferências e recuperação após os contratos serem definidos. Leticia conecta suas páginas aos métodos e registra necessidades antes de mudar o contrato. O serviço de produtos é o mesmo usado no catálogo e editor; não duplicar chamadas ou modelos incompatíveis.
- **Revisão cruzada:** Caio revisa as páginas e formulários de Leticia, incluindo contrato e integração. Leticia verifica navegação, apresentação, mensagens e uso por teclado dos fluxos de Caio. Ambos registram os critérios observados e os cenários ainda pendentes.
- **Integração FE-15:** Caio conduz sessão, serviços, integrações externas e publicação; Leticia conduz catálogo, fotos, consultas, editor/prévia, formulários e verificações de interface. Ambos repetem fluxos entregues pela outra pessoa e registram o resultado por marco.
- **Estado da fila:** cada responsável registra componente/interface concluídos, integração pendente ou real verificada e o item BE que impede avanço. Nenhuma pessoa deve marcar toda a tarefa como concluída ao entregar apenas dados simulados.
- **Sem API disponível:** avançar requisitos independentes e simulação explicitamente identificada. O responsável pelo módulo registra o pedido concreto ao back-end no item existente, com campos, ações, sucesso e erros que a tela precisa; não editar Go/schema como parte da tarefa de front.

## To-do específico do time de back-end

Estes itens são dependências de Samuel/Vitor, cruzadas com o último commit. `[x]` registra entrega de código confirmada por leitura e `go vet`; homologação integrada é separada em BE-15/FE-15. Itens parciais permanecem abertos com o restante explícito. Não houve implementação de back-end nesta revisão.

**Próxima liberação de contratos para o front:** priorizar BE-06/BE-07/BE-08/BE-09 após homologar a base. Em cada item, informar método/caminho, corpo, tipos e obrigatoriedade dos campos, resposta de sucesso, erros e estados; isso permite preparar os adaptadores antes das páginas. Para fotos, incluir formato de envio, limites e identificadores/URLs do original e da versão tratada. Para anúncios, separar revisão aprovada, estado remoto e operação consultável. Para canais, definir início/retorno da autorização, consulta de conexão e capacidades, mantendo tokens no Go. Para IA, definir entrada, sugestão editável, limites e erros/quota. Sem esse acordo, os respectivos serviços HTTP seguem bloqueados; não há endpoints inventados no simulador.

- [x] **BE-01 — Restaurar compilação do login (entregue em `88731577`):** consulta por e-mail restaurada no SQL/sqlc, identificador adequado e `go vet ./...` aprovado em 08/11. Login normaliza o e-mail na entrada; a garantia de normalização dos registros existentes ainda deve ser conferida em BE-15. Não é mais bloqueio de FE-01.
- [ ] **BE-02 — Carga de desenvolvimento (parcial):** na cópia local de Caio, banco atual preparado separadamente da PoC; três usuários confirmados por SQL e login HTTP de Caio/Samuel aprovado. Senha incorreta e e-mail inexistente retornaram `401`; e-mail com espaços/maiúsculas foi normalizado. O usuário também confirmou login incorreto/correto no navegador; resta confirmar os ambientes dos demais integrantes. O seed contém `samuel@sellerhub.com`, `caio@sellerhub.com` e `vitor@sellerhub.com`, com senha de demonstração `123456`. Não recriar ou sobrescrever um banco existente sem avaliar seus dados.
- [ ] **BE-03 — Sessão (parcial; contrato já liberado para FE-03):** assinatura/expiração, middleware de produtos, consulta de sessão e logout estão implementados. HTTP real confirmou cookie HttpOnly/SameSite Strict/Max-Age 28800, `401` sem cookie/adulterado, proteção de escrita e remoção do cookie no logout. Usuário confirmou recarga, saída e bloqueio de retorno no navegador. JWT copiado continuou aceito após logout; definir se é necessária revogação. Indisponibilidade no navegador e expiração temporal seguem pendentes. Não exigir troca de mecanismo nem bloquear o comportamento atual por essa decisão.
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
- [ ] **BE-15 — Contratos e homologação por incremento (parcial):** 42 cenários HTTP diretos aprovados com PostgreSQL, cobrindo login/normalização, cookie, consulta/saída, CRUD disponível, isolamento, `404`, paginação e entradas inválidas. Cadastro/edição conferidos por HTTP/SQL e roteiro básico Angular confirmado pelo usuário. Restam cenários de falha no navegador, expiração temporal, persistência após reinício e documentação/testes reproduzíveis do time; não há testes Go versionados. Confirmar nomes/campos antes de mudanças incompatíveis. A verificação atual não conclui as páginas de catálogo nem FE-15 integralmente.

## Decisões que precisam de alinhamento

- [ ] **DEC-01 — Vendas e estoque:** RF11 e o capítulo 4 preveem marcar pedido como cancelado e repor saldo; há orientação local de pedidos somente para consulta no MVP. O capítulo 4 também admite reposição repetida, e o registro de entrada aparece no protótipo sem requisito confirmado. Alinhar o recorte com o grupo antes de implementar botões de escrita; se houver reposição, definir controle contra duplicidade no servidor. Esta revisão não escolhe persistência de pedidos nem algoritmo de sincronização.
- [ ] **DEC-02 — Produto mínimo e vínculo ao usuário:** protótipo inclui descrição, categoria e características; API só persiste nome, SKU e preço, vinculados ao usuário do JWT. Já é possível construir/integrar esse recorte técnico; confirmar se ele atende à primeira entrega e quais campos devem ser acrescentados. A implementação isola produtos por usuário; confirmar se a conta única precisa de catálogo compartilhado. Não tratar o comportamento atual como aprovação automática de uma regra de produto.
- [ ] **DEC-03 — Canais e anúncios:** o protótipo impede selecionar canal já anunciado; o banco não garante anúncio único por produto/canal. Confirmar essa regra antes de bloquear na interface. Acordar campos obrigatórios e capacidades reais de cada canal; não assumir que os três do protótipo já serão integrados.

## Ordem de início definida em 08/11/2026 e critério de conclusão

Primeira frente: **login → estrutura interna/sessão → listagem de produtos → novo produto → detalhe/edição de produto**. O resumo por página e a prioridade de apoio do back-end estão em [AGENTS.md](AGENTS.md). FE-01/FE-02/FE-03 e o serviço compartilhado de produtos já têm código local; páginas do catálogo continuam pendentes. Os estados e critérios completos permanecem nesta fila, sem marcar a integração como concluída antes do ensaio real.

Começar **FE-01 → FE-02/FE-03 → FE-04 → FE-05/FE-06**, integrando as rotas já entregues, sem esperar novos endpoints de catálogo. Preparar o ambiente e a homologação em BE-02/BE-15; fechar o fluxo com FE-15. BE-05 e DEC-02 condicionam a ampliação/aceite do cadastro completo, sem impedir a construção do recorte básico. Depois, avançar anúncios e conexão de canal; liberar Vendas, Estoque, Indicadores e Administração conforme os contratos correspondentes. A ordem entre módulos posteriores pode mudar por decisão do grupo.

Marcar um item como concluído somente após registrar o que foi entregue e sua verificação. Uma tela visualmente pronta pode fechar a parte de interface, mas deve manter a integração pendente com o respectivo ID de back-end. Em cada retomada, conferir arquivos/rotas e atualizar este documento, sem presumir que esta fotografia permanece atual.

## Verificações

- **Confirmação manual do usuário em 08/11/2026:** com Angular iniciado por `npm.cmd start` e API Go/PostgreSQL reais, todo o roteiro proposto funcionou: senha incorreta rejeitada, senha correta aceita, abertura de `/inicio` com e-mail, F5 preservando o acesso, saída para login e acesso direto a `/inicio` após saída novamente bloqueado. Evidência relatada pelo usuário; sem inspeção automatizada de tela, screenshot ou AXE. Não abrange catálogo, teclado/390 px, indisponibilidade, expiração temporal ou reinício. FE-01/FE-03 e FE-15 mantêm os critérios restantes abertos.

- Ensaio real após preparo local: **42 cenários HTTP diretos aprovados** em `http://localhost:8080`, com Go e PostgreSQL. Verificados login válido/normalizado, senha incorreta/e-mail inexistente, entrada inválida, cookie ausente/adulterado, atributos do cookie, consulta de sessão, paginação/total/vazio, limites de nome/SKU/preço, POST `201`, PUT `200`, nova leitura, `404` e isolamento entre Caio/Samuel. Logout removeu cookie; consulta sem cookie retornou `401` e reuso de JWT copiado retornou `200`, conforme limite conhecido.
- Produto fictício mantido no banco local: ID **5**, SKU `QA-FE-1794149509740`, nome `QA integracao front - editado`, preço **42,01**. Leitura SQL independente confirmou o registro após POST/PUT. Não há exclusão HTTP; nenhum registro anterior foi editado/removido. API iniciada pelo usuário permanece sob seu controle. Angular ainda não estava acessível na porta 4200 ao concluir essa etapa.
- Este ensaio não cobriu navegador/proxy Angular, expiração pelo relógio, reinício da API/PostgreSQL, indisponibilidade real ou marketplaces. Não foram alterados Go/schema/seed nem marcadas tarefas FE como integralmente concluídas. Próxima etapa: `npm.cmd start` em `web/` e ensaio de login/recarga/saída no navegador.

- Apoio após `0391ceb0`: **31 testes Angular em 7 arquivos** e **5 testes do simulador aprovados**; build de produção aprovado (260,61 kB iniciais). Novos testes exercitam as rotas reais e a interface da estrutura com HTTP controlado, além de paginação, isolamento, criação/edição, validações e falhas do simulador. Não são testes do Go/PostgreSQL.
- `api:simulada` e `start:simulado` iniciados pelos comandos documentados; Angular respondeu `200`. Pelo proxy da porta 4200, conferidos login `200`, identificação da simulação, consulta da conta, página 2 com 5/25 registros, criação com ID e saída confirmada. O build de desenvolvimento simulado compilou. Conferência feita por HTTP, sem navegador. Servidores encerrados depois, com portas 4200/8081 sem escuta; `git diff --check` aprovado e arquivos privados ignorados/fora do índice.
- A ferramenta de navegador informou `The browser access host is unavailable` nesta retomada. Verificação visual/390 px/AXE permanece pendente. `.env` da raiz segue ausente; ensaio real continua em BE-02/BE-03/BE-15. Nenhuma página de Leticia ou API Go/schema foi alterada; README da raiz preservado. Sem commit/push.

- Incremento local após `5e17d586`: `npm.cmd test -- --watch=false` **aprovado com 26 testes em 6 arquivos**; `npm.cmd run build` **aprovado**, com 260,19 kB iniciais. Cobertos login/limite de senha, confirmação de sessão, guard, indisponibilidade, logout com falha, consultas simultâneas/respostas atrasadas, `401` concorrentes e DTOs/paginação de produtos. Os testes usam HTTP simulado.
- Servidor Angular respondeu `200`; `/api/qa/cenario` chegou pelo proxy a um servidor descartável simulado. Essa verificação prova o encaminhamento local, não autenticação Go/PostgreSQL. API de QA e Angular foram encerrados depois; nenhum fallback foi adicionado ao produto.
- Conferência visual **não realizada**: o controle nativo do Chrome foi interrompido pela ferramenta por não conseguir confirmar a URL da janela com segurança. Nenhum screenshot ou resultado AXE foi obtido. AXE foi apenas baixado em `web/tmp/a11y` (ignorado), sem alterar dependências do projeto; permanece pendente executar a auditoria.
- API real não foi iniciada: `.env` da raiz está ausente. Não foram criados credenciais, banco, schema ou dados para contornar BE-02/BE-15. Nenhum teste de persistência/marketplace foi realizado. Nenhuma tarefa FE foi marcada como concluída neste incremento.

- Revisão de 08/11: leitura do diff completo de `88731577` contra seu pai, dos 11 arquivos de API/seed alterados, do schema e dos arquivos atuais de autenticação/rotas/configuração Angular. A árvore estava limpa antes da avaliação; não houve busca de alterações remotas.
- `go vet ./...` em `api/`: **aprovado em 08/11/2026**. Confirma a correção do bloqueio de compilação relatado em 05/11; não verifica banco, comportamento HTTP ou integração Angular.
- Não há testes Go versionados. Não foram executados API/PostgreSQL, ensaio de cookie/navegador ou chamadas a marketplaces. A carga do seed no banco local não foi presumida.
- Evidência histórica de 05/11/2026: **6 testes/2 arquivos aprovados** com HTTP simulado. A expectativa da URL antiga foi substituída no incremento de login; consultar as execuções atuais acima.
- Detalhamento após `22f17dc6`: conferidos os 15 blocos FE, cada um com responsável, dependências, requisitos e critérios de aceite; distribuição por funcionalidade e camada, com FE-15 compartilhada. A revisão de requisitos é planejamento, não resultado de testes da aplicação. Nenhuma tarefa FE foi marcada como iniciada ou concluída.
- `git diff --check`, referências dos IDs da fila e links locais conferidos ao concluir. Nenhum código de aplicação, schema ou arquivo gerado foi alterado; sem commit/push.
