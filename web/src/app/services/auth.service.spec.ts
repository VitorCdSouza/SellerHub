import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('Sessão no AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function autenticar(id = 2) {
    auth.consultarSessao().subscribe();
    http.expectOne('/api/sessao').flush({ id, email: `conta${id}@exemplo.com` });
  }

  it('compartilha a consulta simultânea e só autentica após a resposta', () => {
    auth.garantirSessao().subscribe();
    auth.garantirSessao().subscribe();
    expect(auth.estado()).toBe('consultando');
    expect(auth.usuario()).toBeNull();
    http.expectOne('/api/sessao').flush({ id: 2, email: 'conta@exemplo.com' });
    expect(auth.estado()).toBe('autenticada');
    expect(auth.usuario()?.id).toBe(2);
  });

  it('distingue ausência de sessão de indisponibilidade e permite nova consulta', () => {
    auth.consultarSessao().subscribe();
    http.expectOne('/api/sessao').flush({}, { status: 500, statusText: 'Server Error' });
    expect(auth.estado()).toBe('indisponivel');
    auth.consultarSessao().subscribe();
    http.expectOne('/api/sessao').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.estado()).toBe('anonima');
  });

  it('preserva usuário se logout falhar e limpa depois de saída confirmada', () => {
    autenticar();
    auth.sair().subscribe({ error: () => undefined });
    http.expectOne('/api/logout').flush({}, { status: 500, statusText: 'Server Error' });
    expect(auth.usuario()?.id).toBe(2);
    auth.sair().subscribe();
    http.expectOne('/api/logout').flush({ success: true, message: 'Sessão encerrada' });
    expect(auth.usuario()).toBeNull();
    expect(auth.estado()).toBe('anonima');
  });

  it('não restaura usuário a partir de consulta que terminou após logout', () => {
    auth.consultarSessao().subscribe();
    const consulta = http.expectOne('/api/sessao');
    auth.sair().subscribe();
    http.expectOne('/api/logout').flush({ success: true, message: 'Sessão encerrada' });
    consulta.flush({ id: 2, email: 'conta@exemplo.com' });
    expect(auth.usuario()).toBeNull();
    expect(auth.estado()).toBe('anonima');
  });

  it('não reaproveita uma consulta da conta anterior ao iniciar novo login', () => {
    auth.consultarSessao().subscribe();
    const antiga = http.expectOne('/api/sessao');
    auth.entrar('outra@exemplo.com', 'senha').subscribe();
    http.expectOne('/api/login').flush({ success: true, message: 'Login realizado' });
    auth.consultarSessao().subscribe();
    const nova = http.expectOne('/api/sessao');
    antiga.flush({ id: 1, email: 'antiga@exemplo.com' });
    expect(auth.usuario()).toBeNull();
    nova.flush({ id: 2, email: 'outra@exemplo.com' });
    expect(auth.usuario()?.email).toBe('outra@exemplo.com');
  });

  it('não considera autenticada uma resposta de sessão sem identificador válido', () => {
    auth.consultarSessao().subscribe();
    http.expectOne('/api/sessao').flush({ email: 'conta@exemplo.com' });
    expect(auth.estado()).toBe('indisponivel');
    expect(auth.usuario()).toBeNull();
  });
});
