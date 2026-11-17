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
import { FormularioComponent } from '../../compartilhado/formulario/formulario.component';
import {
  CampoFormulario,
  ValoresFormulario,
} from '../../compartilhado/formulario/campo-formulario';
import { EstoqueService } from '../../estoque/estoque.service';
import { Produto } from '../produto.model';

@Component({
  selector: 'app-registrar-entrada',
  imports: [FormularioComponent],
  templateUrl: './registrar-entrada.component.html',
  styleUrl: './registrar-entrada.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrarEntradaComponent {
  private readonly service = inject(EstoqueService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly produto = input.required<Produto>();
  readonly registrada = output();
  readonly fechado = output();

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  protected readonly campos: CampoFormulario[] = [
    {
      nome: 'quantidade',
      rotulo: 'Quantidade',
      tipo: 'inteiro',
      obrigatorio: true,
      maximo: 100_000,
    },
  ];

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }

  protected registrar(valores: ValoresFormulario): void {
    // a entrada soma ao saldo; repetir o envio somaria duas vezes
    if (this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.erro.set('');

    this.service
      .registrarEntrada(this.produto().id, valores['quantidade'] as number)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: () => {
          this.registrada.emit();
          this.fechar();
        },
        error: (erro: unknown) => {
          if (erro instanceof HttpErrorResponse && erro.status === 400) {
            this.erro.set('Informe uma quantidade inteira entre 1 e 100.000.');
          } else if (erro instanceof HttpErrorResponse && erro.status === 401) {
            this.erro.set('Sua sessão expirou. Faça login novamente.');
          } else if (erro instanceof HttpErrorResponse && erro.status === 404) {
            this.erro.set('Produto não encontrado. Ele pode ter sido excluído.');
          } else {
            this.erro.set(
              'Não foi possível confirmar a entrada. Confira o saldo na lista antes de tentar de novo.',
            );
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
