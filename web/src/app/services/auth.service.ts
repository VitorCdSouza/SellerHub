import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { timeout } from 'rxjs';

export interface RespostaLogin {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  entrar(email: string, senha: string) {
    return this.http
      .post<RespostaLogin>('http://localhost:8080/login', { email, password: senha })
      .pipe(timeout(10_000));
  }
}
