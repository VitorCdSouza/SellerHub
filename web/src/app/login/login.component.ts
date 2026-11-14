import { NgOptimizedImage } from '@angular/common';
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
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { destinoAposLogin } from '../autenticacao/destino-login';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [NgOptimizedImage, ReactiveFormsModule, FocoPaginaDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private navegando = false;
  private readonly campoEmail = viewChild.required<ElementRef<HTMLInputElement>>('campoEmail');
  private readonly campoSenha = viewChild.required<ElementRef<HTMLInputElement>>('campoSenha');

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    senha: ['', Validators.required],
  });
  protected readonly enviando = signal(false);
  protected readonly senhaVisivel = signal(false);
  protected readonly submetido = signal(false);
  protected readonly sucesso = signal('');
  protected readonly erro = signal(
    this.rota.snapshot.queryParamMap.get('motivo') === 'expirada'
      ? 'Sua sessão expirou. Entre novamente para continuar.'
      : '',
  );

  protected entrar(): void {
    if (this.enviando()) return;
    this.sucesso.set('');
    this.erro.set('');
    this.formulario.controls.email.setValue(this.formulario.controls.email.value.trim());
    this.submetido.set(true);
    if (this.formulario.invalid) {
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
        switchMap((resposta) => {
          if (!resposta.success) {
            this.erro.set(resposta.message);
            return EMPTY;
          }
          this.sucesso.set('Credenciais confirmadas. Verificando seu acesso...');
          return this.auth.consultarSessao();
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.enviando.set(false);
          this.formulario.enable();
          this.formulario.controls.senha.reset();
          this.submetido.set(false);
          if (!this.destroyRef.destroyed && !this.navegando)
            this.campoSenha().nativeElement.focus();
        }),
      )
      .subscribe({
        next: (estado) => {
          this.sucesso.set('');
          const retorno = destinoAposLogin(this.rota.snapshot.queryParamMap.get('retorno'));
          if (estado === 'autenticada') {
            this.navegando = true;
            void this.router.navigateByUrl(retorno, { replaceUrl: true });
          } else if (estado === 'indisponivel') {
            this.navegando = true;
            void this.router.navigate(['/sessao-indisponivel'], {
              queryParams: { retorno },
              replaceUrl: true,
            });
          } else this.erro.set('Não foi possível confirmar sua sessão. Entre novamente.');
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
