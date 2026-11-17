import { Directive, TemplateRef, inject, input } from '@angular/core';

// troca o conteudo padrao da celula da coluna com o mesmo campo
@Directive({ selector: 'ng-template[appCelula]' })
export class CelulaGradeDirective {
  readonly campo = input.required<string>({ alias: 'appCelula' });
  readonly template = inject(TemplateRef);
}
