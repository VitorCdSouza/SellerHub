import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const sessaoInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = auth.usuario();
  const caminho = requisicao.url.split('?')[0];
  const protegida =
    caminho.startsWith('/api/') && !['/api/login', '/api/sessao', '/api/logout'].includes(caminho);

  return proximo(requisicao).pipe(
    catchError((falha: unknown) => {
      // Ignora também respostas atrasadas de uma conta que já saiu.
      if (
        protegida &&
        usuario &&
        auth.usuario() === usuario &&
        falha instanceof HttpErrorResponse &&
        falha.status === 401
      ) {
        auth.expirarSessao();
        void router.navigate(['/'], {
          queryParams: { motivo: 'expirada', retorno: router.url },
        });
      }
      return throwError(() => falha);
    }),
  );
};
