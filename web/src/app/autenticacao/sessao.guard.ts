import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const sessaoGuard: CanActivateChildFn = (_rota, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.garantirSessao().pipe(
    map((sessao) => {
      if (sessao === 'autenticada') return true;
      const caminho = sessao === 'indisponivel' ? '/sessao-indisponivel' : '/';
      return router.createUrlTree([caminho], { queryParams: { retorno: estado.url } });
    }),
  );
};
