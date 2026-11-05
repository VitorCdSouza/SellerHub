# Front-end — telas, dependências e to-dos

Avaliação em **05/11/2026**, sobre o código local na revisão `dde6975e`. Este documento concentra a fila compartilhada do front-end e os pedidos destinados ao back-end. As prioridades são uma sequência sugerida; não atribuem tarefas individuais nem autorizam implementar todas as funcionalidades de uma vez.

## Como interpretar o estado

- **Pode avançar agora:** implementação visual e comportamento local independentes da API.
- **Pode avançar com simulação:** componentes, formulários e estados usando dados fictícios separados dos serviços HTTP. O contrato continua pendente; simulação não comprova persistência nem integração.
- **Integração bloqueada:** ainda não há API utilizável para concluir o fluxo real.

**Nenhuma tela de negócio pode ser considerada integrada hoje.** O login é a única tela implementada, mas sua integração regrediu. Produtos é o módulo seguinte mais adiantado no back-end, apenas na camada SQL. Tabelas, dados de exemplo e imagens de protótipos não equivalem a endpoints disponíveis.

## Evidências do código

| Evidência | Consequência para o front-end |
| --- | --- |
| [`app.routes.ts`](src/app/app.routes.ts) só carrega o login; [`app.html`](src/app/app.html) contém apenas o outlet. | Não há navegação interna nem telas de negócio implementadas. |
| [`auth.service.ts`](src/app/services/auth.service.ts) e os testes chamam `http://localhost:8080/login`; [`main.go`](../api/cmd/main.go) registra somente `POST /api/login`. | Caminho e origem estão incompatíveis. Não há CORS na API nem `proxy.conf.json` ou `proxyConfig` no Angular, apesar do README. |
| [`login.go`](../api/internal/service/login.go) chama `GetUserByEmail`, ausente em [`queries.sql`](../api/internal/db/queries.sql) e no código gerado. | `go vet ./...` falha por método inexistente. A API atual não compila. Ao restaurar a consulta, também será necessário adequar `user.ID` ao identificador atual de usuário. |
| [`session.go`](../api/internal/service/session.go) apenas cria JWT; o controller o grava no cookie `sessao`, `HttpOnly`, `SameSite=Strict`, por 8 horas. | Emissão existe, mas faltam validação do token, consulta da sessão, logout e rotas protegidas. O Angular não deve ler esse cookie nem guardar o token em localStorage. |
| [`estrutura.sql`](../db/estrutura.sql) tem `CAD_USUARIO`, enquanto [`dados.sql`](../db/dados.sql) usa hashes fictícios; o usuário de demonstração com bcrypt está comentado. | Mesmo após corrigir a compilação, a carga atual não oferece o login válido anunciado no README. |
| As quatro consultas de produto (`ListProdutos`, `GetProdutoById`, `CreateProduto`, `UpdateProduto`) já estão no SQL e no Go gerado. | Há base para o catálogo, mas não há controller, service ou rota HTTP de produto. `UpdateProduto` não informa se alguma linha foi alterada. |
| `CAD_PRODUTO` contém ID, usuário, SKU, nome e preço decimal. | Descrição, categoria, características, fotos, saldo e unicidade de SKU não estão implementados no schema. O protótipo de novo produto pede mais campos que o banco atual. |
| Existem tabelas de anúncios, marketplaces, auditoria e métricas. | Não há consultas e rotas desses módulos, conectores, OAuth ou chamadas Gemini. Os registros de exemplo não comprovam canais conectados. |
| Não há saldo de produto, API de estoque nem consulta externa de pedidos. | Estoque e Vendas ainda não têm fonte real de dados. A ausência de tabela de pedidos, isoladamente, não obriga sua persistência; o fluxo precisa ser acordado. |

## Quais telas podem ser feitas

