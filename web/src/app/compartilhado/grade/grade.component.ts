import { formatCurrency, formatDate, formatNumber, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  contentChildren,
  inject,
  input,
} from '@angular/core';
import { CelulaGradeDirective } from './celula-grade.directive';
import { ColunaGrade, OpcaoGrade } from './coluna-grade';

@Component({
  selector: 'app-grade',
  imports: [NgTemplateOutlet],
  templateUrl: './grade.component.html',
  styleUrl: './grade.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeComponent<T> {
  private readonly locale = inject(LOCALE_ID);

  // prefixo dos ids dos menus de opcoes
  readonly identificador = input.required<string>();
  readonly colunas = input.required<ColunaGrade<T>[]>();
  readonly linhas = input.required<T[]>();
  readonly opcoes = input.required<OpcaoGrade<T>[]>();
  // nome da linha lido pelo leitor de tela no botao de opcoes
  readonly rotuloLinha = input.required<(linha: T) => string>();
  readonly linhaEmAlerta = input<(linha: T) => boolean>(() => false);

  private readonly celulas = contentChildren(CelulaGradeDirective);

  protected template(coluna: ColunaGrade<T>) {
    return this.celulas().find((celula) => celula.campo() === coluna.campo)?.template ?? null;
  }

  protected numerica(coluna: ColunaGrade<T>): boolean {
    return coluna.tipo === 'preco' || coluna.tipo === 'inteiro';
  }

  protected formatar(linha: T, coluna: ColunaGrade<T>): string {
    const valor = linha[coluna.campo];

    if (valor === null || valor === undefined || valor === '') return '—';

    switch (coluna.tipo) {
      case 'preco':
        return formatCurrency(Number(valor), this.locale, 'R$', 'BRL', '1.2-2');
      case 'inteiro':
        return formatNumber(Number(valor), this.locale, '1.0-0');
      case 'data':
        return formatDate(String(valor), 'dd/MM/yyyy HH:mm', this.locale);
    }
    return String(valor);
  }

  protected habilitada(opcao: OpcaoGrade<T>, linha: T): boolean {
    return opcao.habilitada?.(linha) ?? true;
  }

  protected executar(opcao: OpcaoGrade<T>, linha: T, evento: Event): void {
    (evento.target as HTMLElement).closest<HTMLElement>('[popover]')?.hidePopover();
    opcao.acao(linha);
  }

  // o popover fica na top layer, fora do overflow da tabela; a posicao vem do botao
  protected posicionarMenu(evento: Event, botao: HTMLElement): void {
    if ((evento as ToggleEvent).newState !== 'open') {
      return;
    }
    const menu = evento.target as HTMLElement;
    const area = botao.getBoundingClientRect();
    menu.style.top = `${area.bottom + window.scrollY + 4}px`;
    menu.style.left = `${area.left + window.scrollX}px`;
  }
}
