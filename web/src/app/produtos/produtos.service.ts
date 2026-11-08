import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { DadosProduto, PaginaProdutos, Produto } from './produto.model';

interface ProdutoResposta {
  id: number;
  name: string;
  sku: string;
  basePrice: number;
}

interface PaginaResposta {
  items: ProdutoResposta[];
  total: number;
}

function mapearProduto(produto: ProdutoResposta): Produto {
  return { id: produto.id, nome: produto.name, sku: produto.sku, precoBase: produto.basePrice };
}

function corpoProduto(produto: DadosProduto) {
  return { name: produto.nome, sku: produto.sku, basePrice: produto.precoBase };
}

@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private readonly http = inject(HttpClient);

  listar(pagina = 1, limite = 20): Observable<PaginaProdutos> {
    return this.http.get<PaginaResposta>('/api/produtos', { params: { pagina, limite } }).pipe(
      timeout(10_000),
      map((resposta) => ({ itens: resposta.items.map(mapearProduto), total: resposta.total })),
    );
  }

  consultar(id: number) {
    return this.http
      .get<ProdutoResposta>(`/api/produtos/${id}`)
      .pipe(timeout(10_000), map(mapearProduto));
  }

  cadastrar(produto: DadosProduto) {
    return this.http
      .post<{ id: number }>('/api/produtos', corpoProduto(produto))
      .pipe(timeout(10_000));
  }

  atualizar(id: number, produto: DadosProduto) {
    return this.http
      .put<{ success: boolean; message: string }>(`/api/produtos/${id}`, corpoProduto(produto))
      .pipe(timeout(10_000));
  }
}