| Tela ou fluxo | O que pode ser feito agora no front-end | O que impede concluir com dados reais | To-dos |
| --- | --- | --- | --- |
| Login (RF01) | Reaproveitar o formulário existente; corrigir URL, proxy e testes. | API não compila e carga não tem senha válida. | FE-01, BE-01, BE-02 |
| Estrutura interna e navegação | Menu, área de conteúdo, rotas sob demanda, responsividade, página não encontrada e estados comuns. | Identificação real do usuário, guard, expiração e saída dependem de sessão consultável. | FE-02, FE-03, BE-03 |
| Produtos — listagem (RF03) | Prioridade para tabela/lista de nome, SKU e preço; estado vazio, erro e carregamento com simulação. | Faltam endpoint, contrato de resposta, paginação e autenticação. Não inventar saldo ou canais anunciados a partir dessas consultas. | FE-04, BE-04 |
| Novo produto (RF02) | Formulário inicial de nome, SKU e preço base, com validação local. | Não há criação HTTP; campos adicionais do protótipo não persistem. Recorte mínimo precisa ser acordado antes de omiti-los da entrega. | FE-05, BE-04, BE-05, DEC-02 |
| Detalhe/edição de produto (RF04) | Reutilizar o formulário, preencher dados simulados, tratar cancelamento e falha de gravação. | Faltam consulta/atualização HTTP, tratamento de inexistente, autorização e contrato de conflito de edição. | FE-06, BE-04, BE-05 |
| Fotos e características do produto | Preparar seleção e prévia local de foto real, se esse incremento for priorizado. | Não há upload, metadados ou persistência de características. Prévia não significa arquivo salvo. | FE-07, BE-05, BE-06 |
| Anúncios — listagem/gestão (RF05) | Estrutura visual com filtros e situações simuladas. | Não há listagem HTTP, vínculo exposto com produto/canal ou ações reais. | FE-08, BE-07 |
| Novo/editar anúncio, revisão e publicação (RF06) | Formulário e prévia simulados; revisão humana explícita antes da publicação. | Faltam rascunhos HTTP, requisitos por canal, revisão/aprovação, conector e retorno da operação. | FE-09, BE-07, BE-08, DEC-03 |
| Sugestões de IA e tratamento de imagens | Preparar estados de geração, edição e erro após combinar o contrato. | Não há API Gemini nem tratamento de fotos. Escrita manual deve continuar possível; sugestão nunca é publicação automática. | FE-09, BE-06, BE-09 |
| Vendas/pedidos — consulta (RF07) | Lista, filtros e detalhe com dados fictícios, após acordo dos campos e situações. | Não há endpoint ou conector para consultar vendas. Ação de cancelamento/reposição tem divergência de escopo. | FE-10, BE-10, DEC-01 |
| Estoque e divergências (RF08) | Preparar visualização simulada de saldo, situação por canal e última atualização. | Não há saldo persistido, consulta, sincronização ou divergências calculadas. Entrada/ajuste manual depende de decisão. | FE-11, BE-11, DEC-01 |
| Indicadores (RF09/RF10) | Layout de filtros, cartões e gráficos com simulação identificada. | Tabela de histórico não tem API; faltam agregações, período, origem e disponibilidade das métricas. | FE-12, BE-12 |
| Administração — conta | Estrutura do formulário, sem afirmar que alterações são salvas. | Não há consulta/edição da conta, loja ou troca de senha. Sem CRUD de usuários/perfis por suposição. | FE-13, BE-13 |
| Administração — canais e sincronização | Estados visuais de desconectado, indisponível, expirado e falha. | Não há OAuth, estado de conexão, preferências ou execução de sincronização. | FE-13, BE-08, BE-11, BE-13 |
| Recuperação/redefinição de senha (RF12) | Apenas desenho do fluxo até acordar mecanismo e contrato. | Não há emissão/validação de token, redefinição ou envio de instruções. | FE-14, BE-14 |

Não foi identificada uma tela de auditoria nos protótipos/requisitos de interface. A existência de `CAD_AUDITORIA` não autoriza acrescentá-la à fila de telas. Também não há suporte para cadastro público, múltiplos perfis ou gestão de usuários.

## To-do do front-end

### Prioridade 0 — recuperar a base e iniciar o catálogo

