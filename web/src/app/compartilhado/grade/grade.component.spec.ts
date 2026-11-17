import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { ChangeDetectionStrategy, Component, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GradeComponent } from './grade.component';
import { CelulaGradeDirective } from './celula-grade.directive';
import { ColunaGrade, OpcaoGrade } from './coluna-grade';

registerLocaleData(pt);

interface Item {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  observacao: string;
}

const excluir = vi.fn<(item: Item) => void>();

@Component({
  imports: [GradeComponent, CelulaGradeDirective],
  template: `
    <app-grade
      identificador="teste"
      [colunas]="colunas"
      [linhas]="linhas"
      [opcoes]="opcoes"
      [rotuloLinha]="nome"
      [linhaEmAlerta]="semPreco"
    >
      <ng-template appCelula="nome" let-item>
        <strong>{{ item.nome }}</strong>
      </ng-template>
    </app-grade>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HospedeiroComponent {
  readonly colunas: ColunaGrade<Item>[] = [
    { campo: 'nome', titulo: 'Nome' },
    { campo: 'codigo', titulo: 'Código', tipo: 'codigo' },
    { campo: 'preco', titulo: 'Preço', tipo: 'preco' },
    { campo: 'observacao', titulo: 'Observação' },
  ];
  readonly linhas: Item[] = [
    { id: 1, nome: 'Vela', codigo: 'V-1', preco: 35.5, observacao: '' },
    { id: 2, nome: 'Cabo', codigo: 'C-2', preco: 0, observacao: 'Sem preço' },
  ];
  readonly opcoes: OpcaoGrade<Item>[] = [
    { rotulo: 'Excluir', perigo: true, acao: excluir, habilitada: (item) => item.preco > 0 },
  ];
  readonly nome = (item: Item) => item.nome;
  readonly semPreco = (item: Item) => item.preco === 0;
}

describe('Grade genérica', () => {
  let fixture: ComponentFixture<HospedeiroComponent>;

  beforeEach(() => {
    excluir.mockClear();
    // jsdom nao implementa hidePopover
    HTMLElement.prototype.hidePopover = function () {};
    TestBed.configureTestingModule({
      imports: [HospedeiroComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    fixture = TestBed.createComponent(HospedeiroComponent);
    fixture.detectChanges();
  });

  function linhas(): HTMLTableRowElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'));
  }

  function celulas(linha: HTMLTableRowElement): string[] {
    return Array.from(linha.querySelectorAll('td'))
      .slice(1)
      .map((celula) => celula.textContent!.trim());
  }

  it('mostra os títulos na ordem das colunas, depois da coluna de opções', () => {
    const titulos = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('thead th'),
    ).map((titulo) => titulo.textContent!.trim());

    expect(titulos).toEqual(['Opções', 'Nome', 'Código', 'Preço', 'Observação']);
  });

  it('formata os valores pelo tipo e mostra traço no valor vazio', () => {
    expect(celulas(linhas()[0])).toEqual(['Vela', 'V-1', 'R$\u00a035,50', '—']);
    expect(linhas()[0].querySelectorAll('td')[2].classList).toContain('sku');
    expect(linhas()[0].querySelectorAll('td')[3].classList).toContain('numero');
  });

  it('usa o template do componente pai quando há um para a coluna', () => {
    expect(linhas()[0].querySelector('strong')?.textContent).toBe('Vela');
  });

  it('mostra o botão de opções em toda linha e desabilita a opção indisponível', () => {
    const botao = linhas()[0].querySelector<HTMLButtonElement>('.botao-opcoes');
    const opcao = (linha: HTMLTableRowElement) =>
      linha.querySelector<HTMLButtonElement>('.menu-opcoes button')!;

    expect(botao?.getAttribute('aria-label')).toBe('Opções de Vela');
    expect(linhas()[1].querySelector('.botao-opcoes')).not.toBeNull();
    expect(opcao(linhas()[0]).disabled).toBe(false);
    expect(opcao(linhas()[1]).disabled).toBe(true);
  });

  it('executa a ação da opção com a linha clicada', () => {
    linhas()[0].querySelector<HTMLButtonElement>('.menu-opcoes button')!.click();

    expect(excluir).toHaveBeenCalledWith(fixture.componentInstance.linhas[0]);
  });

  it('destaca a linha em alerta', () => {
    expect(linhas()[0].classList).not.toContain('alerta');
    expect(linhas()[1].classList).toContain('alerta');
  });
});
