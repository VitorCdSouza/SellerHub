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
import { FormularioComponent } from '../../compartilhado/formulario/formulario.component';
import {
  CampoFormulario,
  ValoresFormulario,
} from '../../compartilhado/formulario/campo-formulario';
import { AdministracaoService } from '../administracao.service';

@Component({
  selector: 'app-alterar-senha',
  imports: [FormularioComponent],
  templateUrl: './alterar-senha.component.html',
  styles: '.dialogo { width: min(32rem, calc(100% - 2rem)); }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlterarSenhaComponent {
  private readonly service = inject(AdministracaoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly alterada = output();
  readonly fechado = output();

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  protected readonly campos: CampoFormulario[] = [
    { nome: 'senhaAtual', rotulo: 'Senha atual', tipo: 'senha', obrigatorio: true },
    {
      nome: 'novaSenha',
      rotulo: 'Nova senha',
      tipo: 'senha',
      obrigatorio: true,
      minimo: 8,
      ajuda: 'Use pelo menos 8 caracteres.',
    },
    { nome: 'confirmacao', rotulo: 'Confirme a nova senha', tipo: 'senha', obrigatorio: true },
  ];

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }

  protected salvar(valores: ValoresFormulario): void {
    const senhaAtual = String(valores['senhaAtual']);
    const novaSenha = String(valores['novaSenha']);

    if (this.enviando()) {
      return;
    }
    if (novaSenha !== valores['confirmacao']) {
      this.erro.set('A confirmação não confere com a nova senha.');
      return;
    }

    this.enviando.set(true);
    this.erro.set('');

    this.service
      .alterarSenha({ senhaAtual, novaSenha })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: () => {
          this.alterada.emit();
          this.fechar();
        },
        error: (erro: unknown) => {
          if (erro instanceof HttpErrorResponse && erro.status === 403) {
            this.erro.set('Senha atual incorreta.');
          } else if (erro instanceof HttpErrorResponse && erro.status === 400) {
            this.erro.set('A nova senha deve ter entre 8 caracteres e 72 bytes.');
          } else {
            this.erro.set('Não foi possível alterar a senha. Tente novamente.');
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
