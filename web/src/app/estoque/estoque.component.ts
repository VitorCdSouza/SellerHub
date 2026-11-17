import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, finalize, forkJoin, startWith, switchMap } from 'rxjs';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';
import { Anuncio, situacoes } from '../anuncios/anuncio.model';
import { AnunciosService } from '../anuncios/anuncios.service';
import { EstoqueService, ItemEstoque } from './estoque.service';
import { RegistrarEntradaComponent } from './registrar-entrada/registrar-entrada.component';
import { GradeComponent } from '../compartilhado/grade/grade.component';
import { CelulaGradeDirective } from '../compartilhado/grade/celula-grade.directive';
import { ColunaGrade, OpcaoGrade } from '../compartilhado/grade/coluna-grade';

type LinhaEstoque = ItemEstoque & { anuncios: string };

@Component({
  selector: 'app-estoque',
  imports: [FocoPaginaDirective, RegistrarEntradaComponent, GradeComponent, CelulaGradeDirective],
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

  // produto pre-selecionado no modal de entrada
  protected readonly produtoEntrada = signal<number | null>(null);

  protected readonly colunas: ColunaGrade<LinhaEstoque>[] = [
    { campo: 'nome', titulo: 'Produto' },
    { campo: 'sku', titulo: 'SKU', tipo: 'codigo', largura: '14rem' },
    { campo: 'saldo', titulo: 'Saldo', tipo: 'inteiro', largura: '7rem' },
    { campo: 'anuncios', titulo: 'Anúncios' },
    { campo: 'atualizadoEm', titulo: 'Atualizado em', tipo: 'data', largura: '12rem' },
  ];

  protected readonly opcoes: OpcaoGrade<LinhaEstoque>[] = [
    { rotulo: 'Registrar entrada', acao: (item) => this.abrirEntrada(item.produtoId) },
  ];

  protected readonly nomeProduto = (item: LinhaEstoque) => item.nome;
  protected readonly semSaldo = (item: LinhaEstoque) => item.saldo === 0;

  // anuncios resume as situacoes do produto, ex.: "2 publicados · 1 rascunho"
  protected readonly linhas = computed<LinhaEstoque[]>(() =>
    this.itens().map((item) => {
      const doProduto = this.anuncios().filter((anuncio) => anuncio.produtoId === item.produtoId);
      const partes = situacoes
        .map((situacao) => {
          const total = doProduto.filter((anuncio) => anuncio.situacao === situacao.valor).length;
          const rotulo = total === 1 ? situacao.rotulo : situacao.plural;
          return total ? `${total} ${rotulo.toLocaleLowerCase('pt-BR')}` : '';
        })
        .filter(Boolean);
      return { ...item, anuncios: partes.join(' · ') };
    }),
  );

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

  protected abrirEntrada(produtoId: number | null): void {
    this.produtoEntrada.set(produtoId);
    this.entradaAberta.set(true);
  }
}
