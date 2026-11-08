import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { destinoAposLogin } from './destino-login';
import { sessaoGuard } from './sessao.guard';

describe('Proteção de navegação', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function verificar() {
    return TestBed.runInInjectionContext(() =>
      sessaoGuard({} as ActivatedRouteSnapshot, { url: '/inicio' } as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
  }

  it('aguarda a sessão antes de liberar a rota', () => {
    let resultado: boolean | UrlTree | undefined;
    verificar().subscribe((valor) => {
      resultado = valor;
    });
    expect(resultado).toBeUndefined();
    http.expectOne('/api/sessao').flush({ id: 2, email: 'conta@exemplo.com' });
    expect(resultado).toBe(true);
  });

  it.each([
    [401, '/?retorno=%2Finicio'],
    [500, '/sessao-indisponivel?retorno=%2Finicio'],
  ])('trata status %s sem exibir a área interna', (status, destino) => {
    let resultado: boolean | UrlTree | undefined;
    verificar().subscribe((valor) => {
      resultado = valor;
    });
    http.expectOne('/api/sessao').flush({}, { status, statusText: 'Falha' });
    expect(resultado instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe(destino);
  });

  it('aceita apenas um retorno interno que não volte ao próprio login', () => {
    expect(destinoAposLogin('//outro-site.com')).toBe('/inicio');
    expect(destinoAposLogin('https://outro-site.com')).toBe('/inicio');
    expect(destinoAposLogin('/?retorno=/')).toBe('/inicio');
    expect(destinoAposLogin('/sessao-indisponivel')).toBe('/inicio');
    expect(destinoAposLogin('/produtos?pagina=2')).toBe('/produtos?pagina=2');
  });
});
