import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DadosProduto, Produto } from '../produto.model';
import { ProdutosService } from '../produtos.service';
import { ProdutoFormularioComponent } from '../produto-formulario/produto-formulario.component';

@Component({
  selector: 'app-editar-produto',
  imports: [ProdutoFormularioComponent],
  templateUrl: './editar-produto.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarProdutoComponent {
  private readonly service = inject(ProdutosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly produto = input.required<Produto>();
  readonly atualizado = output();
  readonly fechado = output();

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }

  protected salvar(dados: DadosProduto): void {
    if (this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.erro.set('');

    this.service
      .atualizar(this.produto().id, dados)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: (resposta) => {
          if (resposta.success) {
            this.atualizado.emit();
            this.fechar();
          } else {
            this.erro.set('A API não confirmou a atualização. Tente novamente.');
          }
        },
        error: (erro: unknown) => {
          if (erro instanceof HttpErrorResponse) {
            if (erro.status === 400) {
              this.erro.set('Os dados informados são inválidos. Confira os campos.');
            } else if (erro.status === 401) {
              this.erro.set('Sua sessão expirou. Faça login novamente.');
            } else if (erro.status === 404) {
              this.erro.set('Produto não encontrado. Ele pode ter sido excluído.');
            } else {
              this.erro.set('Não foi possível salvar as alterações. Tente novamente.');
            }
          } else {
            this.erro.set('Ocorreu um erro inesperado. Tente novamente.');
          }
        },
      });
  }

  protected fechar(): void {
    this.dialogo().nativeElement.close();
  }

  // esc dispara cancel; durante o envio o modal fica aberto ate a resposta
  protected impedirFechamentoDuranteEnvio(evento: Event): void {
    if (this.enviando()) {
      evento.preventDefault();
    }
  }
}
