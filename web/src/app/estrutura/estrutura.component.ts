import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-estrutura',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './estrutura.component.html',
  styleUrl: './estrutura.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstruturaComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly saindo = signal(false);
  protected readonly erroSaida = signal('');
  protected readonly modulos = [
    'Produtos',
    'Anúncios',
    'Vendas',
    'Estoque',
    'Indicadores',
    'Administração',
  ];

  protected sair(): void {
    if (this.saindo()) return;
    this.saindo.set(true);
    this.erroSaida.set('');
    this.auth
      .sair()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saindo.set(false)),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/'], { replaceUrl: true });
        },
        error: () => this.erroSaida.set('Não foi possível sair. Tente novamente.'),
      });
  }
}
