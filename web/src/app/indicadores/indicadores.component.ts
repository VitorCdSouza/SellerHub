import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, PercentPipe, formatDate } from '@angular/common';
import { EMPTY, Subject, catchError, finalize, startWith, switchMap } from 'rxjs';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';
import { IndicadoresService, MetricaAnuncio } from './indicadores.service';

interface OpcaoMes {
  valor: string;
  rotulo: string;
}

interface MetricaCanal {
  nome: string;
  acessos: number;
  conversoes: number;
}

@Component({
  selector: 'app-indicadores',
  imports: [DecimalPipe, FocoPaginaDirective, PercentPipe],
  templateUrl: './indicadores.component.html',
  styleUrl: './indicadores.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadoresComponent {
  private readonly service = inject(IndicadoresService);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly solicitacaoLeitura = new Subject<void>();

  // mes atual e os 11 anteriores
  protected readonly meses: OpcaoMes[] = Array.from({ length: 12 }, (_, indice) => {
    const hoje = new Date();
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - indice, 1);
    return {
      valor: formatDate(data, 'yyyy-MM', this.locale),
      rotulo: formatDate(data, "MMMM 'de' y", this.locale),
    };
  });

  protected readonly mes = signal(this.meses[0]);
  protected readonly metricas = signal<MetricaAnuncio[]>([]);
  protected readonly carregando = signal(false);
  protected readonly erro = signal('');

  protected readonly totais = computed(() =>
    this.metricas().reduce(
      (soma, metrica) => ({
        acessos: soma.acessos + metrica.acessos,
        conversoes: soma.conversoes + metrica.conversoes,
      }),
      { acessos: 0, conversoes: 0 },
    ),
  );

  protected readonly porCanal = computed(() => {
    const canais = new Map<string, MetricaCanal>();
    for (const metrica of this.metricas()) {
      const canal = canais.get(metrica.marketplace) ?? {
        nome: metrica.marketplace,
        acessos: 0,
        conversoes: 0,
      };
      canal.acessos += metrica.acessos;
      canal.conversoes += metrica.conversoes;
      canais.set(metrica.marketplace, canal);
    }
    return [...canais.values()].sort((primeiro, segundo) => segundo.acessos - primeiro.acessos);
  });

  // a api ja devolve ordenado por acessos, o primeiro e o maior
  protected readonly maiorAcesso = computed(() => this.metricas()[0]?.acessos || 1);

  constructor() {
    this.solicitacaoLeitura
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.carregando.set(true);
          this.erro.set('');

          return this.service.listarPorAnuncio(this.mes().valor).pipe(
            catchError(() => {
              this.erro.set(
                'Não foi possível carregar os indicadores. Verifique sua conexão e tente novamente.',
              );
              return EMPTY;
            }),
            finalize(() => this.carregando.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((metricas) => this.metricas.set(metricas));
  }

  protected selecionarMes(valor: string): void {
    this.mes.set(this.meses.find((opcao) => opcao.valor === valor) ?? this.meses[0]);
    this.solicitacaoLeitura.next();
  }

  protected recarregar(): void {
    this.solicitacaoLeitura.next();
  }

  protected taxa(conversoes: number, acessos: number): number | null {
    return acessos > 0 ? conversoes / acessos : null;
  }
}
