
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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
  Validators,
} from '@angular/forms';
import { DadosProduto } from '../produto.model';

function textoObrigatorioAparado(
  control: AbstractControl<string>,
): ValidationErrors | null {
  return control.value.trim().length > 0 ? null : { required: true };
}

function precoValido(
  control: AbstractControl<string>,
): ValidationErrors | null {
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
  readonly dadosIniciais = input<DadosProduto | null>(null);
  readonly enviando = input(false);
  readonly erroEnvio = input('');

  readonly salvar = output<DadosProduto>();
  readonly cancelar = output<void>();

  protected readonly formulario = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        textoObrigatorioAparado,
        Validators.maxLength(255),
      ],
    }),
    sku: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        textoObrigatorioAparado,
        Validators.maxLength(100),
      ],
    }),
    precoBase: new FormControl('', {
      nonNullable: true,
      validators: [precoValido],
    }),
  });

  protected readonly submetido = signal(false);

  protected readonly tituloBotao = computed(() =>
    this.dadosIniciais() ? 'Salvar alterações' : 'Cadastrar produto',
  );

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

  protected enviar(): void {
    this.submetido.set(true);
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid || this.enviando()) {
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