- [ ] **FE-01 — Alinhar o login ao contrato atual:** usar `/api/login`, criar/configurar proxy local para `http://localhost:8080`, atualizar expectativas dos testes e preservar tratamento de `400`, `401`, indisponibilidade e envio repetido. A alteração de front pode começar agora; concluir a integração depende de BE-01/BE-02. Validar o cookie pelo comportamento das requisições, sem tentar lê-lo no JavaScript.
- [ ] **FE-02 — Criar a estrutura interna:** navegação acessível, conteúdo responsivo, rotas sob demanda e tratamento de rota inexistente. Pode começar sem API com identificação fictícia explícita. Não apresentar essa navegação como área autenticada antes de FE-03/BE-03.
- [ ] **FE-04 — Construir a listagem de produtos:** nome, SKU e preço base; carregamento, vazio, erro e nova tentativa. Pode começar com simulação separada. Integrar somente após BE-04; busca/paginação devem seguir o contrato acordado.
- [ ] **FE-05 — Construir o cadastro de produto:** iniciar pelo formulário de nome, SKU e preço; confirmar DEC-02 antes de fechar o recorte. Não simular sucesso de persistência no serviço real. Integrar após BE-04/BE-05.
- [ ] **FE-06 — Construir detalhe e edição de produto:** reutilizar o formulário; preservar valores em falha, tratar registro inexistente e conflito conforme contrato. Integrar após BE-04/BE-05.

### Prioridade 1 — integrar sessão e completar o primeiro fluxo

- [ ] **FE-03 — Integrar sessão e saída:** consulta do usuário autenticado, guard de navegação, retorno ao login em `401`, expiração e logout confirmado pelo servidor. Depende de BE-03; um booleano local não substitui autenticação.
- [ ] **FE-07 — Complementar o produto:** características, descrição, categoria e fotos reais conforme DEC-02 e BE-05/BE-06. Diferenciar seleção/prévia local de upload concluído.
- [ ] **FE-15 — Verificar o primeiro fluxo real:** login válido/inválido → listar → cadastrar → recarregar → editar produto → sair → tentar retornar à rota. Conferir validação do servidor, cookie, dados persistidos e acesso indevido negado. Validar teclado, foco, mensagens por campo e AXE/WCAG AA. Só marcar integração concluída com API e PostgreSQL reais.

### Prioridade 2 — preparar módulos dependentes conforme os contratos forem liberados

- [ ] **FE-08 — Listagem/gestão de anúncios:** implementar e depois integrar situações e ações efetivamente disponíveis; depende de BE-07.
- [ ] **FE-09 — Editor de anúncio e prévia:** seleção de produto/canal, campos exigidos, rascunho, revisão/aprovação humana e acompanhamento de publicação. Sugestões de IA devem ser editáveis, com alternativa manual em falha. Publicação real depende de BE-07/BE-08; IA depende de BE-09 e imagens de BE-06. Resolver DEC-03 antes de bloquear canais com anúncio existente.
- [ ] **FE-10 — Vendas/pedidos:** consulta e detalhe com situações acordadas em BE-10. Manter qualquer ação de cancelamento/reposição pendente até DEC-01.
- [ ] **FE-11 — Estoque:** saldo e divergências, canal afetado, última atualização, falha e processamento pendente, conforme BE-11. Não acrescentar entrada/ajuste manual até DEC-01.
- [ ] **FE-12 — Indicadores:** filtros de período/canal e apresentação das métricas de BE-12. Diferenciar zero de dado indisponível e identificar atualização/origem.
- [ ] **FE-13 — Administração:** conta, canais e preferências por incrementos independentes; integrar somente os recursos liberados em BE-08/BE-11/BE-13. Não exibir canais como conectados com base no cadastro de marketplaces.
- [ ] **FE-14 — Recuperação/redefinição de senha:** implementar após BE-14 definir contrato, expiração e mensagens de resultado; não exibir confirmação fictícia de envio.

Para toda tela: componentes standalone, `OnPush`, signals, formulários reativos e serviço HTTP por funcionalidade. Separar simulação e acesso real, sem fallback silencioso para dados fictícios quando a API falhar. Testar os riscos do fluxo, sem criar testes que apenas repitam o HTML.

## To-do específico do time de back-end

