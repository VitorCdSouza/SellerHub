import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DadosProduto } from '../produto.model';
import { ProdutosService } from '../produtos.service';
import { FormularioComponent } from '../../compartilhado/formulario/formulario.component';
import { ValoresFormulario } from '../../compartilhado/formulario/campo-formulario';
import { camposProduto } from '../campos-produto';

@Component({
  selector: 'app-novo-produto',
  imports: [FormularioComponent],
  templateUrl: './novo-produto.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoProdutoComponent {
  private readonly service = inject(ProdutosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly cadastrado = output();
  readonly fechado = output();

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  protected readonly campos = camposProduto();

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }

  protected salvar(valores: ValoresFormulario): void {
    const dados = valores as DadosProduto;

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
            this.cadastrado.emit();
            this.fechar();
          } else {
            this.erro.set('O cadastro não foi confirmado pela API. Tente novamente.');
          }
        },
        error: (erro: unknown) => {
          if (erro instanceof HttpErrorResponse) {
            if (erro.status === 400) {
              this.erro.set(
                'Os dados informados são inválidos. Confira os campos e tente novamente.',
              );
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
