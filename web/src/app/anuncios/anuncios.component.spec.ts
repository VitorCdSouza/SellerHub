import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnunciosComponent } from './anuncios.component';

registerLocaleData(pt);

describe('Anúncios', () => {
  let fixture: ComponentFixture<AnunciosComponent>;
  let http: HttpTestingController;
  const anuncios = [
    {
      id: 1,
      marketplaceId: 1,
      marketplace: 'Mercado Livre',
      productId: 10,
      product: 'Kit Relação CG 160',
      sku: 'KR-CG160',
      title: 'Kit Relação Honda CG 160',
      price: 189.9,
      status: 'publicado',
    },
    {
      id: 2,
      marketplaceId: 2,
      marketplace: 'Shopee',
      productId: 10,
      product: 'Kit Relação CG 160',
      sku: 'KR-CG160',
      title: 'Kit Relação CG 160 Fan',
      price: 179.9,
      status: 'rascunho',
    },
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
      imports: [AnunciosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AnunciosComponent);
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

  function digitar(seletor: string, valor: string): void {
    const campo = pagina().querySelector<HTMLInputElement | HTMLSelectElement>(seletor)!;
    campo.value = valor;
    campo.dispatchEvent(new Event(campo instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  it('lista os anúncios e filtra por situação', () => {
    http.expectOne('/api/anuncios').flush(anuncios);
    fixture.detectChanges();

    expect(pagina().querySelectorAll('tbody tr').length).toBe(2);
    expect(pagina().textContent).toContain('189,90');

    botao('Rascunhos (1)').click();
    fixture.detectChanges();
    const linhas = pagina().querySelectorAll('tbody tr');
    expect(linhas.length).toBe(1);
    expect(linhas[0].textContent).toContain('Shopee');
  });

  it('só oferece edição para anúncio que ainda não está no marketplace', () => {
    http.expectOne('/api/anuncios').flush(anuncios);
    fixture.detectChanges();

    const linhas = pagina().querySelectorAll('tbody tr');
    const editar = (linha: Element) =>
      linha.querySelector<HTMLButtonElement>('.menu-opcoes button')!;
    expect(linhas[0].querySelector('.botao-opcoes')).not.toBeNull();
    expect(editar(linhas[0]).disabled).toBe(true);
    expect(editar(linhas[1]).disabled).toBe(false);
  });

  it('exclui anúncio fora do marketplace depois de confirmar e recarrega a lista', () => {
    http.expectOne('/api/anuncios').flush(anuncios);
    fixture.detectChanges();

    const opcao = (linha: Element, rotulo: string) =>
      Array.from(linha.querySelectorAll<HTMLButtonElement>('.menu-opcoes button')).find(
        (item) => item.textContent?.trim() === rotulo,
      )!;
    const linhas = pagina().querySelectorAll('tbody tr');
    expect(opcao(linhas[0], 'Excluir').disabled).toBe(true);
    opcao(linhas[1], 'Excluir').click();
    fixture.detectChanges();
    expect(pagina().querySelector('dialog')?.textContent).toContain(
      'Excluir o anúncio de Kit Relação CG 160 no Shopee?',
    );

    botao('Excluir anúncio').click();
    http
      .expectOne({ method: 'DELETE', url: '/api/anuncios/2' })
      .flush({ success: true, message: 'Anúncio excluído' });
    http.expectOne('/api/anuncios').flush([anuncios[0]]);
    fixture.detectChanges();

    expect(pagina().querySelector('dialog')).toBeNull();
    expect(pagina().querySelectorAll('tbody tr').length).toBe(1);
  });

  it('marca o canal já anunciado e exige descrição e condição para aprovar', async () => {
    http.expectOne('/api/anuncios').flush(anuncios);
    fixture.detectChanges();

    botao('+ Novo anúncio').click();
    fixture.detectChanges();
    http
      .expectOne('/api/estoque')
      .flush([
        { id: 10, name: 'Kit Relação CG 160', sku: 'KR-CG160', stock: 9, stockUpdatedAt: '' },
      ]);
    http.expectOne('/api/marketplaces').flush([
      { id: 1, name: 'Mercado Livre' },
      { id: 2, name: 'Shopee' },
      { id: 3, name: 'Amazon' },
    ]);
    fixture.detectChanges();

    digitar('#formulario-anuncio-produtoId', '1: 10');
    fixture.detectChanges();
    expect(pagina().textContent).toContain('9 un. em estoque');
    const canais = pagina().querySelector<HTMLSelectElement>('#formulario-anuncio-marketplaceId')!;
    expect(canais.options[1].disabled).toBe(true);
    expect(canais.options[2].disabled).toBe(true);
    expect(canais.options[3].disabled).toBe(false);
    expect(pagina().querySelector<HTMLInputElement>('#formulario-anuncio-titulo')!.value).toBe(
      'Kit Relação CG 160',
    );

    digitar('#formulario-anuncio-marketplaceId', '3: 3');
    digitar('#formulario-anuncio-preco', '62,90');
    botao('Aprovar').click();
    fixture.detectChanges();
    expect(pagina().querySelector('#formulario-anuncio-descricao-erro')?.textContent).toContain(
      'Preencha este campo.',
    );
    expect(pagina().querySelector('#formulario-anuncio-condicao-erro')?.textContent).toContain(
      'Selecione uma opção.',
    );

    botao('Salvar rascunho').click();
    fixture.detectChanges();
    const envio = http.expectOne({ method: 'POST', url: '/api/anuncios' });
    expect(envio.request.body).toEqual({
      productId: 10,
      marketplaceId: 3,
      title: 'Kit Relação CG 160',
      description: '',
      price: 62.9,
      status: 'rascunho',
      attributes: { condition: '', brand: '', ean: '' },
    });
    envio.flush({ id: 3 }, { status: 201, statusText: 'Created' });
    http.expectOne('/api/anuncios').flush(anuncios);
    fixture.detectChanges();
    expect(pagina().querySelector('dialog')).toBeNull();
  });

  it('carrega o anúncio na edição e mostra a mensagem de conflito da API', () => {
    http.expectOne('/api/anuncios').flush(anuncios);
    fixture.detectChanges();

    pagina()
      .querySelectorAll('tbody tr')[1]
      .querySelector<HTMLButtonElement>('.menu-opcoes button')!
      .click();
    fixture.detectChanges();
    http.expectOne('/api/anuncios/2').flush({
      ...anuncios[1],
      stock: 4,
      description: 'Kit completo',
      attributes: { condition: 'novo', brand: 'Vaz', ean: '' },
    });
    fixture.detectChanges();
    expect(pagina().querySelector<HTMLInputElement>('#formulario-anuncio-preco')!.value).toBe('179,90');
    expect(pagina().textContent).toContain('4 un.');

    botao('Aprovar').click();
    fixture.detectChanges();
    const envio = http.expectOne({ method: 'PUT', url: '/api/anuncios/2' });
    expect(envio.request.body.status).toBe('aprovado');
    envio.flush(
      { success: false, message: 'Anúncio publicado, pausado ou encerrado não pode ser editado' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();
    expect(pagina().querySelector('[role="alert"]')?.textContent).toContain('não pode ser editado');
  });
});
