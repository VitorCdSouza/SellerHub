
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProdutoDetalheComponent } from './produto-detalhe.component';
import { ProdutosService } from '../produtos.service';
import { Produto } from '../produto.model';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';

registerLocaleData(localePtBr);

describe('Tela de detalhe do produto', () => {
  let fixture: ComponentFixture<ProdutoDetalheComponent>;
  let service: { consultar: ReturnType<typeof vi.fn> };
  let parametros: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const produto: Produto = {
    id: 5,
    nome: 'Produto teste',
    sku: 'P-100',
    precoBase: 35.5,
  };

  beforeEach(() => {
    service = {
      consultar: vi.fn().mockReturnValue(of(produto)),
    };

    parametros = new BehaviorSubject(convertToParamMap({ id: '5' }));

    TestBed.configureTestingModule({
      imports: [ProdutoDetalheComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: parametros.asObservable() },
        },
        { provide: ProdutosService, useValue: service },
      ],
    });

    fixture = TestBed.createComponent(ProdutoDetalheComponent);
    fixture.detectChanges();
  });

  it('deve consultar e exibir os dados do produto', () => {
    expect(service.consultar).toHaveBeenCalledWith(5);
    expect(fixture.nativeElement.textContent).toContain('Produto teste');
    expect(fixture.nativeElement.textContent).toContain('P-100');
    expect(fixture.nativeElement.textContent).toContain('35,50');
  });

  it('não deve consultar a API quando o ID for inválido', () => {
    service.consultar.mockClear();

    parametros.next(convertToParamMap({ id: 'abc' }));
    fixture.detectChanges();

    expect(service.consultar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'O identificador do produto é inválido.',
    );
  });

  it('deve apresentar mensagem quando o produto não for encontrado', () => {
    service.consultar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
          }),
      ),
    );

    parametros.next(convertToParamMap({ id: '999' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Produto não encontrado.',
    );
  });

  it('deve permitir tentar novamente após uma falha', () => {
    service.consultar
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              statusText: 'Server Error',
            }),
        ),
      )
      .mockReturnValueOnce(of(produto));

    parametros.next(convertToParamMap({ id: '6' }));
    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    botao.click();
    fixture.detectChanges();

    expect(service.consultar).toHaveBeenCalledTimes(3);
    expect(service.consultar).toHaveBeenLastCalledWith(6);
    expect(fixture.nativeElement.textContent).toContain('Produto teste');
  });

  it('deve consultar novamente quando o ID da rota mudar', () => {
    const outroProduto: Produto = {
      id: 8,
      nome: 'Outro produto',
      sku: 'P-200',
      precoBase: 50,
    };

    service.consultar.mockReturnValue(of(outroProduto));

    parametros.next(convertToParamMap({ id: '8' }));
    fixture.detectChanges();

    expect(service.consultar).toHaveBeenLastCalledWith(8);
    expect(fixture.nativeElement.textContent).toContain('Outro produto');
    expect(fixture.nativeElement.textContent).not.toContain('Produto teste');
  });
});
