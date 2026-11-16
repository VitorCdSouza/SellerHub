import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';

export interface ItemEstoque {
  produtoId: number;
  nome: string;
  sku: string;
  saldo: number;
  atualizadoEm: string;
}

interface ItemResposta {
  id: number;
  name: string;
  sku: string;
  stock: number;
  stockUpdatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private readonly http = inject(HttpClient);

  listar(): Observable<ItemEstoque[]> {
    return this.http.get<ItemResposta[]>('/api/estoque').pipe(
      timeout(10_000),
      map((resposta) =>
        resposta.map((item) => ({
          produtoId: item.id,
          nome: item.name,
          sku: item.sku,
          saldo: item.stock,
          atualizadoEm: item.stockUpdatedAt,
        })),
      ),
    );
  }

  registrarEntrada(produtoId: number, quantidade: number): Observable<number> {
    return this.http
      .post<{ stock: number }>(`/api/estoque/${produtoId}/entradas`, { quantity: quantidade })
      .pipe(
        timeout(10_000),
        map((resposta) => resposta.stock),
      );
  }
}
