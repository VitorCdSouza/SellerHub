import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { sessaoInterceptor } from './sessao.interceptor';

describe('Expiração nas chamadas protegidas', () => {
  let http: HttpTestingController;
  let auth: AuthService;
  let client: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessaoInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    client = TestBed.inject(HttpClient);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    auth.consultarSessao().subscribe();
    http.expectOne('/api/sessao').flush({ id: 2, email: 'conta@exemplo.com' });
  });
  afterEach(() => http.verify());

  it('redireciona só uma vez quando duas chamadas retornam 401', () => {
    client.get('/api/produtos').subscribe({ error: () => undefined });
    client.get('/api/produtos/2').subscribe({ error: () => undefined });
    http.expectOne('/api/produtos').flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/produtos/2').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.usuario()).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledTimes(1);
  });

  it('não trata credenciais inválidas do login como expiração da área interna', () => {
    client.post('/api/login', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('não expira a conta nova por uma resposta atrasada da anterior', () => {
    client.get('/api/produtos').subscribe({ error: () => undefined });
    const antiga = http.expectOne('/api/produtos');
    auth.entrar('outra@exemplo.com', 'senha').subscribe();
    http.expectOne('/api/login').flush({ success: true, message: 'Login realizado' });
    auth.consultarSessao().subscribe();
    http.expectOne('/api/sessao').flush({ id: 3, email: 'outra@exemplo.com' });
    antiga.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.usuario()?.id).toBe(3);
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });
});
