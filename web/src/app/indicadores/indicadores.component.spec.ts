import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndicadoresComponent } from './indicadores.component';

registerLocaleData(pt);

describe('Indicadores', () => {
  let fixture: ComponentFixture<IndicadoresComponent>;
  let http: HttpTestingController;
  const metricas = [
    { listingId: 1, title: 'Capacete Preto', marketplace: 'Mercado Livre', visits: 270, conversions: 13 },
    { listingId: 2, title: 'Capacete Cristal', marketplace: 'Shopee', visits: 85, conversions: 2 },
    { listingId: 3, title: 'Luva Couro', marketplace: 'Mercado Livre', visits: 45, conversions: 0 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IndicadoresComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(IndicadoresComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function pagina(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function seletor(): HTMLSelectElement {
    return pagina().querySelector<HTMLSelectElement>('#filtro-mes')!;
  }

  it('consulta o mês atual e soma os totais por canal', () => {
    const consulta = http.expectOne((requisicao) => requisicao.url === '/api/indicadores');
    expect(consulta.request.params.get('mes')).toBe(seletor().options[0].value);
    consulta.flush(metricas);
    fixture.detectChanges();

    const resumo = pagina().querySelector('.resumo')!.textContent!;
    expect(resumo).toContain('400');
    expect(resumo).toContain('15');
    expect(resumo).toContain('3,75%');

    const linhas = pagina().querySelectorAll('tbody tr');
    expect(linhas[0].textContent).toContain('Mercado Livre');
    expect(linhas[0].textContent).toContain('315');
    expect(linhas[1].textContent).toContain('Shopee');
    expect(pagina().querySelectorAll('.barras li').length).toBe(3);
  });

  it('troca de mês refaz a consulta e mostra o vazio do período', () => {
    http.expectOne((requisicao) => requisicao.url === '/api/indicadores').flush(metricas);
    fixture.detectChanges();

    const anterior = seletor().options[1];
    seletor().value = anterior.value;
    seletor().dispatchEvent(new Event('change'));
    const consulta = http.expectOne((requisicao) => requisicao.url === '/api/indicadores');
    expect(consulta.request.params.get('mes')).toBe(anterior.value);
    consulta.flush([]);
    fixture.detectChanges();

    expect(pagina().textContent).toContain(`Nenhum acesso registrado em ${anterior.textContent!.trim()}`);
  });

  it('oferece nova tentativa quando a consulta falha', () => {
    http
      .expectOne((requisicao) => requisicao.url === '/api/indicadores')
      .flush(null, { status: 500, statusText: 'Erro' });
    fixture.detectChanges();
    expect(pagina().querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar os indicadores',
    );

    pagina().querySelector<HTMLButtonElement>('.estado.erro button')!.click();
    http.expectOne((requisicao) => requisicao.url === '/api/indicadores').flush(metricas);
    fixture.detectChanges();
    expect(pagina().querySelector('.resumo')).not.toBeNull();
  });
});
