import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, finalize, startWith, switchMap } from 'rxjs';
import { ProdutosService } from './produtos.service';
import { NovoProdutoComponent } from './novo-produto/novo-produto.component';
import { EditarProdutoComponent } from './editar-produto/editar-produto.component';
import { ExcluirProdutoComponent } from './excluir-produto/excluir-produto.component';
import { RegistrarEntradaComponent } from './registrar-entrada/registrar-entrada.component';
import { Produto } from './produto.model';
import { GradeComponent } from '../compartilhado/grade/grade.component';
import { CelulaGradeDirective } from '../compartilhado/grade/celula-grade.directive';
import { ColunaGrade, OpcaoGrade } from '../compartilhado/grade/coluna-grade';

@Component({
  selector: 'app-produtos',
  imports: [
    FocoPaginaDirective,
    GradeComponent,
    CelulaGradeDirective,
    NovoProdutoComponent,
    EditarProdutoComponent,
    ExcluirProdutoComponent,
    RegistrarEntradaComponent,
  ],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProdutosComponent {
  private readonly service = inject(ProdutosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly solicitacaoPagina = new Subject<number>();

  protected readonly produtos = signal<Produto[]>([]);
  protected readonly paginaAtual = signal(1);
  protected readonly limite = signal(20);
  protected readonly total = signal(0);
  protected readonly carregando = signal(false);
  protected readonly erro = signal('');
  protected readonly cadastroAberto = signal(false);
  protected readonly produtoEditando = signal<Produto | null>(null);
  protected readonly produtoExcluindo = signal<Produto | null>(null);
  protected readonly produtoEntrada = signal<Produto | null>(null);

  protected readonly colunas: ColunaGrade<Produto>[] = [
    { campo: 'nome', titulo: 'Produto' },
    { campo: 'sku', titulo: 'SKU', largura: '14rem' },
    { campo: 'precoBase', titulo: 'Preço base', tipo: 'preco', largura: '10rem' },
    { campo: 'saldo', titulo: 'Saldo', tipo: 'inteiro', largura: '7rem' },
    { campo: 'saldoAtualizadoEm', titulo: 'Saldo atualizado em', tipo: 'data', largura: '12rem' },
  ];

  protected readonly opcoes: OpcaoGrade<Produto>[] = [
    { rotulo: 'Editar', acao: (produto) => this.produtoEditando.set(produto) },
    { rotulo: 'Registrar entrada', acao: (produto) => this.produtoEntrada.set(produto) },
    { rotulo: 'Excluir', perigo: true, acao: (produto) => this.produtoExcluindo.set(produto) },
  ];

  protected readonly nomeProduto = (produto: Produto) => produto.nome;
  protected readonly semSaldo = (produto: Produto) => produto.saldo === 0;

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limite())),
  );

  protected readonly podeVoltar = computed(() => this.paginaAtual() > 1);

  protected readonly podeAvancar = computed(
    () => this.paginaAtual() * this.limite() < this.total(),
  );

  constructor() {
    this.solicitacaoPagina
      .pipe(
        startWith(1),
        switchMap((pagina) => {
          this.paginaAtual.set(pagina);
          this.carregando.set(true);
          this.erro.set('');
          this.produtos.set([]);

          return this.service.listar(pagina, this.limite()).pipe(
            catchError((erro: unknown) => {
              this.erro.set(
                'Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.',
              );
              return EMPTY;
            }),
            finalize(() => this.carregando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.produtos.set(resultado.itens);
        this.total.set(resultado.total);
      });
  }

  protected voltar(): void {
    if (this.podeVoltar()) {
      this.solicitacaoPagina.next(this.paginaAtual() - 1);
    }
  }

  protected avancar(): void {
    if (this.podeAvancar()) {
      this.solicitacaoPagina.next(this.paginaAtual() + 1);
    }
  }

  protected recarregar(): void {
    this.solicitacaoPagina.next(this.paginaAtual());
  }

  // excluir o ultimo item da pagina volta para a anterior
  protected aposExclusao(): void {
    if (this.produtos().length === 1 && this.podeVoltar()) {
      this.solicitacaoPagina.next(this.paginaAtual() - 1);
    } else {
      this.recarregar();
    }
  }
}
