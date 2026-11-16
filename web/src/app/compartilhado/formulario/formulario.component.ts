import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  CampoFormulario,
  ValorCampo,
  ValoresFormulario,
  converterValor,
  validarCampo,
  valorInicial,
} from './campo-formulario';

@Component({
  selector: 'app-formulario',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario.component.html',
  styleUrl: './formulario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioComponent implements OnInit {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  // id do form, usado pelo botao de envio fora dele e como prefixo dos campos
  readonly identificador = input.required<string>();
  readonly campos = input.required<CampoFormulario[]>();
  readonly enviando = input(false);
  readonly erroEnvio = input('');

  readonly salvar = output<ValoresFormulario>();
  readonly alterado = output<ValoresFormulario>();

  protected readonly formulario = new FormGroup<Record<string, FormControl<ValorCampo>>>({});
  protected readonly submetido = signal(false);

  // os controles nascem uma vez; depois disso, mudancas em campos so trocam opcoes, ajuda e obrigatoriedade
  ngOnInit(): void {
    for (const campo of this.campos()) {
      this.formulario.addControl(
        campo.nome,
        new FormControl<ValorCampo>(valorInicial(campo), {
          validators: (controle) => validarCampo(this.campo(campo.nome), controle.value),
        }),
      );
    }

    this.formulario.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.alterado.emit(this.formulario.getRawValue()));
  }

  definirValor(nome: string, valor: ValorCampo): void {
    this.formulario.controls[nome].setValue(valor);
  }

  protected erroVisivel(nome: string): boolean {
    return this.submetido() && this.formulario.controls[nome].invalid;
  }

  protected enviar(): void {
    this.submetido.set(true);

    // a obrigatoriedade pode ter mudado desde a ultima digitacao
    for (const controle of Object.values(this.formulario.controls)) {
      controle.updateValueAndValidity({ emitEvent: false });
    }

    if (this.formulario.invalid) {
      this.elemento.nativeElement.querySelector<HTMLElement>('.ng-invalid:not(form)')?.focus();
      return;
    }

    if (this.enviando()) {
      return;
    }

    const valores: ValoresFormulario = {};
    for (const campo of this.campos()) {
      valores[campo.nome] = converterValor(campo, this.formulario.controls[campo.nome].value);
    }
    this.salvar.emit(valores);
  }

  private campo(nome: string): CampoFormulario {
    return this.campos().find((campo) => campo.nome === nome)!;
  }
}
