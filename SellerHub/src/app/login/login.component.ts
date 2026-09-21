import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly campoEmail = viewChild.required<ElementRef<HTMLInputElement>>('campoEmail');
  private readonly campoSenha = viewChild.required<ElementRef<HTMLInputElement>>('campoSenha');

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    senha: ['', Validators.required],
  });
  protected readonly enviando = signal(false);
  protected readonly sucesso = signal('');
  protected readonly erro = signal('');

  protected entrar(): void {
    if (this.enviando()) return;
    this.sucesso.set('');
    this.erro.set('');
    this.formulario.controls.email.setValue(this.formulario.controls.email.value.trim());
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      this.erro.set('Confira o e-mail e a senha antes de entrar.');
      const campo = this.formulario.controls.email.invalid ? this.campoEmail() : this.campoSenha();
      campo.nativeElement.focus();
      return;
    }

    const { email, senha } = this.formulario.getRawValue();
    if (new TextEncoder().encode(senha).length > 72) {
      this.erro.set(
        'A senha deve ter até 72 bytes; caracteres acentuados podem ocupar mais de um byte.',
      );
      this.campoSenha().nativeElement.focus();
      return;
    }
    this.enviando.set(true);
    this.formulario.disable();
    this.auth
      .entrar(email, senha)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.enviando.set(false);
          this.formulario.enable();
          this.formulario.controls.senha.reset();
          if (!this.destroyRef.destroyed) this.campoSenha().nativeElement.focus();
        }),
      )
      .subscribe({
        next: (resposta) => {
          if (resposta.success) this.sucesso.set(resposta.message);
          else this.erro.set(resposta.message);
        },
        error: (falha: unknown) => {
          if (falha instanceof HttpErrorResponse && falha.status === 401) {
            this.erro.set('Credenciais inválidas. Confira o e-mail e a senha.');
          } else if (falha instanceof HttpErrorResponse && falha.status === 400) {
            this.erro.set('Confira o e-mail e a senha informados.');
          } else {
            this.erro.set(
              'Não foi possível realizar o login. Verifique se a API está disponível e tente novamente.',
            );
          }
        },
      });
  }
}
