import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';

describe('Login integrado ao AuthService', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;
  let tela: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    http = TestBed.inject(HttpTestingController);
    tela = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function preencher(id: string, valor: string) {
    const campo = tela.querySelector<HTMLInputElement>(`#${id}`)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function enviar() {
    tela.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }

  it('não envia formulário vazio', () => {
    enviar();
    http.expectNone('http://localhost:8080/login');
    expect(tela.textContent).toContain('Informe um e-mail válido.');
    expect(tela.textContent).toContain('Informe sua senha.');
  });

  it('envia o contrato esperado, impede repetição e apresenta sucesso', () => {
    preencher('email', 'teste@email.com');
    preencher('senha', '123456');
    enviar();
    expect(tela.querySelector('button')!.disabled).toBe(true);
    enviar();
    const requisicao = http.expectOne('http://localhost:8080/login');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ email: 'teste@email.com', password: '123456' });
    requisicao.flush({ success: true, message: 'Login realizado com sucesso' });
    fixture.detectChanges();
    expect(tela.querySelector('[role="status"]')!.textContent).toContain(
      'Login realizado com sucesso',
    );
    expect(tela.querySelector<HTMLInputElement>('#senha')!.value).toBe('');
    expect(tela.querySelector('button')!.disabled).toBe(false);
  });

  it('apresenta credenciais inválidas e permite tentar novamente', () => {
    preencher('email', 'teste@email.com');
    preencher('senha', 'errada');
    enviar();
    http
      .expectOne('http://localhost:8080/login')
      .flush(
        { success: false, message: 'Credenciais inválidas' },
        { status: 401, statusText: 'Unauthorized' },
      );
    fixture.detectChanges();
    expect(tela.querySelector('[role="alert"]')!.textContent).toContain('Credenciais inválidas');
    expect(tela.querySelector('button')!.disabled).toBe(false);
  });

  it('apresenta indisponibilidade da API', () => {
    preencher('email', 'teste@email.com');
    preencher('senha', '123456');
    enviar();
    http.expectOne('http://localhost:8080/login').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(tela.querySelector('[role="alert"]')!.textContent).toContain(
      'Verifique se a API está disponível',
    );
  });
});
