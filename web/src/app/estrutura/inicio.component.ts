import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';

@Component({
  selector: 'app-inicio',
  imports: [FocoPaginaDirective, RouterLink],
  template: `
    <p class="sobretitulo">ÁREA DE TRABALHO</p>
    <h1 appFocoPagina>Bem-vindo ao SellerHub</h1>
    <p class="introducao">
      Um espaço para organizar seus produtos e acompanhar seus canais de venda.
    </p>
    <section class="cartao-inicial" aria-labelledby="titulo-catalogo">
      <h2 id="titulo-catalogo">Seu catálogo de produtos</h2>
      <p>Consulte seus produtos ou cadastre um novo item com nome, SKU e preço base.</p>
      <div class="acoes-catalogo">
        <a class="acao-principal" routerLink="/produtos">Ver produtos</a>
        <a class="acao-secundaria" routerLink="/produtos/novo">Cadastrar produto</a>
      </div>
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
    h2 {
      margin: 0 0 0.75rem;
      font-size: 1.3rem;
    }
    .cartao-inicial p {
      color: #526075;
      line-height: 1.7;
      margin: 0.5rem 0;
    }
    .acoes-catalogo {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .acoes-catalogo a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0.7rem 1rem;
      border: 1px solid #244bc1;
      border-radius: 7px;
      font-weight: 650;
      text-decoration: none;
    }
    .acao-principal {
      background: #244bc1;
      color: #fff;
    }
    .acao-secundaria {
      color: #244bc1;
      background: #fff;
    }
    @media (max-width: 480px) {
      .acoes-catalogo {
        flex-direction: column;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent {}
