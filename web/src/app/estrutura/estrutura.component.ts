import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

interface ModuloMenu {
  nome: string;
  rota?: string;
  icone: string;
}

@Component({
  selector: 'app-estrutura',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, RouterOutlet],
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
  protected readonly iniciais = computed(() =>
    (this.auth.usuario()?.email ?? '').slice(0, 2).toUpperCase(),
  );
  // icones desenhados com tracos em grade 24x24
  protected readonly modulos: ModuloMenu[] = [
    {
      nome: 'Produtos',
      rota: '/produtos',
      icone:
        'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73zM12 22V12M3.3 7l7.7 4.73a2 2 0 0 0 2 0L20.7 7',
    },
    {
      nome: 'Anúncios',
      icone:
        'M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42zM8 7.5a.5.5 0 1 1-1 0a.5.5 0 1 1 1 0',
    },
    {
      nome: 'Vendas',
      icone:
        'M2 2h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L22 7H5.12M9 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0M20 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0',
    },
    {
      nome: 'Estoque',
      icone:
        'M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35M6 22V11h12v11M6 15h12M6 18.5h12',
    },
    {
      nome: 'Indicadores',
      icone: 'M3 3v16a2 2 0 0 0 2 2h16M8 17v-3M13 17V9M18 17V5',
    },
    {
      nome: 'Administração',
      icone: 'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4',
    },
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
