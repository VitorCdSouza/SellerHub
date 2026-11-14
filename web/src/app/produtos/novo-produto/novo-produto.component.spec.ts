
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { NovoProdutoComponent } from './novo-produto.component';
import { ProdutoFormularioComponent } from '../produto-formulario/produto-formulario.component';
import { ProdutosService } from '../produtos.service';
import { DadosProduto } from '../produto.model';

describe('Tela de cadastro de produto', () => {
  let fixture: ComponentFixture<NovoProdutoComponent>;
  let service: { cadastrar: ReturnType<typeof vi.fn> };
  let router: Router;
  let formulario: ProdutoFormularioComponent;

  const dados: DadosProduto = {
    nome: 'Produto teste',
    sku: 'P-100',
    precoBase: 35.5,
  };

  beforeEach(() => {
    service = {
      cadastrar: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [NovoProdutoComponent],
      providers: [
        provideRouter([]),
        { provide: ProdutosService, useValue: service },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(NovoProdutoComponent);
    fixture.detectChanges();

    formulario = fixture.debugElement.query(
      By.directive(ProdutoFormularioComponent),
    ).componentInstance as ProdutoFormularioComponent;
  });

  it('deve criar a tela de cadastro', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('deve cadastrar o produto e retornar para a listagem', () => {
    service.cadastrar.mockReturnValue(of({ status: 201, body: { id: 5 }, }));

    formulario.salvar.emit(dados);

    expect(service.cadastrar).toHaveBeenCalledWith(dados);
    expect(router.navigate).toHaveBeenCalledWith(['/produtos']);
  });

  it('deve impedir envios duplicados enquanto a requisição estiver pendente', () => {
    const resposta = new Subject<{
        status: number;
        body: { id: number };
    }>();
    service.cadastrar.mockReturnValue(resposta.asObservable());

    formulario.salvar.emit(dados);
    formulario.salvar.emit(dados);

    expect(service.cadastrar).toHaveBeenCalledTimes(1);

    resposta.next({  status: 201, body: { id: 5 }, });
    resposta.complete();

    expect(router.navigate).toHaveBeenCalledWith(['/produtos']);
  });

  it('deve apresentar mensagem quando a API retornar erro 400', () => {
    service.cadastrar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
          }),
      ),
    );

    formulario.salvar.emit(dados);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Os dados informados são inválidos.',
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('deve apresentar mensagem quando a sessão expirar', () => {
    service.cadastrar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          }),
      ),
    );

    formulario.salvar.emit(dados);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Sua sessão expirou.',
    );
  });

  it('deve voltar para a listagem ao cancelar', () => {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.acoes-pagina .botao-secundario')!
      .click();

    expect(router.navigate).toHaveBeenCalledWith(['/produtos']);
  });
});
