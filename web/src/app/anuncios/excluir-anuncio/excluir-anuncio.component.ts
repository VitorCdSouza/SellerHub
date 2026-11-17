import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Anuncio } from '../anuncio.model';
import { AnunciosService } from '../anuncios.service';

@Component({
  selector: 'app-excluir-anuncio',
  templateUrl: './excluir-anuncio.component.html',
  styleUrl: './excluir-anuncio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcluirAnuncioComponent {
  private readonly service = inject(AnunciosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly anuncio = input.required<Anuncio>();
  readonly excluido = output();
  readonly fechado = output();

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }

  protected excluir(): void {
    if (this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.erro.set('');

    this.service
      .excluir(this.anuncio().id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: () => {
          this.excluido.emit();
          this.fechar();
        },
        error: (erro: unknown) => {
          if (erro instanceof HttpErrorResponse && erro.status === 409) {
            this.erro.set(erro.error?.message ?? 'Este anúncio não pode ser excluído.');
          } else if (erro instanceof HttpErrorResponse && erro.status === 404) {
            this.erro.set('Anúncio não encontrado. Ele pode já ter sido excluído.');
          } else if (erro instanceof HttpErrorResponse && erro.status === 401) {
            this.erro.set('Sua sessão expirou. Faça login novamente.');
          } else {
            this.erro.set('Não foi possível excluir o anúncio. Tente novamente.');
          }
        },
      });
  }

  protected fechar(): void {
    this.dialogo().nativeElement.close();
  }

  // esc dispara cancel; durante o envio o modal fica aberto ate a resposta
  protected impedirFechamentoDuranteEnvio(evento: Event): void {
    if (this.enviando()) {
      evento.preventDefault();
    }
  }
}
