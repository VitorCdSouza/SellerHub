import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
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
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './estrutura.component.html',
  styleUrl: './estrutura.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:resize)': 'ajustarMenu()' },
})
export class EstruturaComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly saindo = signal(false);
  protected readonly erroSaida = signal('');
  protected readonly menuAberto = signal(false);
  private readonly painelMenu = viewChild<ElementRef<HTMLDialogElement>>('painelMenu');
  private readonly botaoMenu = viewChild<ElementRef<HTMLButtonElement>>('botaoMenu');
  private readonly conteudo = viewChild<ElementRef<HTMLElement>>('conteudo');
  // primeira letra do primeiro e do ultimo nome, ex.: "Vitor Souza" vira "VS"
  protected readonly iniciais = computed(() => {
    const usuario = this.auth.usuario();
    const nomes = (usuario?.nome ?? '').trim().split(/\s+/).filter(Boolean);
    if (nomes.length === 0) return (usuario?.email ?? '').slice(0, 2).toUpperCase();
    const primeira = nomes[0][0];
    const ultima = nomes.length > 1 ? nomes[nomes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  });
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
      rota: '/anuncios',
      icone:
        'M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42zM8 7.5a.5.5 0 1 1-1 0a.5.5 0 1 1 1 0',
    },
    {
      nome: 'Vendas',
      icone:
        'M2 2h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L22 7H5.12M9 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0M20 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0',
    },
    {
      nome: 'Indicadores',
      rota: '/indicadores',
      icone: 'M3 3v16a2 2 0 0 0 2 2h16M8 17v-3M13 17V9M18 17V5',
    },
    {
      nome: 'Administração',
      rota: '/administracao',
      icone: 'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4',
    },
  ];

  protected abrirMenu(): void {
    this.painelMenu()?.nativeElement.showModal();
    this.menuAberto.set(true);
  }

  protected fecharMenu(): void {
    this.painelMenu()?.nativeElement.close();
    this.menuAberto.set(false);
  }

  protected conterFocoMenu(evento: KeyboardEvent): void {
    if (evento.key !== 'Tab') return;
    const painel = this.painelMenu()?.nativeElement;
    const alvos = Array.from(
      painel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]') ?? [],
    ).filter((elemento) => elemento.getClientRects().length > 0);
    const primeiro = alvos[0];
    const ultimo = alvos.at(-1);
    const atual = painel?.ownerDocument.activeElement;
    if (evento.shiftKey && atual === primeiro) {
      evento.preventDefault();
      ultimo?.focus();
    } else if (!evento.shiftKey && atual === ultimo) {
      evento.preventDefault();
      primeiro?.focus();
    }
  }

  protected aoFecharMenu(): void {
    this.menuAberto.set(false);
    const botao = this.botaoMenu()?.nativeElement;
    if (botao?.getClientRects().length) botao.focus();
  }

  protected navegar(): void {
    if (!this.menuAberto()) return;
    this.fecharMenu();
    // A rota pode ser a atual; nesse caso também devolvemos o foco ao conteúdo.
    requestAnimationFrame(() => {
      const conteudo = this.conteudo()?.nativeElement;
      (conteudo?.querySelector<HTMLElement>('h1') ?? conteudo)?.focus();
    });
  }

  protected ajustarMenu(): void {
    if (this.menuAberto() && window.innerWidth > 1024) {
      this.fecharMenu();
      requestAnimationFrame(() => this.conteudo()?.nativeElement.focus());
    }
  }

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
          if (this.menuAberto()) this.fecharMenu();
          void this.router.navigate(['/'], { replaceUrl: true });
        },
        error: () => this.erroSaida.set('Não foi possível sair. Tente novamente.'),
      });
  }
}
