import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, combineLatest, finalize, startWith, switchMap } from 'rxjs';
import { DadosProduto } from '../produto.model';
import { ProdutosService } from '../produtos.service';
import { ProdutoFormularioComponent } from '../produto-formulario/produto-formulario.component';
import { FocoPaginaDirective } from '../../compartilhado/foco-pagina.directive';

@Component({
  selector: 'app-editar-produto',
  imports: [ProdutoFormularioComponent, RouterLink, FocoPaginaDirective],
  templateUrl: './editar-produto.component.html',
  styleUrl: './editar-produto.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarProdutoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProdutosService);
  private readonly destroyRef = inject(DestroyRef);

  private idAtual: number | null = null;
  private versaoConsulta = 0;
  private readonly recarregar = new Subject<void>();

  protected readonly dadosIniciais = signal<DadosProduto | null>(null);
  protected readonly carregando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly erroCarregamento = signal('');
  protected readonly erroEnvio = signal('');

  constructor() {
    combineLatest([this.route.paramMap, this.recarregar.pipe(startWith(undefined))])
      .pipe(
        switchMap(([parametros]) => {
          const idTexto = parametros.get('id');
          const id = Number(idTexto);

          this.idAtual = null;
          this.versaoConsulta++;
          this.dadosIniciais.set(null);
          this.enviando.set(false);
          this.erroCarregamento.set('');
          this.erroEnvio.set('');

          if (!idTexto || !Number.isInteger(id) || id <= 0) {
            this.erroCarregamento.set('O identificador do produto é inválido.');
            this.carregando.set(false);
            return EMPTY;
          }

          this.idAtual = id;
          this.carregando.set(true);

          return this.service.consultar(id).pipe(
            catchError((erro: unknown) => {
              if (erro instanceof HttpErrorResponse) {
                if (erro.status === 404) {
                  this.erroCarregamento.set('Produto não encontrado.');
                } else if (erro.status === 401) {
                  this.erroCarregamento.set('Sua sessão expirou. Faça login novamente.');
                } else {
                  this.erroCarregamento.set(
                    'Não foi possível carregar o produto. Tente novamente.',
                  );
                }
              } else {
                this.erroCarregamento.set('Ocorreu um erro inesperado.');
              }

              return EMPTY;
            }),
            finalize(() => this.carregando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((produto) => {
        this.dadosIniciais.set({
          nome: produto.nome,
          sku: produto.sku,
          precoBase: produto.precoBase,
        });
      });
  }

  protected tentarNovamente(): void {
    this.recarregar.next();
  }

  protected salvar(dados: DadosProduto): void {
    const id = this.idAtual;
    const versao = this.versaoConsulta;

    if (id === null || this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.erroEnvio.set('');

    this.service
      .atualizar(id, dados)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (versao === this.versaoConsulta) this.enviando.set(false);
        }),
      )
      .subscribe({
        next: (resposta) => {
          if (versao !== this.versaoConsulta) return;
          if (resposta.success) {
            this.router.navigate(['/produtos', id]);
          } else {
            this.erroEnvio.set('A API não confirmou a atualização. Tente novamente.');
          }
        },
        error: (erro: unknown) => {
          if (versao !== this.versaoConsulta) return;
          if (erro instanceof HttpErrorResponse) {
            if (erro.status === 400) {
              this.erroEnvio.set('Os dados informados são inválidos. Confira os campos.');
            } else if (erro.status === 401) {
              this.erroEnvio.set('Sua sessão expirou. Faça login novamente.');
            } else if (erro.status === 404) {
              this.erroEnvio.set('Produto não encontrado.');
            } else {
              this.erroEnvio.set('Não foi possível salvar as alterações. Tente novamente.');
            }
          } else {
            this.erroEnvio.set('Ocorreu um erro inesperado. Tente novamente.');
          }
        },
      });
  }

  protected cancelar(): void {
    const id = this.idAtual;

    if (id !== null) {
      this.router.navigate(['/produtos', id]);
    } else {
      this.router.navigate(['/produtos']);
    }
  }
}
