import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap, timeout } from 'rxjs';

export interface RespostaLogin {
  success: boolean;
  message: string;
}

export interface UsuarioSessao {
  id: number;
  email: string;
}

export type EstadoSessao =
  'desconhecida' | 'consultando' | 'autenticada' | 'anonima' | 'indisponivel';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly usuarioAtual = signal<UsuarioSessao | null>(null);
  private readonly estadoAtual = signal<EstadoSessao>('desconhecida');
  private consultaEmAndamento: Observable<EstadoSessao> | null = null;
  private versaoDaConsulta = -1;
  private versao = 0;

  readonly usuario = this.usuarioAtual.asReadonly();
  readonly estado = this.estadoAtual.asReadonly();

  entrar(email: string, senha: string) {
    this.limparSessao('desconhecida');
    return this.http
      .post<RespostaLogin>('/api/login', { email, password: senha })
      .pipe(timeout(10_000));
  }

  garantirSessao(): Observable<EstadoSessao> {
    return this.estado() === 'autenticada' || this.estado() === 'anonima'
      ? of(this.estado())
      : this.consultarSessao();
  }

  consultarSessao(): Observable<EstadoSessao> {
    if (this.consultaEmAndamento && this.versaoDaConsulta === this.versao)
      return this.consultaEmAndamento;
    const versaoConsulta = this.versao;
    this.estadoAtual.set('consultando');
    const consulta = this.http.get<UsuarioSessao>('/api/sessao').pipe(
      timeout(10_000),
      map((usuario): EstadoSessao => {
        // Uma consulta antiga não pode restabelecer uma sessão encerrada.
        if (versaoConsulta !== this.versao) return this.estado();
        if (!Number.isInteger(usuario.id) || usuario.id <= 0 || typeof usuario.email !== 'string') {
          throw new Error('Resposta de sessão inválida');
        }
        this.usuarioAtual.set(usuario);
        this.estadoAtual.set('autenticada');
        return 'autenticada';
      }),
      catchError((falha: unknown): Observable<EstadoSessao> => {
        if (versaoConsulta !== this.versao) return of(this.estado());
        this.usuarioAtual.set(null);
        const estado =
          falha instanceof HttpErrorResponse && falha.status === 401 ? 'anonima' : 'indisponivel';
        this.estadoAtual.set(estado);
        return of(estado);
      }),
      finalize(() => {
        if (this.consultaEmAndamento === consulta) this.consultaEmAndamento = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.versaoDaConsulta = versaoConsulta;
    this.consultaEmAndamento = consulta;
    return consulta;
  }

  sair(): Observable<void> {
    return this.http.post<RespostaLogin>('/api/logout', {}).pipe(
      timeout(10_000),
      tap((resposta) => {
        if (!resposta.success) throw new Error('Saída não confirmada');
        this.expirarSessao();
      }),
      map(() => undefined),
    );
  }

  expirarSessao(): void {
    this.limparSessao('anonima');
  }

  private limparSessao(estado: EstadoSessao): void {
    this.versao++;
    this.usuarioAtual.set(null);
    this.estadoAtual.set(estado);
  }
}
