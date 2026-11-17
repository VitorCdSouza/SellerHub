import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AdministracaoComponent } from './administracao.component';

registerLocaleData(pt);

describe('Administração', () => {
  let fixture: ComponentFixture<AdministracaoComponent>;
  let http: HttpTestingController;
  let consultasSessao: number;
  const canais = [
    { id: 3, name: 'Amazon', commission: 11, listings: 0 },
    { id: 1, name: 'Mercado Livre', commission: 16.5, listings: 2 },
  ];

  beforeEach(() => {
    // jsdom nao implementa showModal nem close
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };

    consultasSessao = 0;
    TestBed.configureTestingModule({
      imports: [AdministracaoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        {
          provide: AuthService,
          useValue: {
            usuario: signal({ id: 3, email: 'vitor@sellerhub.com', nome: 'Vitor Souza' }),
            consultarSessao: () => {
              consultasSessao++;
              return of('autenticada');
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdministracaoComponent);
    fixture.detectChanges();
    http.expectOne('/api/marketplaces').flush(canais);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function pagina(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function campo(id: string): HTMLInputElement {
    return pagina().querySelector<HTMLInputElement>(`#${id}`)!;
  }

  function digitar(id: string, valor: string): void {
    campo(id).value = valor;
    campo(id).dispatchEvent(new Event('input'));
  }

  function enviar(formulario: string): void {
    pagina().querySelector<HTMLButtonElement>(`button[form="${formulario}"]`)!.click();
    fixture.detectChanges();
  }

  it('preenche a conta com a sessão e lista os canais', () => {
    expect(campo('formulario-conta-nome').value).toBe('Vitor Souza');
    expect(campo('formulario-conta-email').value).toBe('vitor@sellerhub.com');

    const linhas = pagina().querySelectorAll('.canais li');
    expect(linhas[0].textContent).toContain('0 anúncios');
    expect(linhas[1].textContent).toContain('2 anúncios');
    expect(linhas[1].textContent).toContain('Comissão 16,5%');
  });

  it('salva nome e e-mail e atualiza a sessão', () => {
    digitar('formulario-conta-nome', '  Vitor Cordeiro ');
    enviar('formulario-conta');

    const envio = http.expectOne({ method: 'PUT', url: '/api/conta' });
    expect(envio.request.body).toEqual({ name: 'Vitor Cordeiro', email: 'vitor@sellerhub.com' });
    envio.flush({ success: true, message: 'Conta atualizada' });
    fixture.detectChanges();

    expect(pagina().querySelector('[role="status"]')?.textContent).toContain(
      'Dados da conta salvos.',
    );
    expect(consultasSessao).toBe(1);
  });

  it('avisa quando o e-mail já pertence a outra conta', () => {
    digitar('formulario-conta-email', 'samuel@sellerhub.com');
    enviar('formulario-conta');

    http
      .expectOne({ method: 'PUT', url: '/api/conta' })
      .flush({ success: false }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(pagina().textContent).toContain('Este e-mail já é usado por outra conta.');
  });

  it('altera a senha só quando a confirmação confere', () => {
    Array.from(pagina().querySelectorAll('button'))
      .find((botao) => botao.textContent?.trim() === 'Alterar senha')!
      .click();
    fixture.detectChanges();

    expect(campo('formulario-senha-senhaAtual').type).toBe('password');
    digitar('formulario-senha-senhaAtual', '123456');
    digitar('formulario-senha-novaSenha', 'nova senha 1');
    digitar('formulario-senha-confirmacao', 'outra senha');
    enviar('formulario-senha');
    expect(pagina().textContent).toContain('A confirmação não confere com a nova senha.');

    digitar('formulario-senha-confirmacao', 'nova senha 1');
    enviar('formulario-senha');
    const envio = http.expectOne({ method: 'PUT', url: '/api/conta/senha' });
    expect(envio.request.body).toEqual({
      currentPassword: '123456',
      newPassword: 'nova senha 1',
    });
    envio.flush({ success: true, message: 'Senha alterada' });
    fixture.detectChanges();

    expect(pagina().querySelector('dialog')).toBeNull();
    expect(pagina().querySelector('[role="status"]')?.textContent).toContain('Senha alterada.');
  });
});