Estes itens são dependências a encaminhar a Samuel/Vitor. Não foram implementados nesta revisão. Os nomes de novos endpoints e DTOs devem ser combinados; somente `POST /api/login` já está registrado.

- [ ] **BE-01 — Restaurar compilação do login:** reintroduzir a consulta de usuário por e-mail no SQL, gerar novamente com sqlc e adequar acesso/tipo do identificador ao schema `CAD_USUARIO`. Conferir normalização do e-mail, ausente como constraint no schema atual, e `go vet ./...`. Desbloqueia FE-01.
- [ ] **BE-02 — Corrigir a carga de desenvolvimento:** oferecer usuário fictício com bcrypt válido e campos obrigatórios de pessoa/usuário; alinhar instruções do README ao seed real. Verificar login válido, senha incorreta e e-mail inexistente no PostgreSQL. Desbloqueia FE-01/FE-15.
- [ ] **BE-03 — Completar a sessão:** validar JWT/cookie nas rotas restritas, expor consulta de sessão/usuário e logout, definir expiração e semântica de invalidação compatível com o JWT atual. Responder `401` de forma previsível. Definir proteção das operações de escrita antes de liberar negócio; não exigir troca de mecanismo de autenticação nesta fila. Desbloqueia FE-03 e integração das telas internas.
- [ ] **BE-04 — Expor catálogo HTTP autenticado:** listagem paginada, detalhe, criação e atualização a partir das quatro consultas existentes. Combinar DTOs, filtros, códigos de erro, representação exata de preço/IDs e respostas de criação/edição. Obter o usuário pela sessão; definir acesso ao catálogo da conta única sem confiar em `id_usuario` enviado pelo navegador. Distinguir inexistente/acesso negado de edição bem-sucedida, pois `:exec` não informa linhas alteradas. Desbloqueia FE-04/FE-05/FE-06.
- [ ] **BE-05 — Fechar campos e validações do produto:** resolver DEC-02; validar nome, SKU, preço e campos acordados, definir unicidade do SKU no domínio aprovado e resposta de conflito/edição concorrente. Acrescentar persistência dos campos aprovados que faltam e combinar evolução do schema sem presumir que recriar banco será sempre aceitável. Desbloqueia o cadastro completo e FE-07.
- [ ] **BE-06 — Expor fotos e tratamento:** upload, consulta e vínculo ao produto/anúncio, validação de arquivo e retorno de prévia/versão tratada. Definir limites e falhas para o front-end, preservando foto real e aprovação da prévia. Desbloqueia FE-07 e imagens em FE-09.
- [ ] **BE-07 — Expor anúncios:** listar/consultar/criar/editar rascunhos, dados de produto/canal e situações; fornecer requisitos de categoria/canal e erros por campo. Implementar aprovação do conteúdo exato e retorno consultável da publicação, com proteção contra repetição. A tabela atual sozinha não implementa esses fluxos. Desbloqueia FE-08/FE-09.
- [ ] **BE-08 — Disponibilizar conexão e conector de marketplace:** fluxo de autorização, situação da conexão, reconexão e publicação/atualização autorizada, com resultado e falhas consultáveis. Informar capacidades por canal; ter Mercado Livre, Shopee e Amazon na tabela não implica suporte real. Desbloqueia publicação em FE-09 e canais em FE-13.
- [ ] **BE-09 — Expor geração assistida:** contrato de título/descrição, limites, falha/quota e retorno sempre como sugestão editável. Credenciais e chamadas ao provedor ficam na API. Desbloqueia a parte de IA de FE-09.
- [ ] **BE-10 — Expor consulta de vendas/pedidos:** paginação, filtros, itens, vínculo com produto, situações padronizadas e informação de atualização/falha por canal. Acordar os dados devolvidos à interface e resolver DEC-01 antes de qualquer comando de reposição. Desbloqueia FE-10.
- [ ] **BE-11 — Expor estoque e sincronização:** disponibilizar saldo por produto, situação por canal, divergências, última execução e pendências/falhas; combinar ações realmente suportadas e suas respostas. Garantir consistência e tratamento de repetição no servidor; não delegar cálculo do saldo ao Angular. Resolver DEC-01 para ajustes/reposições. Desbloqueia FE-11 e preferências de FE-13.
- [ ] **BE-12 — Expor indicadores:** definir métricas disponíveis, período, filtros, agregações, origem e atualização; distinguir indisponibilidade de valor zero. Não apresentar o histórico de exemplo como dado obtido dos canais. Desbloqueia FE-12.
- [ ] **BE-13 — Expor conta e preferências:** leitura/edição dos campos aprovados, alteração de senha e preferências de sincronização suportadas. O campo loja do protótipo não está no schema atual. Não expor hashes/credenciais na resposta. Desbloqueia as partes correspondentes de FE-13.
- [ ] **BE-14 — Definir recuperação de senha:** emissão/expiração/uso único do mecanismo de recuperação, redefinição e envio de instruções, com erros seguros e verificáveis. Desbloqueia FE-14.
- [ ] **BE-15 — Entregar contratos verificáveis por incremento:** registrar requisição/resposta/erros e exemplos fictícios, atualizar README divergente e verificar API com PostgreSQL. Informar quais rotas e capacidades estão prontas para a dupla de front-end. Não basta gerar sqlc ou criar tabela para fechar uma dependência.

