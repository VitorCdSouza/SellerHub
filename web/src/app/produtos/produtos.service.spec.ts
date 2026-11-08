import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProdutosService } from './produtos.service';

describe('Contrato de produtos com a API', () => {
  let service: ProdutosService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProdutosService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('preserva paginação/total e adapta nomes sem converter preço para centavos', () => {
    service.listar(2, 10).subscribe((pagina) => {
      expect(pagina).toEqual({
        itens: [{ id: 3, nome: 'Peça', sku: 'P-1', precoBase: 35.5 }],
        total: 24,
      });
    });
    const req = http.expectOne('/api/produtos?pagina=2&limite=10');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [{ id: 3, name: 'Peça', sku: 'P-1', basePrice: 35.5 }], total: 24 });
  });

  it('mantém uma resposta vazia como lista vazia', () => {
    service.listar().subscribe((pagina) => expect(pagina).toEqual({ itens: [], total: 0 }));
    http.expectOne('/api/produtos?pagina=1&limite=20').flush({ items: [], total: 0 });
  });

  it('envia somente os campos públicos do cadastro e recebe o identificador', () => {
    service
      .cadastrar({ nome: 'Peça', sku: 'P-1', precoBase: 35.5 })
      .subscribe((resposta) => expect(resposta.id).toBe(5));
    const req = http.expectOne('/api/produtos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Peça', sku: 'P-1', basePrice: 35.5 });
    req.flush({ id: 5 }, { status: 201, statusText: 'Created' });
  });

  it('usa PUT na edição e propaga 404 sem inventar um produto local', () => {
    const erro = vi.fn();
    service
      .atualizar(5, { nome: 'Peça alterada', sku: 'P-1', precoBase: 40 })
      .subscribe({ error: erro });
    const req = http.expectOne('/api/produtos/5');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Peça alterada', sku: 'P-1', basePrice: 40 });
    req.flush(
      { success: false, message: 'Produto não encontrado' },
      { status: 404, statusText: 'Not Found' },
    );
    expect(erro).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
  });

  it('adapta o detalhe sem incluir dados de autoria no contrato', () => {
    service.consultar(5).subscribe((produto) =>
      expect(produto).toEqual({
        id: 5,
        nome: 'Peça',
        sku: 'P-1',
        precoBase: 35.5,
      }),
    );
    http.expectOne('/api/produtos/5').flush({ id: 5, name: 'Peça', sku: 'P-1', basePrice: 35.5 });
  });
});
