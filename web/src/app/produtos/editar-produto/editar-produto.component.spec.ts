import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { EditarProdutoComponent } from './editar-produto.component';
import { FormularioComponent } from '../../compartilhado/formulario/formulario.component';
import { ProdutosService } from '../produtos.service';
import { DadosProduto } from '../produto.model';

describe('Modal de edição de produto', () => {
  let fixture: ComponentFixture<EditarProdutoComponent>;
  let service: { atualizar: ReturnType<typeof vi.fn> };
  let formulario: FormularioComponent;
  let atualizado: ReturnType<typeof vi.fn<() => void>>;
  let fechado: ReturnType<typeof vi.fn<() => void>>;

  const produto = { id: 5, nome: 'Teclado mecânico', sku: 'TEC-005', precoBase: 250 };
  const dados: DadosProduto = { nome: 'Teclado atualizado', sku: 'TEC-005', precoBase: 280 };

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

    service = { atualizar: vi.fn() };

    TestBed.configureTestingModule({
      imports: [EditarProdutoComponent],
      providers: [{ provide: ProdutosService, useValue: service }],
    });

    fixture = TestBed.createComponent(EditarProdutoComponent);
    fixture.componentRef.setInput('produto', produto);
    atualizado = vi.fn<() => void>();
    fechado = vi.fn<() => void>();
    fixture.componentInstance.atualizado.subscribe(atualizado);
    fixture.componentInstance.fechado.subscribe(fechado);
    fixture.detectChanges();

    formulario = fixture.debugElement.query(By.directive(FormularioComponent))
      .componentInstance as FormularioComponent;
  });

  it('abre como modal com o formulário preenchido pelo produto', () => {
    expect(dialogo().open).toBe(true);
    expect(dialogo().getAttribute('aria-labelledby')).toBe('titulo-edicao');
    expect(dialogo().querySelector<HTMLInputElement>('#formulario-produto-nome')?.value).toBe(produto.nome);
    expect(dialogo().querySelector<HTMLInputElement>('#formulario-produto-precoBase')?.value).toBe('250,00');
  });

  it('envia o PUT, avisa a listagem e fecha o modal', () => {
    service.atualizar.mockReturnValue(of({ success: true, message: 'Produto atualizado' }));

    formulario.salvar.emit(dados);

    expect(service.atualizar).toHaveBeenCalledWith(5, dados);
    expect(atualizado).toHaveBeenCalledTimes(1);
    expect(fechado).toHaveBeenCalledTimes(1);
    expect(dialogo().open).toBe(false);
  });

  it('impede envios duplicados e mantém o modal aberto enquanto a requisição estiver pendente', () => {
    const resposta = new Subject<{ success: boolean; message: string }>();
    service.atualizar.mockReturnValue(resposta.asObservable());

    formulario.salvar.emit(dados);
    formulario.salvar.emit(dados);
    const esc = new Event('cancel', { cancelable: true });
    dialogo().dispatchEvent(esc);

    expect(service.atualizar).toHaveBeenCalledTimes(1);
    expect(esc.defaultPrevented).toBe(true);
    expect(fechado).not.toHaveBeenCalled();

    resposta.next({ success: true, message: 'Produto atualizado' });
    resposta.complete();

    expect(atualizado).toHaveBeenCalledTimes(1);
    expect(fechado).toHaveBeenCalledTimes(1);
  });

  it('mantém o modal aberto e mostra o erro quando a gravação falhar', () => {
    service.atualizar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    formulario.salvar.emit(dados);
    fixture.detectChanges();

    expect(dialogo().open).toBe(true);
    expect(dialogo().textContent).toContain('Não foi possível salvar as alterações.');
    expect(atualizado).not.toHaveBeenCalled();
  });

  it('informa quando o produto não existe mais', () => {
    service.atualizar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    formulario.salvar.emit(dados);
    fixture.detectChanges();

    expect(dialogo().textContent).toContain('Produto não encontrado.');
  });

  it('fecha sem gravar ao cancelar', () => {
    botao('Cancelar').click();

    expect(dialogo().open).toBe(false);
    expect(fechado).toHaveBeenCalledTimes(1);
    expect(service.atualizar).not.toHaveBeenCalled();
  });
});
