import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { RespostaLogin } from '../services/auth.service';

export interface Canal {
  id: number;
  nome: string;
  comissao: number;
  anuncios: number;
}

export interface DadosConta {
  nome: string;
  email: string;
}

export interface DadosSenha {
  senhaAtual: string;
  novaSenha: string;
}

interface CanalResposta {
  id: number;
  name: string;
  commission: number;
  listings: number;
}

@Injectable({ providedIn: 'root' })
export class AdministracaoService {
  private readonly http = inject(HttpClient);

  listarCanais(): Observable<Canal[]> {
    return this.http.get<CanalResposta[]>('/api/marketplaces').pipe(
      timeout(10_000),
      map((resposta) =>
        resposta.map((canal) => ({
          id: canal.id,
          nome: canal.name,
          comissao: canal.commission,
          anuncios: canal.listings,
        })),
      ),
    );
  }

  atualizarConta(dados: DadosConta): Observable<RespostaLogin> {
    return this.http
      .put<RespostaLogin>('/api/conta', { name: dados.nome, email: dados.email })
      .pipe(timeout(10_000));
  }

  alterarSenha(dados: DadosSenha): Observable<RespostaLogin> {
    return this.http
      .put<RespostaLogin>('/api/conta/senha', {
        currentPassword: dados.senhaAtual,
        newPassword: dados.novaSenha,
      })
      .pipe(timeout(10_000));
  }
}
