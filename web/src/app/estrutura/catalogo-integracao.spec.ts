import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../app.config';
import { AuthService } from '../services/auth.service';

describe('Integração da estrutura, sessão e catálogo', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;
  const produto = { id: 5, name: 'Produto da conta A', sku: 'QA-5', basePrice: 35.5 };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => http.verify());

  function tela(): HTMLElement {
    return harness.routeNativeElement!;
  }

  async function autenticar(caminho = '/inicio') {
    const navegacao = harness.navigateByUrl(caminho);
    await vi.waitFor(() => expect(TestBed.inject(AuthService).estado()).toBe('consultando'));
    http.expectOne('/api/sessao').flush({ id: 2, email: 'conta-a@exemplo.test' });
    await navegacao;
    harness.detectChanges();
  }

  function preencher(id: string, valor: string) {
    const campo = tela().querySelector<HTMLInputElement>(`#${id}`)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function enviar() {
    tela()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    harness.detectChanges();
  }

  function responderLista(itens = [produto]) {
    const chamada = http.expectOne('/api/produtos?pagina=1&limite=20');
    chamada.flush({ items: itens, total: itens.length });
    harness.detectChanges();
  }

  it.each(['/produtos', '/produtos/novo', '/produtos/5', '/produtos/5/editar'])(
    'protege acesso direto a %s e preserva o destino para novo login',
    async (caminho) => {
      const navegacao = harness.navigateByUrl(caminho);
      await vi.waitFor(() => expect(TestBed.inject(AuthService).estado()).toBe('consultando'));
      http.expectNone((req) => req.url.startsWith('/api/produtos'));
      http.expectOne('/api/sessao').flush({}, { status: 401, statusText: 'Unauthorized' });
      await navegacao;
      expect(router.parseUrl(router.url).queryParams['retorno']).toBe(caminho);
      expect(tela().querySelector('form')).not.toBeNull();
      expect(tela().textContent).not.toContain('Conta conectada');
    },
  );

  it('liga a página inicial ao catálogo disponível pelo menu e pelas ações', async () => {
    await autenticar();
    const acoes = tela().querySelector('.acoes-catalogo')!;
    expect(acoes.querySelector('a[href="/produtos"]')?.textContent).toContain('Ver produtos');
    expect(acoes.querySelector('a[href="/produtos/novo"]')?.textContent).toContain(
      'Cadastrar produto',
    );
    expect(tela().textContent).not.toContain('estarão disponíveis aqui em breve');
    tela().querySelector<HTMLAnchorElement>('nav a[href="/produtos"]')!.click();
    await harness.fixture.whenStable();
    responderLista();
    expect(router.url).toBe('/produtos');
    expect(tela().querySelector('nav a[aria-current="page"]')?.textContent).toContain('Produtos');
    expect(tela().textContent).toContain('35,50');
  });

  it('compõe cadastro, detalhe, edição e retorno à lista com os DTOs reais', async () => {
    await autenticar();
    await harness.navigateByUrl('/produtos/novo');
    preencher('nome', 'Produto novo');
    preencher('sku', 'QA-NOVO');
    preencher('precoBase', '35,50');
    enviar();
    const cadastro = http.expectOne('/api/produtos');
    expect(cadastro.request.method).toBe('POST');
    expect(cadastro.request.body).toEqual({
      name: 'Produto novo',
      sku: 'QA-NOVO',
      basePrice: 35.5,
    });
    cadastro.flush({ id: 5 }, { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();
    const criado = { ...produto, name: 'Produto novo', sku: 'QA-NOVO' };
    responderLista([criado]);
    expect(router.url).toBe('/produtos');
    expect(tela().textContent).toContain('Produto novo');

    await harness.navigateByUrl('/produtos/5');
    http.expectOne('/api/produtos/5').flush(criado);
    harness.detectChanges();
    expect(tela().textContent).toContain('Produto novo');
    await harness.navigateByUrl('/produtos/5/editar');
    http.expectOne('/api/produtos/5').flush(criado);
    harness.detectChanges();
    expect(tela().querySelector<HTMLInputElement>('#nome')!.value).toBe('Produto novo');
    preencher('nome', 'Produto editado');
    preencher('precoBase', '42,01');
    enviar();
    const atualizacao = http.expectOne('/api/produtos/5');
    expect(atualizacao.request.method).toBe('PUT');
    expect(atualizacao.request.body).toEqual({
      name: 'Produto editado',
      sku: 'QA-NOVO',
      basePrice: 42.01,
    });
    atualizacao.flush({ success: true, message: 'Produto atualizado' });
    await harness.fixture.whenStable();
    const editado = { ...criado, name: 'Produto editado', basePrice: 42.01 };
    http.expectOne('/api/produtos/5').flush(editado);
    harness.detectChanges();
    expect(router.url).toBe('/produtos/5');
    expect(tela().textContent).toContain('42,01');
    await harness.navigateByUrl('/produtos');
    responderLista([editado]);
    expect(tela().textContent).toContain('Produto editado');
    expect(tela().textContent).toContain('42,01');
  });

  it('cancela a leitura do catálogo ao sair e não mantém dados para a próxima conta', async () => {
    await autenticar();
    await harness.navigateByUrl('/produtos');
    const pendente = http.expectOne('/api/produtos?pagina=1&limite=20');
    tela().querySelector<HTMLButtonElement>('.botao-saida')!.click();
    http.expectOne('/api/logout').flush({ success: true, message: 'Sessão encerrada' });
    await harness.fixture.whenStable();
    expect(pendente.cancelled).toBe(true);
    expect(router.url).toBe('/');
    expect(tela().textContent).not.toContain('Produto da conta A');

    preencher('email', 'conta-b@exemplo.test');
    preencher('senha', '123456');
    enviar();
    http.expectOne('/api/login').flush({ success: true, message: 'Login realizado' });
    http.expectOne('/api/sessao').flush({ id: 3, email: 'conta-b@exemplo.test' });
    await harness.fixture.whenStable();
    await harness.navigateByUrl('/produtos');
    responderLista([]);
    expect(tela().textContent).toContain('conta-b@exemplo.test');
    expect(tela().textContent).not.toContain('Produto da conta A');
    expect(tela().textContent).toContain('Nenhum produto encontrado');
  });

  it('recupera o destino de detalhe depois de indisponibilidade da sessão', async () => {
    const navegacao = harness.navigateByUrl('/produtos/5');
    await vi.waitFor(() => expect(TestBed.inject(AuthService).estado()).toBe('consultando'));
    http.expectOne('/api/sessao').flush({}, { status: 500, statusText: 'Server Error' });
    await navegacao;
    expect(router.url).toContain('/sessao-indisponivel');
    http.expectNone('/api/produtos/5');
    tela().querySelector<HTMLButtonElement>('button')!.click();
    http.expectOne('/api/sessao').flush({ id: 2, email: 'conta-a@exemplo.test' });
    await harness.fixture.whenStable();
    http.expectOne('/api/produtos/5').flush(produto);
    harness.detectChanges();
    expect(router.url).toBe('/produtos/5');
    expect(tela().textContent).toContain('Produto da conta A');
  });

  it('retoma a URL de edição depois do login solicitado pelo guard', async () => {
    const navegacao = harness.navigateByUrl('/produtos/5/editar');
    await vi.waitFor(() => expect(TestBed.inject(AuthService).estado()).toBe('consultando'));
    http.expectOne('/api/sessao').flush({}, { status: 401, statusText: 'Unauthorized' });
    await navegacao;
    preencher('email', 'conta-a@exemplo.test');
    preencher('senha', '123456');
    enviar();
    http.expectOne('/api/login').flush({ success: true, message: 'Login realizado' });
    http.expectOne('/api/sessao').flush({ id: 2, email: 'conta-a@exemplo.test' });
    await harness.fixture.whenStable();
    http.expectOne('/api/produtos/5').flush(produto);
    harness.detectChanges();
    expect(router.url).toBe('/produtos/5/editar');
    expect(tela().querySelector<HTMLInputElement>('#nome')!.value).toBe('Produto da conta A');
  });

  it('retorna ao login com o destino original se a API expirar o acesso ao detalhe', async () => {
    await autenticar();
    await harness.navigateByUrl('/produtos/5');
    http.expectOne('/api/produtos/5').flush({}, { status: 401, statusText: 'Unauthorized' });
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.parseUrl(router.url).queryParams).toEqual({
      motivo: 'expirada',
      retorno: '/produtos/5',
    });
    expect(tela().textContent).toContain('Sua sessão expirou');
    expect(tela().textContent).not.toContain('Produto da conta A');
    expect(TestBed.inject(AuthService).usuario()).toBeNull();
  });
});
