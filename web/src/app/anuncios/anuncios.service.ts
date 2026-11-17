import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import {
  Anuncio,
  Condicao,
  DadosAnuncio,
  DetalheAnuncio,
  Marketplace,
  SituacaoAnuncio,
} from './anuncio.model';

interface AnuncioResposta {
  id: number;
  marketplaceId: number;
  marketplace: string;
  productId: number;
  product: string;
  sku: string;
  title: string;
  price: number;
  status: SituacaoAnuncio;
}

interface DetalheResposta extends AnuncioResposta {
  stock: number;
  description: string;
  attributes: { condition: Condicao; brand: string; ean: string };
}

function mapearAnuncio(anuncio: AnuncioResposta): Anuncio {
  return {
    id: anuncio.id,
    marketplaceId: anuncio.marketplaceId,
    marketplace: anuncio.marketplace,
    produtoId: anuncio.productId,
    produto: anuncio.product,
    sku: anuncio.sku,
    titulo: anuncio.title,
    preco: anuncio.price,
    situacao: anuncio.status,
  };
}

function corpoAnuncio(anuncio: DadosAnuncio) {
  return {
    productId: anuncio.produtoId,
    marketplaceId: anuncio.marketplaceId,
    title: anuncio.titulo,
    description: anuncio.descricao,
    price: anuncio.preco,
    status: anuncio.situacao,
    attributes: { condition: anuncio.condicao, brand: anuncio.marca, ean: anuncio.ean },
  };
}

@Injectable({ providedIn: 'root' })
export class AnunciosService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Anuncio[]> {
    return this.http.get<AnuncioResposta[]>('/api/anuncios').pipe(
      timeout(10_000),
      map((resposta) => resposta.map(mapearAnuncio)),
    );
  }

  consultar(id: number): Observable<DetalheAnuncio> {
    return this.http.get<DetalheResposta>(`/api/anuncios/${id}`).pipe(
      timeout(10_000),
      map((resposta) => ({
        ...mapearAnuncio(resposta),
        saldo: resposta.stock,
        descricao: resposta.description,
        condicao: resposta.attributes.condition,
        marca: resposta.attributes.brand,
        ean: resposta.attributes.ean,
      })),
    );
  }

  cadastrar(anuncio: DadosAnuncio) {
    return this.http
      .post<{ id: number }>('/api/anuncios', corpoAnuncio(anuncio))
      .pipe(timeout(10_000));
  }

  atualizar(id: number, anuncio: DadosAnuncio) {
    return this.http
      .put<{ success: boolean; message: string }>(`/api/anuncios/${id}`, corpoAnuncio(anuncio))
      .pipe(timeout(10_000));
  }

  excluir(id: number) {
    return this.http
      .delete<{ success: boolean; message: string }>(`/api/anuncios/${id}`)
      .pipe(timeout(10_000));
  }

  marketplaces(): Observable<Marketplace[]> {
    return this.http.get<{ id: number; name: string }[]>('/api/marketplaces').pipe(
      timeout(10_000),
      map((resposta) => resposta.map((item) => ({ id: item.id, nome: item.name }))),
    );
  }
}
