import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';

export interface MetricaAnuncio {
  anuncioId: number;
  titulo: string;
  marketplace: string;
  acessos: number;
  conversoes: number;
}

interface MetricaResposta {
  listingId: number;
  title: string;
  marketplace: string;
  visits: number;
  conversions: number;
}

@Injectable({ providedIn: 'root' })
export class IndicadoresService {
  private readonly http = inject(HttpClient);

  // mes no formato 2026-11
  listarPorAnuncio(mes: string): Observable<MetricaAnuncio[]> {
    return this.http.get<MetricaResposta[]>('/api/indicadores', { params: { mes } }).pipe(
      timeout(10_000),
      map((resposta) =>
        resposta.map((metrica) => ({
          anuncioId: metrica.listingId,
          titulo: metrica.title,
          marketplace: metrica.marketplace,
          acessos: metrica.visits,
          conversoes: metrica.conversions,
        })),
      ),
    );
  }
}
