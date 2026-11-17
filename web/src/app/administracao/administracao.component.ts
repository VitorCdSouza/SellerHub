import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { EMPTY, Subject, catchError, finalize, startWith, switchMap } from 'rxjs';
import { FocoPaginaDirective } from '../compartilhado/foco-pagina.directive';
import { FormularioComponent } from '../compartilhado/formulario/formulario.component';
import {
  CampoFormulario,
  ValoresFormulario,
} from '../compartilhado/formulario/campo-formulario';
import { AuthService } from '../services/auth.service';
import { AdministracaoService, Canal, DadosConta } from './administracao.service';
import { AlterarSenhaComponent } from './alterar-senha/alterar-senha.component';

@Component({
  selector: 'app-administracao',
  imports: [AlterarSenhaComponent, DecimalPipe, FocoPaginaDirective, FormularioComponent],
  templateUrl: './administracao.component.html',
  styleUrl: './administracao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministracaoComponent {
  private readonly service = inject(AdministracaoService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly solicitacaoCanais = new Subject<void>();

  protected readonly salvando = signal(false);
  protected readonly erroConta = signal('');
  protected readonly aviso = signal('');
  protected readonly senhaAberta = signal(false);

  protected readonly canais = signal<Canal[]>([]);
  protected readonly carregandoCanais = signal(false);
  protected readonly erroCanais = signal('');

  // a rota so abre com sessao autenticada, entao o usuario ja esta carregado
  protected readonly campos: CampoFormulario[] = [
    {
      nome: 'nome',
      rotulo: 'Nome',
      tipo: 'texto',
      valorInicial: this.auth.usuario()?.nome,
      obrigatorio: true,
      maximo: 255,
      largura: 'metade',
    },
    {
      nome: 'email',
      rotulo: 'E-mail',
      tipo: 'texto',
      valorInicial: this.auth.usuario()?.email,
      obrigatorio: true,
      maximo: 255,
      padrao: { regex: /^[^\s@]+@[^\s@]+$/, mensagem: 'Informe um e-mail válido.' },
      ajuda: 'Também é o e-mail de acesso ao SellerHub.',
      largura: 'metade',
    },
  ];

  constructor() {
    this.solicitacaoCanais
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.carregandoCanais.set(true);
          this.erroCanais.set('');

          return this.service.listarCanais().pipe(
            catchError(() => {
              this.erroCanais.set('Não foi possível carregar os canais.');
              return EMPTY;
            }),
            finalize(() => this.carregandoCanais.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((canais) => this.canais.set(canais));
  }

  protected recarregarCanais(): void {
    this.solicitacaoCanais.next();
  }

  protected salvarConta(valores: ValoresFormulario): void {
    if (this.salvando()) {
      return;
    }

    this.salvando.set(true);
    this.erroConta.set('');
    this.aviso.set('');

    this.service
      .atualizarConta(valores as unknown as DadosConta)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.salvando.set(false)),
      )
      .subscribe({
        next: () => {
          this.aviso.set('Dados da conta salvos.');
          // atualiza nome e e-mail exibidos no menu lateral
          this.auth.consultarSessao().subscribe();
        },
        error: (erro: unknown) => {
          if (erro instanceof HttpErrorResponse && erro.status === 409) {
            this.erroConta.set('Este e-mail já é usado por outra conta.');
          } else if (erro instanceof HttpErrorResponse && erro.status === 400) {
            this.erroConta.set('Os dados informados são inválidos. Confira os campos.');
          } else {
            this.erroConta.set('Não foi possível salvar as alterações. Tente novamente.');
          }
        },
      });
  }

  protected senhaAlterada(): void {
    this.aviso.set('Senha alterada.');
  }
}
