import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EditarProdutoComponent } from './editar-produto.component';
import { ProdutosService } from '../produtos.service';
import { ProdutoFormularioComponent } from '../produto-formulario/produto-formulario.component';

describe('Tela de edição de produto', () => {
  let fixture: ComponentFixture<EditarProdutoComponent>;
  let parametros: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  let service: {
    consultar: ReturnType<typeof vi.fn>;
    atualizar: ReturnType<typeof vi.fn>;
  };

  const produto = {
    id: 5,
    nome: 'Teclado mecânico',
    sku: 'TEC-005',
    precoBase: 250,
  };

  beforeEach(async () => {
    parametros = new BehaviorSubject(convertToParamMap({ id: '5' }));
    service = {
      consultar: vi.fn().mockReturnValue(of(produto)),
      atualizar: vi.fn().mockReturnValue(of({ success: true, message: 'Produto atualizado.' })),
    };

    await TestBed.configureTestingModule({
      imports: [EditarProdutoComponent],
      providers: [
        provideRouter([{ path: 'produtos/:id', component: EditarProdutoComponent }]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: parametros.asObservable(),
          },
        },
        {
          provide: ProdutosService,
          useValue: service,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarProdutoComponent);
    fixture.detectChanges();
  });

  it('deve consultar o produto pelo ID e preencher o formulário', () => {
    expect(service.consultar).toHaveBeenCalledWith(5);

    const formulario = fixture.debugElement.query(
      (elemento) => elemento.componentInstance instanceof ProdutoFormularioComponent,
    );

    expect(formulario).toBeTruthy();

    expect(formulario.componentInstance.dadosIniciais()).toEqual({
      nome: produto.nome,
      sku: produto.sku,
      precoBase: produto.precoBase,
    });
  });

  it('deve enviar as alterações pelo PUT', () => {
    const dadosAtualizados = {
      nome: 'Teclado atualizado',
      sku: 'TEC-005',
      precoBase: 280,
    };

    fixture.componentInstance['salvar'](dadosAtualizados);

    expect(service.atualizar).toHaveBeenCalledWith(5, dadosAtualizados);
  });

  it('não deve enviar alterações quando o usuário cancela', () => {
    fixture.componentInstance['cancelar']();

    expect(service.atualizar).not.toHaveBeenCalled();
  });

  it('deve exibir erro quando o produto não for encontrado', async () => {
    service.consultar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    fixture = TestBed.createComponent(EditarProdutoComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Produto não encontrado.');
  });

  it('deve preservar os dados quando a gravação falhar', () => {
    service.atualizar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const dadosAtualizados = {
      nome: 'Teclado atualizado',
      sku: 'TEC-005',
      precoBase: 280,
    };

    fixture.componentInstance['salvar'](dadosAtualizados);
    fixture.detectChanges();

    expect(fixture.componentInstance['dadosIniciais']()).toEqual({
      nome: produto.nome,
      sku: produto.sku,
      precoBase: produto.precoBase,
    });

    expect(fixture.componentInstance['erroEnvio']()).toContain(
      'Não foi possível salvar as alterações.',
    );
  });

  it('oferece nova tentativa de leitura após erro transitório na edição', () => {
    service.consultar
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })))
      .mockReturnValue(of(produto));
    fixture = TestBed.createComponent(EditarProdutoComponent);
    fixture.detectChanges();
    const botoes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );
    const tentar = botoes.find((botao) => botao.textContent?.trim() === 'Tentar novamente');
    expect(
      tentar,
      'A falha de leitura precisa permitir repetir o GET sem sair da edição.',
    ).toBeDefined();
    tentar!.click();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#nome')?.value,
    ).toBe(produto.nome);
  });

  it('anuncia o erro de carregamento da edição em região de alerta', () => {
    service.consultar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    fixture = TestBed.createComponent(EditarProdutoComponent);
    fixture.detectChanges();
    const alerta = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(
      alerta,
      'O erro de leitura precisa ser anunciado em uma região de alerta.',
    ).not.toBeNull();
    expect(alerta?.textContent ?? '').toContain('Não foi possível carregar o produto');
  });

  it('não navega para o produto anterior quando o PUT termina após troca de ID', () => {
    const gravacao = new Subject<{ success: boolean; message: string }>();
    service.atualizar.mockReturnValue(gravacao);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance['salvar']({
      nome: 'Nome atualizado',
      sku: produto.sku,
      precoBase: 280,
    });
    service.consultar.mockReturnValue(
      of({ ...produto, id: 6, nome: 'Outro produto', sku: 'OUTRO-6' }),
    );
    parametros.next(convertToParamMap({ id: '6' }));
    gravacao.next({ success: true, message: 'Atualizado.' });
    gravacao.complete();
    expect(navegar).not.toHaveBeenCalled();
    expect(fixture.componentInstance['dadosIniciais']()?.nome).toBe('Outro produto');
  });

  it('não repete PUT enquanto a confirmação da gravação está pendente', () => {
    const gravacao = new Subject<{ success: boolean; message: string }>();
    service.atualizar.mockReturnValue(gravacao);
    const dados = { nome: 'Nome atualizado', sku: produto.sku, precoBase: 280 };
    fixture.componentInstance['salvar'](dados);
    fixture.componentInstance['salvar'](dados);
    expect(service.atualizar).toHaveBeenCalledTimes(1);
    gravacao.complete();
  });
});
