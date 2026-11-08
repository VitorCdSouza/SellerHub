import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';
import { AuthService } from '../services/auth.service';
import { destinoAposLogin } from './destino-login';

@Component({
  selector: 'app-sessao-indisponivel',
  imports: [RouterLink, FocoPaginaDirective],
  template: `
    <main class="pagina-de-estado">
      <section class="cartao-de-estado" aria-labelledby="titulo-sessao">
        <p class="marca-estado">SellerHub</p>
        <h1 id="titulo-sessao" appFocoPagina>Não foi possível verificar seu acesso</h1>
        <p>O serviço está indisponível no momento. Tente novamente para continuar de onde parou.</p>
        <button
          type="button"
          class="acao-principal"
          (click)="tentarNovamente()"
          [disabled]="consultando()"
        >
          {{ consultando() ? 'Verificando...' : 'Tentar novamente' }}
        </button>
        <a class="acao-secundaria" routerLink="/" [queryParams]="{ retorno: retorno }"
          >Voltar ao login</a
        >
        <div role="alert" aria-atomic="true">
          @if (falhou()) {
            <p class="aviso-erro">O acesso continua indisponível. Tente novamente em instantes.</p>
          }
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessaoIndisponivelComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly retorno = destinoAposLogin(this.rota.snapshot.queryParamMap.get('retorno'));
  protected readonly consultando = signal(false);
  protected readonly falhou = signal(false);

  protected tentarNovamente(): void {
    if (this.consultando()) return;
    this.consultando.set(true);
    this.falhou.set(false);
    this.auth
      .consultarSessao()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.consultando.set(false)),
      )
      .subscribe((estado) => {
        if (estado === 'autenticada')
          void this.router.navigateByUrl(this.retorno, { replaceUrl: true });
        else if (estado === 'anonima') {
          void this.router.navigate(['/'], {
            queryParams: { retorno: this.retorno },
            replaceUrl: true,
          });
        } else this.falhou.set(true);
      });
  }
}
