import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Subject,
  catchError,
  combineLatest,
  finalize,
  startWith,
  switchMap,
} from 'rxjs';
import { Produto } from '../produto.model';
import { ProdutosService } from '../produtos.service';

@Component({
  selector: 'app-produto-detalhe',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './produto-detalhe.component.html',
  styleUrl: './produto-detalhe.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProdutoDetalheComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ProdutosService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly recarregar = new Subject<void>();

  protected readonly produto = signal<Produto | null>(null);
  protected readonly carregando = signal(false);
  protected readonly erro = signal('');

  constructor() {
    combineLatest([
      this.route.paramMap,
      this.recarregar.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([parametros]) => {
          const idTexto = parametros.get('id');
          const id = Number(idTexto);

          this.produto.set(null);
          this.erro.set('');

          if (!idTexto || !Number.isInteger(id) || id <= 0) {
            this.erro.set('O identificador do produto é inválido.');
            return EMPTY;
          }

          this.carregando.set(true);

          return this.service.consultar(id).pipe(
            catchError((erro: unknown) => {
              if (erro instanceof HttpErrorResponse) {
                if (erro.status === 404) {
                  this.erro.set('Produto não encontrado.');
                } else if (erro.status === 401) {
                  this.erro.set('Sua sessão expirou. Faça login novamente.');
                } else {
                  this.erro.set(
                    'Não foi possível carregar o produto. Tente novamente.',
                  );
                }
              } else {
                this.erro.set('Ocorreu um erro inesperado.');
              }

              return EMPTY;
            }),
            finalize(() => this.carregando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((produto) => {
        this.produto.set(produto);
      });
  }

  protected tentarNovamente(): void {
    this.recarregar.next();
  }
}
