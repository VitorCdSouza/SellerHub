import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { NovoProdutoComponent } from './novo-produto.component';
import { ProdutoFormularioComponent } from '../produto-formulario/produto-formulario.component';
import { ProdutosService } from '../produtos.service';
import { DadosProduto } from '../produto.model';

describe('Modal de cadastro de produto', () => {
  let fixture: ComponentFixture<NovoProdutoComponent>;
  let service: { cadastrar: ReturnType<typeof vi.fn> };
  let formulario: ProdutoFormularioComponent;
  let cadastrado: ReturnType<typeof vi.fn<() => void>>;
  let fechado: ReturnType<typeof vi.fn<() => void>>;

  const dados: DadosProduto = {
    nome: 'Produto teste',
    sku: 'P-100',
    precoBase: 35.5,
  };

  function dialogo(): HTMLDialogElement {
    return (fixture.nativeElement as HTMLElement).querySelector('dialog')!;
  }

  function botao(texto: string): HTMLButtonElement {
    return Array.from(dialogo().querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === texto,
    )!;
  }

  beforeEach(() => {
    // jsdom nao implementa showModal nem close
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };

    service = { cadastrar: vi.fn() };

    TestBed.configureTestingModule({
      imports: [NovoProdutoComponent],
      providers: [{ provide: ProdutosService, useValue: service }],
    });

    fixture = TestBed.createComponent(NovoProdutoComponent);
    cadastrado = vi.fn<() => void>();
    fechado = vi.fn<() => void>();
    fixture.componentInstance.cadastrado.subscribe(cadastrado);
    fixture.componentInstance.fechado.subscribe(fechado);
    fixture.detectChanges();

    formulario = fixture.debugElement.query(By.directive(ProdutoFormularioComponent))
      .componentInstance as ProdutoFormularioComponent;
  });

  it('abre como modal rotulado pelo título', () => {
    expect(dialogo().open).toBe(true);
    expect(dialogo().getAttribute('aria-labelledby')).toBe('titulo-cadastro');
    expect(dialogo().querySelector('#titulo-cadastro')?.textContent).toContain('Novo produto');
  });

  it('cadastra o produto, avisa a listagem e fecha o modal', () => {
    service.cadastrar.mockReturnValue(of({ status: 201, body: { id: 5 } }));

    formulario.salvar.emit(dados);

    expect(service.cadastrar).toHaveBeenCalledWith(dados);
    expect(cadastrado).toHaveBeenCalledTimes(1);
    expect(fechado).toHaveBeenCalledTimes(1);
    expect(dialogo().open).toBe(false);
  });

  it('impede envios duplicados e mantém o modal aberto enquanto a requisição estiver pendente', () => {
    const resposta = new Subject<{ status: number; body: { id: number } }>();
    service.cadastrar.mockReturnValue(resposta.asObservable());

    formulario.salvar.emit(dados);
    formulario.salvar.emit(dados);
    const esc = new Event('cancel', { cancelable: true });
    dialogo().dispatchEvent(esc);

    expect(service.cadastrar).toHaveBeenCalledTimes(1);
    expect(esc.defaultPrevented).toBe(true);
    expect(fechado).not.toHaveBeenCalled();

    resposta.next({ status: 201, body: { id: 5 } });
    resposta.complete();

    expect(cadastrado).toHaveBeenCalledTimes(1);
    expect(fechado).toHaveBeenCalledTimes(1);
  });

  it('apresenta mensagem e mantém o modal aberto quando a API retornar erro 400', () => {
    service.cadastrar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request' })),
    );

    formulario.salvar.emit(dados);
    fixture.detectChanges();

    expect(dialogo().textContent).toContain('Os dados informados são inválidos.');
    expect(dialogo().open).toBe(true);
    expect(cadastrado).not.toHaveBeenCalled();
  });

  it('apresenta mensagem quando a sessão expirar', () => {
    service.cadastrar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );

    formulario.salvar.emit(dados);
    fixture.detectChanges();

    expect(dialogo().textContent).toContain('Sua sessão expirou.');
  });

  it('fecha sem cadastrar ao cancelar', () => {
    botao('Cancelar').click();

    expect(dialogo().open).toBe(false);
    expect(fechado).toHaveBeenCalledTimes(1);
    expect(cadastrado).not.toHaveBeenCalled();
    expect(service.cadastrar).not.toHaveBeenCalled();
  });

  it('permite fechar com Esc quando não há envio em andamento', () => {
    const esc = new Event('cancel', { cancelable: true });
    dialogo().dispatchEvent(esc);

    expect(esc.defaultPrevented).toBe(false);
  });
});
