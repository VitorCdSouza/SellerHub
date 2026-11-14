import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { DadosProduto } from '../produto.model';

function textoValido(limite: number) {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const tamanho = Array.from(control.value.trim()).length;
    if (tamanho === 0) return { required: true };
    return tamanho > limite
      ? { maxlength: { requiredLength: limite, actualLength: tamanho } }
      : null;
  };
}

function precoValido(control: AbstractControl<string>): ValidationErrors | null {
  const valor = control.value.trim();

  if (!valor) {
    return { required: true };
  }

  if (!/^\d+(?:[,.]\d{1,2})?$/.test(valor)) {
    return { formatoPreco: true };
  }

  const preco = Number(valor.replace(',', '.'));

  if (!Number.isFinite(preco) || preco <= 0) {
    return { precoMinimo: true };
  }

  if (preco >= 100_000_000) {
    return { precoMaximo: true };
  }

  return null;
}

@Component({
  selector: 'app-produto-formulario',
  imports: [ReactiveFormsModule],
  templateUrl: './produto-formulario.component.html',
  styleUrl: './produto-formulario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProdutoFormularioComponent {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly dadosIniciais = input<DadosProduto | null>(null);
  readonly enviando = input(false);
  readonly erroEnvio = input('');

  readonly salvar = output<DadosProduto>();

  protected readonly formulario = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [textoValido(255)],
    }),
    sku: new FormControl('', {
      nonNullable: true,
      validators: [textoValido(100)],
    }),
    precoBase: new FormControl('', {
      nonNullable: true,
      validators: [precoValido],
    }),
  });

  protected readonly submetido = signal(false);

  constructor() {
    effect(() => {
      const dados = this.dadosIniciais();

      if (dados) {
        this.formulario.patchValue({
          nome: dados.nome,
          sku: dados.sku,
          precoBase: String(dados.precoBase).replace('.', ','),
        });
      }
    });
  }

  protected erroVisivel(campo: 'nome' | 'sku' | 'precoBase'): boolean {
    return this.submetido() && this.formulario.controls[campo].invalid;
  }

  protected enviar(): void {
    this.submetido.set(true);

    if (this.formulario.invalid) {
      this.elemento.nativeElement.querySelector<HTMLInputElement>('input.ng-invalid')?.focus();
      return;
    }

    if (this.enviando()) {
      return;
    }

    const { nome, sku, precoBase } = this.formulario.getRawValue();

    this.salvar.emit({
      nome: nome.trim(),
      sku: sku.trim(),
      precoBase: Number(precoBase.replace(',', '.')),
    });
  }
}
