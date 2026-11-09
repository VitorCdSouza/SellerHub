
## SellerHub — planejamento do front-end

Antes de planejar ou implementar telas, leia [../AGENTS.md](../AGENTS.md) e integralmente [../TODO.md](../TODO.md). A revisão de 09/11/2026 reconhece as implementações FE-04/FE-05/FE-06 e logo/favicon de Leticia (`47ee5b7b` a `da81eb35`), com correções/testes/homologação pendentes; não reconstruir essas páginas. A API segue em `88731577`. Usar a fila para fechar catálogo/FE-15 e preparar fotos/anúncios/canal/IA, mantendo dependências BE/DEC e autoria das entregas. Simulações não concluem integração; ajustes de API pertencem ao back-end. Não duplicar a fila neste arquivo.

Após `49d1f358`, Caio atualizou o início e preparou testes de integração da estrutura e `npm run test:api-real`. Consultar o README do front para executar o comando; o modo padrão não altera produtos e `--gravar` deixa um registro QA no banco. O aceite visual/acessibilidade do catálogo e ajustes das páginas continuam pendentes na fila, separados das verificações HTTP.

Antes de executar uma tarefa FE, consulte requisitos, critérios e responsáveis em `../TODO.md`. Leticia assume FE-04/FE-05/FE-06/FE-07/FE-08/FE-10/FE-11/FE-12/FE-14, editor manual/prévia em FE-09 e conta/preferências em FE-13. Caio mantém infraestrutura/autenticação, contratos/serviços/modelos, geração de IA/aprovação/publicação e conexão de canais. Respeitar as fronteiras dos componentes; não implementar as páginas atribuídas à outra pessoa. Revisão e FE-15 são compartilhadas, com detalhamento na fila única.

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
