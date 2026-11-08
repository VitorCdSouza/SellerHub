import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: '[appFocoPagina]', host: { tabindex: '-1' } })
export class FocoPaginaDirective {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => this.elemento.nativeElement.focus());
  }
}
