import { RouterLink } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DadosProduto } from '../produto.model';
import { ProdutosService } from '../produtos.service';
import { ProdutoFormularioComponent } from '../produto-formulario/produto-formulario.component';

@Component({
  selector: 'app-novo-produto',
  imports: [ProdutoFormularioComponent, RouterLink],
  templateUrl: './novo-produto.component.html',
  styleUrl: './novo-produto.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoProdutoComponent {
  private readonly service = inject(ProdutosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  protected salvar(dados: DadosProduto): void {
    if (this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.erro.set('');

    this.service
      .cadastrar(dados)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: (resposta) => {
            if (resposta.status === 201 && resposta.body?.id) {
                this.router.navigate(['/produtos']);
            } else {
                this.erro.set('O cadastro não foi confirmado pela API. Tente novamente.');
            }
        },
        error: (erro: unknown) => {
          if (erro instanceof HttpErrorResponse) {
            if (erro.status === 400) {
              this.erro.set('Os dados informados são inválidos. Confira os campos e tente novamente.');
            } else if (erro.status === 401) {
              this.erro.set('Sua sessão expirou. Faça login novamente.');
            } else {
              this.erro.set('Não foi possível cadastrar o produto. Tente novamente.');
            }
          } else {
            this.erro.set('Ocorreu um erro inesperado. Tente novamente.');
          }
        },
      });
  }

  protected cancelar(): void {
    this.router.navigate(['/produtos']);
  }
}
