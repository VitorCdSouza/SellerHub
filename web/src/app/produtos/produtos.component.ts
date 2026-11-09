import { RouterLink } from '@angular/router';
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
import { CurrencyPipe } from '@angular/common';
import { EMPTY, Subject, catchError, finalize, startWith, switchMap } from 'rxjs';
import { ProdutosService } from './produtos.service';
import { Produto } from './produto.model';

@Component({
  selector: 'app-produtos',
  imports: [CurrencyPipe, RouterLink, FocoPaginaDirective],
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

  protected tentarNovamente(): void {
    this.solicitacaoPagina.next(this.paginaAtual());
  }
}
