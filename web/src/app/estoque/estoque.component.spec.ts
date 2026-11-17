import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstoqueComponent } from './estoque.component';

registerLocaleData(pt);

describe('Estoque', () => {
  let fixture: ComponentFixture<EstoqueComponent>;
  let http: HttpTestingController;
  const itens = [
    {
      id: 1,
      name: 'Cabo de Embreagem',
      sku: 'CE-300',
      stock: 0,
      stockUpdatedAt: '2026-10-30T16:12:00-03:00',
    },
    {
      id: 2,
      name: 'Vela NGK',
      sku: 'VI-CR7',
      stock: 4,
      stockUpdatedAt: '2026-10-31T08:30:00-03:00',
    },
  ];
  const anuncios = [
    { id: 1, productId: 2, marketplaceId: 1, status: 'publicado' },
    { id: 2, productId: 2, marketplaceId: 2, status: 'publicado' },
    { id: 3, productId: 2, marketplaceId: 3, status: 'rascunho' },
  ];

  beforeEach(() => {
    // jsdom nao implementa showModal, close nem hidePopover
    HTMLElement.prototype.hidePopover = function () {};
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };

    TestBed.configureTestingModule({
      imports: [EstoqueComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EstoqueComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function pagina(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function botao(texto: string): HTMLButtonElement {
    const encontrado = Array.from(pagina().querySelectorAll<HTMLButtonElement>('button')).find(
      (item) => item.textContent?.trim() === texto,
    );
    expect(encontrado, `Botão ${texto} precisa estar disponível.`).toBeDefined();
    return encontrado!;
  }

  function carregar(): void {
    http.expectOne('/api/estoque').flush(itens);
    http.expectOne('/api/anuncios').flush(anuncios);
    fixture.detectChanges();
  }

  it('mostra saldo, resumo dos anúncios e destaca produto sem saldo', () => {
    carregar();
    const linhas = pagina().querySelectorAll('tbody tr');
    expect(linhas[0].classList).toContain('alerta');
    expect(linhas[0].textContent).toContain('—');
    expect(linhas[1].textContent).toContain('2 publicados · 1 rascunho');
  });

  it('registra entrada com a quantidade informada e recarrega a lista', () => {
    carregar();
    botao('Registrar entrada').click();
    fixture.detectChanges();

    const produto = pagina().querySelector<HTMLSelectElement>('#formulario-entrada-produtoId')!;
    produto.value = '1: 1';
    produto.dispatchEvent(new Event('change'));
    const quantidade = pagina().querySelector<HTMLInputElement>('#formulario-entrada-quantidade')!;
    quantidade.value = '0';
    quantidade.dispatchEvent(new Event('input'));
    pagina().querySelector<HTMLButtonElement>('dialog button[type="submit"]')!.click();
    fixture.detectChanges();
    expect(pagina().textContent).toContain('Informe um número inteiro entre 1 e 100.000.');

    quantidade.value = '12';
    quantidade.dispatchEvent(new Event('input'));
    pagina().querySelector<HTMLButtonElement>('dialog button[type="submit"]')!.click();
    const envio = http.expectOne({ method: 'POST', url: '/api/estoque/1/entradas' });
    expect(envio.request.body).toEqual({ quantity: 12 });
    envio.flush({ stock: 12 });
    carregar();
    expect(pagina().querySelector('dialog')).toBeNull();
  });

  it('abre a entrada pelo menu da linha com o produto já selecionado', () => {
    carregar();
    pagina()
      .querySelectorAll('tbody tr')[1]
      .querySelector<HTMLButtonElement>('.menu-opcoes button')!
      .click();
    fixture.detectChanges();

    const produto = pagina().querySelector<HTMLSelectElement>('#formulario-entrada-produtoId')!;
    expect(produto.selectedOptions[0].textContent).toContain('Vela NGK');
  });
});
