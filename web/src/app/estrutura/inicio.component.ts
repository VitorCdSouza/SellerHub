import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';

@Component({
  selector: 'app-inicio',
  imports: [FocoPaginaDirective],
  template: `
    <p class="sobretitulo">ÁREA DE TRABALHO</p>
    <h1 appFocoPagina>Bem-vindo ao SellerHub</h1>
    <p class="introducao">
      Um espaço para organizar seus produtos e acompanhar seus canais de venda.
    </p>
    <section class="cartao-inicial" aria-labelledby="titulo-catalogo">
      <span class="situacao">Em desenvolvimento</span>
      <h2 id="titulo-catalogo">Seu catálogo de produtos</h2>
      <p>O cadastro, a consulta e a edição de produtos estarão disponíveis aqui em breve.</p>
      <p>As demais áreas serão liberadas conforme forem concluídas.</p>
    </section>
  `,
  styles: `
    .sobretitulo {
      margin: 0 0 0.6rem;
      color: #526075;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      font-weight: 700;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.65rem, 4vw, 2.1rem);
      letter-spacing: -0.035em;
    }
    .introducao {
      margin: 0.8rem 0 2rem;
      max-width: 620px;
      color: #526075;
      line-height: 1.7;
    }
    .cartao-inicial {
      padding: 1.75rem;
      border: 1px solid #dce2ea;
      border-radius: 12px;
      background: #fff;
      max-width: 740px;
    }
    .situacao {
      display: inline-block;
      color: #244bc1;
      background: #edf2ff;
      border-radius: 5px;
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 600;
    }
    h2 {
      margin: 1.25rem 0 0.75rem;
      font-size: 1.3rem;
    }
    .cartao-inicial p {
      color: #526075;
      line-height: 1.7;
      margin: 0.5rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent {}