## Decisões que precisam de alinhamento

- [ ] **DEC-01 — Vendas e estoque:** RF11 e o capítulo 4 preveem marcar pedido como cancelado e repor saldo; há orientação local de pedidos somente para consulta no MVP. O capítulo 4 também admite reposição repetida, e o registro de entrada aparece no protótipo sem requisito confirmado. Alinhar o recorte com o grupo antes de implementar botões de escrita; se houver reposição, definir controle contra duplicidade no servidor. Esta revisão não escolhe persistência de pedidos nem algoritmo de sincronização.
- [ ] **DEC-02 — Produto mínimo e vínculo ao usuário:** protótipo inclui descrição, categoria e características; SQL só persiste nome, SKU, preço e usuário. Confirmar quais campos entram no primeiro incremento e como uma conta única compartilha/acessa o catálogo. Não transformar o schema atual em decisão automática de produto.
- [ ] **DEC-03 — Canais e anúncios:** o protótipo impede selecionar canal já anunciado; o banco não garante anúncio único por produto/canal. Confirmar essa regra antes de bloquear na interface. Acordar campos obrigatórios e capacidades reais de cada canal; não assumir que os três do protótipo já serão integrados.

## Ordem sugerida e critério de conclusão

Começar FE-01/FE-02 e os componentes de FE-04/FE-05/FE-06 enquanto o back-end resolve BE-01 a BE-05. Integrar sessão e catálogo antes de considerar esse primeiro fluxo entregue. Depois, avançar anúncios e conexão de canal; liberar Vendas, Estoque, Indicadores e Administração conforme os contratos correspondentes. A ordem entre módulos posteriores pode mudar por decisão do grupo.

Marcar um item como concluído somente após registrar o que foi entregue e sua verificação. Uma tela visualmente pronta pode fechar a parte de interface, mas deve manter a integração pendente com o respectivo ID de back-end. Em cada retomada, conferir arquivos/rotas e atualizar este documento, sem presumir que esta fotografia permanece atual.

## Verificações desta avaliação

- Leitura da API, schema/seed, consultas geradas, rotas/serviço/formulário/testes Angular, README e capítulos 3/4. Inspeção dos protótipos de novo produto, novo anúncio e administração.
- `npm.cmd test -- --watch=false`: **6 testes aprovados em 2 arquivos**. A primeira tentativa foi impedida por restrições de leitura do ambiente; a repetição fora dessa restrição passou. Os testes usam HTTP simulado e ainda esperam a URL antiga; não validam API, cookie ou PostgreSQL.
- `go vet ./...`: **falhou**, confirmando `GetUserByEmail undefined` em `api/internal/service/login.go:31`, após resolver as restrições de cache/dependência do ambiente. O acesso a `user.ID` também precisa ser revisado ao restaurar a consulta; não foi validado por compilação nesta avaliação.
- Não houve execução integrada, recriação de banco, publicação em marketplace ou alteração de código de aplicação/back-end. Este documento registra análise e tarefas pendentes.
