import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { EMPTY, Subject, catchError, finalize, forkJoin, startWith, switchMap } from 'rxjs';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';
import { Anuncio, situacoes } from '../anuncios/anuncio.model';
import { AnunciosService } from '../anuncios/anuncios.service';
import { EstoqueService, ItemEstoque } from './estoque.service';
import { RegistrarEntradaComponent } from './registrar-entrada/registrar-entrada.component';

@Component({
  selector: 'app-estoque',
  imports: [DatePipe, FocoPaginaDirective, RegistrarEntradaComponent],
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstoqueComponent {
  private readonly service = inject(EstoqueService);
  private readonly anunciosService = inject(AnunciosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly solicitacaoLeitura = new Subject<void>();

  protected readonly itens = signal<ItemEstoque[]>([]);
  private readonly anuncios = signal<Anuncio[]>([]);
  protected readonly carregando = signal(false);
  protected readonly erro = signal('');
  protected readonly entradaAberta = signal(false);

  // resumo por produto, ex.: "2 publicados · 1 rascunho"
  protected readonly resumoAnuncios = computed(() => {
    const resumo = new Map<number, string>();
    for (const item of this.itens()) {
      const doProduto = this.anuncios().filter((anuncio) => anuncio.produtoId === item.produtoId);
      const partes = situacoes
        .map((situacao) => {
          const total = doProduto.filter((anuncio) => anuncio.situacao === situacao.valor).length;
          const rotulo = total === 1 ? situacao.rotulo : situacao.plural;
          return total ? `${total} ${rotulo.toLocaleLowerCase('pt-BR')}` : '';
        })
        .filter(Boolean);
      resumo.set(item.produtoId, partes.join(' · '));
    }
    return resumo;
  });

  constructor() {
    this.solicitacaoLeitura
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.carregando.set(true);
          this.erro.set('');

          return forkJoin({
            itens: this.service.listar(),
            anuncios: this.anunciosService.listar(),
          }).pipe(
            catchError(() => {
              this.erro.set(
                'Não foi possível carregar o estoque. Verifique sua conexão e tente novamente.',
              );
              return EMPTY;
            }),
            finalize(() => this.carregando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ itens, anuncios }) => {
        this.itens.set(itens);
        this.anuncios.set(anuncios);
      });
  }

  protected recarregar(): void {
    this.solicitacaoLeitura.next();
  }
}
