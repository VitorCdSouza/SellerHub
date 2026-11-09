
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EditarProdutoComponent } from './editar-produto.component';
import { ProdutosService } from '../produtos.service';
import { ProdutoFormularioComponent } from '../produto-formulario/produto-formulario.component';

describe('Tela de edição de produto', () => {
  let fixture: ComponentFixture<EditarProdutoComponent>;

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
    service = {
      consultar: vi.fn().mockReturnValue(of(produto)),
      atualizar: vi.fn().mockReturnValue(
        of({ success: true, message: 'Produto atualizado.' }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [EditarProdutoComponent],
      providers: [
        provideRouter([
         { path: 'produtos/:id', component: EditarProdutoComponent },   
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '5' })),
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
      (elemento) =>
        elemento.componentInstance instanceof ProdutoFormularioComponent,
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
    service.consultar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    fixture = TestBed.createComponent(EditarProdutoComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Produto não encontrado.',
    );
  });

  it('deve preservar os dados quando a gravação falhar', () => {
    service.atualizar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

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
});
