import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { EMPTY, Subject, catchError, finalize, startWith, switchMap } from 'rxjs';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';
import { AnunciosService } from './anuncios.service';
import { Anuncio, SituacaoAnuncio, anuncioEditavel, situacoes } from './anuncio.model';
import { EditorAnuncioComponent } from './editor-anuncio/editor-anuncio.component';

@Component({
  selector: 'app-anuncios',
  imports: [CurrencyPipe, FocoPaginaDirective, EditorAnuncioComponent],
  templateUrl: './anuncios.component.html',
  styleUrl: './anuncios.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnunciosComponent {
  private readonly service = inject(AnunciosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly solicitacaoLeitura = new Subject<void>();

  protected readonly situacoes = situacoes;
  protected readonly editavel = anuncioEditavel;

  protected readonly anuncios = signal<Anuncio[]>([]);
  protected readonly carregando = signal(false);
  protected readonly erro = signal('');
  protected readonly situacaoFiltro = signal<SituacaoAnuncio | ''>('');
  protected readonly canalFiltro = signal('');
  protected readonly busca = signal('');
  // null fecha o editor, 0 abre o cadastro e um id abre a edicao
  protected readonly anuncioEditando = signal<number | null>(null);

  protected readonly canais = computed(() =>
    [...new Set(this.anuncios().map((anuncio) => anuncio.marketplace))].sort(),
  );

  // a contagem por situacao respeita canal e busca, como no filtro da tabela
  private readonly anunciosDoCanal = computed(() => {
    const canal = this.canalFiltro();
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.anuncios().filter(
      (anuncio) =>
        (!canal || anuncio.marketplace === canal) &&
        (!termo ||
          `${anuncio.produto} ${anuncio.titulo} ${anuncio.sku}`
            .toLocaleLowerCase('pt-BR')
            .includes(termo)),
    );
  });

  protected readonly anunciosVisiveis = computed(() => {
    const situacao = this.situacaoFiltro();
    return this.anunciosDoCanal().filter((anuncio) => !situacao || anuncio.situacao === situacao);
  });

  protected readonly contagem = computed(() => {
    const total: Partial<Record<SituacaoAnuncio, number>> = {};
    for (const anuncio of this.anunciosDoCanal()) {
      total[anuncio.situacao] = (total[anuncio.situacao] ?? 0) + 1;
    }
    return total;
  });

  protected readonly totalFiltrado = computed(() => this.anunciosDoCanal().length);

  constructor() {
    this.solicitacaoLeitura
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.carregando.set(true);
          this.erro.set('');

          return this.service.listar().pipe(
            catchError(() => {
              this.erro.set(
                'Não foi possível carregar os anúncios. Verifique sua conexão e tente novamente.',
              );
              return EMPTY;
            }),
            finalize(() => this.carregando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((anuncios) => this.anuncios.set(anuncios));
  }

  protected recarregar(): void {
    this.solicitacaoLeitura.next();
  }

  protected rotuloSituacao(situacao: SituacaoAnuncio): string {
    return situacoes.find((item) => item.valor === situacao)?.rotulo ?? situacao;
  }

  protected filtrarCanal(evento: Event): void {
    this.canalFiltro.set((evento.target as HTMLSelectElement).value);
  }

  protected filtrarBusca(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }
}
