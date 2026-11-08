import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';

@Component({
  selector: 'app-nao-encontrada',
  imports: [RouterLink, FocoPaginaDirective],
  template: `
    <main class="pagina-de-estado">
      <section class="cartao-de-estado" aria-labelledby="titulo-pagina">
        <p class="marca-estado">SellerHub</p>
        <h1 id="titulo-pagina" appFocoPagina>Página não encontrada</h1>
        <p>Este endereço não está disponível. Volte ao início para continuar.</p>
        <a class="acao-principal" routerLink="/inicio">Voltar ao início</a>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NaoEncontradaComponent {}
