
## SellerHub — planejamento do front-end

Antes de planejar ou implementar telas, leia integralmente [TODO.md](TODO.md). Ele registra a avaliação atualizada em 08/11/2026 do commit `88731577`, telas que podem avançar, bloqueios, decisões pendentes e tarefas FE/BE. Reconfira o código ao retomar e atualize a fila conforme houver entregas.

O README da raiz deve conter apresentação do projeto e instruções gerais de instalação/uso. Não acrescentar nele status de tarefas, divisão de responsáveis, bloqueios locais, resultados de sessões, contagem de testes ou relatos de ferramentas. Manter andamento em TODO.md, detalhes técnicos do front em [README.md](README.md) e orientações de agentes neste arquivo; preservar o contexto privado somente nos arquivos locais destinados a ele.

Ao concluir uma entrega, sugerir mensagens de commit em Conventional Commits, com descrição concreta em português e escopo coerente com os arquivos alterados. A sugestão não autoriza executar commit ou push.

Para desenvolvimento do catálogo sem banco, usar os comandos e cenários de simulação descritos em [README.md](README.md). O modo é explícito (`start:simulado`), tem aviso permanente e não substitui a homologação real. Não acrescentar endpoints simulados para módulos cujo contrato ainda não foi combinado.

Prioridade: FE-01 (alinhar URL/proxy), FE-02/FE-03 (estrutura, sessão e saída) e FE-04/FE-05/FE-06 (integrar catálogo básico). As rotas de sessão e produtos já existem; não aguardar novos endpoints para esse recorte. Campos adicionais e demais módulos continuam condicionados aos itens BE/DEC. Liberação técnica não comprova integração com banco/navegador: fechar BE-15/FE-15 antes de declarar o fluxo concluído. Simulação deve ser explícita e separada dos serviços reais. Em tarefas da frente de interface, registre ajustes de API como itens BE para o time responsável.

### Telas que começaremos e prioridade para o back-end

Frente inicial definida em **08/11/2026**. FE-01/FE-02/FE-03 já têm implementação local e testes HTTP simulados; a estrutura usa `/inicio` até o catálogo ser entregue. O serviço/modelo de produtos está pronto para uso nas páginas de Leticia. Integração real, verificação visual e AXE permanecem pendentes; consultar os estados completos em TODO.md antes de marcar qualquer tarefa como concluída.

| Ordem | Página ou fluxo do front-end | Recorte inicial | Prioridade de apoio do back-end |
| --- | --- | --- | --- |
| 1 | Login — FE-01 | Ajustar a tela existente para `/api/login` e configurar proxy. | BE-02/BE-15: confirmar usuário de desenvolvimento com bcrypt no banco usado pela equipe e verificar sucesso, senha incorreta e e-mail inexistente; alinhar README ao seed. |
| 2 | Estrutura interna e sessão — FE-02/FE-03 | Menu, rotas, identificação por e-mail, acesso autenticado, expiração e saída. | BE-03/BE-15: verificar consulta de sessão, `401`, cookie e logout; explicitar que o logout atual remove o cookie sem revogar o JWT. |
| 3 | Produtos — listagem — FE-04 | Nome, SKU, preço base, paginação, total e estados vazio/erro/carregamento. | BE-15: validar listagem com PostgreSQL, paginação e isolamento pelo usuário. A rota básica já existe; preservar o contrato de `items`/`total`. |
| 4 | Novo produto — FE-05 | Formulário de nome, SKU e preço base, envio real e retorno do ID. | BE-05/BE-15 e DEC-02: validar criação/persistência e limites; alinhar unicidade do SKU, campos do primeiro incremento e eventual compartilhamento do catálogo. O formulário básico pode avançar com o contrato atual. |
| 5 | Detalhe e edição de produto — FE-06 | Carregar por ID, editar os três campos e salvar via PUT. | BE-05/BE-15: verificar persistência e `404` para inexistente/outro usuário; definir resposta para conflito de edição antes de prometer esse controle na interface. |

**Prioridade imediata do back-end:** estabilizar e verificar login/sessão e catálogo básico com banco real (BE-02, BE-03 e BE-15), apoiando o ensaio FE-15. Em seguida, concluir os alinhamentos de produto em BE-05/DEC-02. BE-01 e a base HTTP de BE-04 já foram entregues; não recriar essas rotas. Combinar mudanças no contrato com a dupla de front-end antes de alterá-lo.

Fotos/características, anúncios, canais, IA, vendas, estoque, indicadores, administração completa e recuperação de senha ficam para os incrementos seguintes, conforme liberação. Suas pendências permanecem em [TODO.md](TODO.md), que continua sendo a única lista detalhada de execução para as duas frentes.

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
