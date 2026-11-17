import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProdutosComponent } from './produtos.component';

registerLocaleData(pt);

describe('Listagem de produtos integrada ao serviço HTTP', () => {
  let fixture: ComponentFixture<ProdutosComponent>;
  let http: HttpTestingController;
  const produto = {
    id: 5,
    name: 'Peça de teste',
    sku: 'PECA-5',
    basePrice: 35.5,
    stock: 4,
    stockUpdatedAt: '2026-10-31T08:30:00-03:00',
  };

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
      imports: [ProdutosComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProdutosComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function leitura(pagina: number) {
    return http.expectOne(`/api/produtos?pagina=${pagina}&limite=20`);
  }

  function botao(texto: string): HTMLButtonElement {
    const botoes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );
    const encontrado = botoes.find((item) => item.textContent?.trim() === texto);
    expect(encontrado, `Botão ${texto} precisa estar disponível.`).toBeDefined();
    return encontrado!;
  }

  it('consulta a primeira página, anuncia carregamento e distingue catálogo vazio', () => {
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('Carregando produtos');
    leitura(1).flush({ items: [], total: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Seu catálogo ainda não possui produtos cadastrados.',
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
  });

  it('usa o total da API e impede avanço depois da última página', () => {
    leitura(1).flush({ items: [produto], total: 21 });
    fixture.detectChanges();
    expect(botao('Anterior').disabled).toBe(true);
    expect(botao('Próxima').disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('35,50');
    botao('Próxima').click();
    leitura(2).flush({ items: [{ ...produto, id: 6, sku: 'PECA-6' }], total: 21 });
    fixture.detectChanges();
    expect(botao('Anterior').disabled).toBe(false);
    expect(botao('Próxima').disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
  });

  it('oferece recuperação para uma página sem itens quando ainda existem produtos', () => {
    leitura(1).flush({ items: [produto], total: 21 });
    fixture.detectChanges();
    botao('Próxima').click();
    leitura(2).flush({ items: [], total: 20 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Seu catálogo ainda não possui produtos cadastrados.',
    );
    expect(botao('Anterior').disabled).toBe(false);
    botao('Anterior').click();
    leitura(1).flush({ items: [produto], total: 20 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(produto.name);
    expect(fixture.nativeElement.textContent).toContain('Página 1 de 1');
  });

  it('recupera a listagem após falha sem encerrar as próximas consultas', () => {
    leitura(1).flush({ message: 'Falha de teste' }, { status: 500, statusText: 'Erro' });
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
    ).toContain('Não foi possível carregar');
    botao('Tentar novamente').click();
    leitura(1).flush({ items: [produto], total: 1 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(produto.name);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).toBeNull();
  });

  it('permite repetir a primeira página vazia com total positivo sem navegação anterior', () => {
    leitura(1).flush({ items: [], total: 1 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Seu catálogo ainda não possui produtos cadastrados.',
    );
    expect(botao('Anterior').disabled).toBe(true);
    expect(botao('Próxima').disabled).toBe(true);
    botao('Tentar novamente').click();
    leitura(1).flush({ items: [produto], total: 1 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(produto.name);
  });

  it('cancela uma página pendente e conserva a resposta da navegação mais recente', () => {
    leitura(1).flush({ items: [produto], total: 40 });
    fixture.detectChanges();
    fixture.componentInstance['avancar']();
    const anterior = leitura(2);
    fixture.componentInstance['voltar']();
    expect(anterior.cancelled).toBe(true);
    leitura(1).flush({ items: [produto], total: 40 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Página 1 de 2');
    expect(fixture.nativeElement.textContent).toContain(produto.name);
  });

  it('abre o cadastro em modal e recarrega a página atual depois de cadastrar', () => {
    const tela = fixture.nativeElement as HTMLElement;
    leitura(1).flush({ items: [], total: 0 });
    fixture.detectChanges();

    botao('Cadastrar primeiro produto').click();
    fixture.detectChanges();
    expect(tela.querySelector('dialog')?.open).toBe(true);

    for (const [id, valor] of [
      ['nome', produto.name],
      ['sku', produto.sku],
      ['precoBase', '35,50'],
    ]) {
      const campo = tela.querySelector<HTMLInputElement>(`#formulario-produto-${id}`)!;
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
    }
    tela.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    http.expectOne('/api/produtos').flush({ id: 5 }, { status: 201, statusText: 'Created' });
    leitura(1).flush({ items: [produto], total: 1 });
    fixture.detectChanges();

    expect(tela.querySelector('dialog')).toBeNull();
    expect(tela.textContent).toContain(produto.name);
  });

  it('fecha o modal sem gravar nem recarregar a listagem', () => {
    const tela = fixture.nativeElement as HTMLElement;
    leitura(1).flush({ items: [produto], total: 1 });
    fixture.detectChanges();

    botao('+ Novo produto').click();
    fixture.detectChanges();
    Array.from(tela.querySelectorAll<HTMLButtonElement>('dialog button'))
      .find((item) => item.textContent?.trim() === 'Cancelar')!
      .click();
    fixture.detectChanges();

    expect(tela.querySelector('dialog')).toBeNull();
    http.expectNone('/api/produtos');
  });

  it('mostra o saldo e destaca produto sem saldo', () => {
    const tela = fixture.nativeElement as HTMLElement;
    leitura(1).flush({ items: [{ ...produto, id: 6, stock: 0 }, produto], total: 2 });
    fixture.detectChanges();

    const linhas = tela.querySelectorAll('tbody tr');
    expect(linhas[0].classList).toContain('alerta');
    expect(linhas[0].textContent).toContain('(sem saldo)');
    expect(linhas[1].classList).not.toContain('alerta');
    expect(linhas[1].textContent).toContain('31/10/2026');
  });

  it('registra entrada pelo menu da linha e recarrega a página atual', () => {
    const tela = fixture.nativeElement as HTMLElement;
    leitura(1).flush({ items: [produto], total: 1 });
    fixture.detectChanges();

    Array.from(tela.querySelectorAll<HTMLButtonElement>('tbody .menu-opcoes button'))
      .find((item) => item.textContent?.trim() === 'Registrar entrada')!
      .click();
    fixture.detectChanges();
    expect(tela.querySelector('dialog')?.textContent).toContain('Saldo atual: 4 un.');

    const quantidade = tela.querySelector<HTMLInputElement>('#formulario-entrada-quantidade')!;
    quantidade.value = '0';
    quantidade.dispatchEvent(new Event('input'));
    tela.querySelector<HTMLButtonElement>('dialog button[type="submit"]')!.click();
    fixture.detectChanges();
    expect(tela.textContent).toContain('Informe um número inteiro entre 1 e 100.000.');

    quantidade.value = '12';
    quantidade.dispatchEvent(new Event('input'));
    tela.querySelector<HTMLButtonElement>('dialog button[type="submit"]')!.click();
    const envio = http.expectOne({ method: 'POST', url: '/api/estoque/5/entradas' });
    expect(envio.request.body).toEqual({ quantity: 12 });
    envio.flush({ stock: 16 });
    leitura(1).flush({ items: [{ ...produto, stock: 16 }], total: 1 });
    fixture.detectChanges();

    expect(tela.querySelector('dialog')).toBeNull();
    expect(tela.querySelector('tbody tr')?.textContent).toContain('16');
  });

  it('cancela a consulta ao destruir a página', () => {
    const pendente = leitura(1);
    fixture.destroy();
    expect(pendente.cancelled).toBe(true);
  });
});
