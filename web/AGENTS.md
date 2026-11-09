
## SellerHub — planejamento do front-end

Antes de planejar ou implementar telas, leia integralmente [TODO.md](TODO.md). A revisão de 09/11/2026 cruza os commits de Leticia `47ee5b7b`, `51898427`, `7f0be9c0` e `da81eb35` com os critérios FE/BE; a API continua em `88731577`. Reconfira o código ao retomar e atualize a fila conforme houver entregas.

O README da raiz deve conter apresentação do projeto e instruções gerais de instalação/uso. Não acrescentar nele status de tarefas, divisão de responsáveis, bloqueios locais, resultados de sessões, contagem de testes ou relatos de ferramentas. Manter andamento em TODO.md, detalhes técnicos do front em [README.md](README.md) e orientações de agentes neste arquivo; preservar o contexto privado somente nos arquivos locais destinados a ele.

Ao concluir uma entrega, sugerir mensagens de commit em Conventional Commits, com descrição concreta em português e escopo coerente com os arquivos alterados. A sugestão não autoriza executar commit ou push.

Antes de entregar alterações de código/configuração/testes, executar `npm run test:qualidade` com ambiente real e conferir [QUALIDADE.md](QUALIDADE.md). Corrigir falhas com regressão e repetir até aprovação do conteúdo atual; ambiente ou dependência externa exige bloqueio identificado. `test:qualidade:conferir` só valida a prova em cache. Não reduzir testes/AXE nem usar gravação automática. O README do front documenta os estados e a impressão do código; manter logs/traces locais ignorados.

Para desenvolvimento do catálogo sem banco, usar os comandos e cenários de simulação descritos em [README.md](README.md). O modo é explícito (`start:simulado`), tem aviso permanente e não substitui a homologação real. Não acrescentar endpoints simulados para módulos cujo contrato ainda não foi combinado.

Prioridade imediata: corrigir/homologar o catálogo implementado (FE-02/FE-04/FE-05/FE-06/FE-15), incluindo testes da listagem e acessibilidade. Não reconstruir essas páginas nem esperar novos endpoints para os três campos existentes. Fotos/anúncios/canais/IA são a próxima frente, com contratos BE-05/BE-06/BE-07/BE-08/BE-09 e decisões pertinentes; começar autorização de canal em paralelo ao aceite do catálogo. Simulação continua explícita e separada do HTTP real. Necessidades de Go/schema são to-dos do time de back-end.

### Entregas revisadas e próxima frente

Base de catálogo/navegação em `df05afe7` e Playwright/AXE em `143596f5`. A revisão de qualidade corrige foco/landmarks/contraste, recuperação de páginas vazias, limites Unicode e concorrência na edição; acrescenta regressões e o comando único de verificação. O resultado atual está em [QUALIDADE.md](QUALIDADE.md) e os critérios restantes em TODO.md; suíte aprovada não conclui FE-15 ou o MVP. `test:e2e` não grava produtos; `test:e2e:gravar` cria um QA, salvo retomada explícita. Artefatos locais podem conter cookies e não devem ser publicados sem revisão.

| Ordem | Página ou fluxo do front-end | Estado e próximo trabalho | Prioridade de apoio do back-end |
| --- | --- | --- | --- |
| 1 | Base e catálogo — FE-01 a FE-06 | Início e integração de rotas entregues por Caio; Leticia fecha correções/testes das páginas. Ambos concluem roteiro visual/390 px/AXE. Comando de QA real documentado no README do front. | BE-15 apoia cenários restantes; BE-03 mantém decisão sobre revogação/expiração. Não recriar endpoints entregues. |
| 2 | Fotos — FE-07 e canais — FE-13 | Leticia entrega seleção/prévia; Caio prepara serviço de fotos e conexão/reconexão após contrato. | BE-05/BE-06/DEC-02 liberam campos/fotos. BE-08 libera autorização/retorno e situação real de conexão. |
| 3 | Anúncios/editor/IA/publicação — FE-08/FE-09 | Leticia entrega lista/editor manual/prévia; Caio entrega serviços e coordenação de geração, revisão e publicação. | BE-07/BE-08/BE-09 e DEC-03: rascunho/revisão, operação consultável, conector e sugestão editável. |

**Prioridade do back-end:** apoiar FE-15 do catálogo e liberar os contratos de fotos, anúncios, canal e IA em paralelo. Iniciar a autorização do Mercado Livre cedo; não esperar acabamento do catálogo para tratar dependências externas. Depois, BE-10/BE-11 liberam pedidos/estoque e BE-12/BE-13/BE-14 completam os requisitos. Critérios, correções específicas e caminho completo do MVP ficam apenas em TODO.md.

Fotos/características, anúncios, canais, IA, vendas, estoque, indicadores, administração completa e recuperação continuam pendentes conforme API/decisões. Prioridade menor ou simulação não retira requisitos do MVP. Preservar a aprovação humana de conteúdo/publicação e a distinção entre operação aceita e publicação confirmada.

### Detalhamento e divisão da dupla de front-end

Cada tarefa FE tem requisitos, dependências e critérios de aceite em [TODO.md](TODO.md), junto à proposta de distribuição para duas pessoas. Consultar o item completo antes de implementar; entregar interface simulada não conclui sua integração.

- **Caio:** infraestrutura, acesso/sessão, contratos e serviços HTTP/modelos compartilhados, coordenação da geração de IA/aprovação/publicação e conexão/reconexão de canais. Prepara os adaptadores usados pelos componentes da dupla, sem assumir as páginas atribuídas a Leticia.
- **Leticia:** catálogo e fotos (FE-04/FE-05/FE-06/FE-07), listagens de anúncios/pedidos (FE-08/FE-10), estoque (FE-11), indicadores (FE-12) e recuperação/redefinição de senha (FE-14). Também entrega editor manual/prévia de anúncio em FE-09 e seções de conta/preferências em FE-13. Inclui componentes, formulários, validações locais, estados e testes, consumindo os serviços compartilhados.
- **Ambos:** revisão e FE-15, com aceite por marcos de catálogo, publicação e operação. Caio prepara a base e os serviços enquanto Leticia constrói as páginas do catálogo; os detalhes de coordenação e a sequência estão somente na fila compartilhada.

Essa é uma divisão proposta de trabalho futuro, ajustável pela dupla; não atribui autoria anterior nem marca tarefas como iniciadas/concluídas. Ajustes do Go/schema continuam destinados ao time de back-end nos itens BE correspondentes.

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
