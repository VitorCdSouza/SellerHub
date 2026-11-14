import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { AuthService } from '../services/auth.service';
import { sessaoInterceptor } from './sessao.interceptor';

describe('Navegação da estrutura e recuperação de acesso', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;
  let auth: AuthService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([sessaoInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => http.verify());

  async function iniciarNavegacao() {
    const navegacao = harness.navigateByUrl('/produtos/novo?origem=teste');
    await vi.waitFor(() => expect(auth.estado()).toBe('consultando'));
    return { navegacao };
  }

  async function autenticar() {
    const { navegacao } = await iniciarNavegacao();
    http.expectOne('/api/sessao').flush({ id: 1, email: 'conta@exemplo.test' });
    await navegacao;
    harness.detectChanges();
  }

  it('aguarda a sessão no acesso direto e preserva caminho e parâmetros', async () => {
    const { navegacao } = await iniciarNavegacao();
    expect(harness.routeNativeElement?.querySelector('.conta') ?? null).toBeNull();
    http.expectOne('/api/sessao').flush({ id: 1, email: 'conta@exemplo.test' });
    await navegacao;
    expect(router.url).toBe('/produtos/novo?origem=teste');
    expect(harness.routeNativeElement?.textContent).toContain('conta@exemplo.test');
    expect(
      harness.routeNativeElement?.querySelector('a[aria-current="page"]')?.textContent,
    ).toContain('Produtos');
  });

  it('retorna ao login sem expor conteúdo interno quando a sessão é inválida', async () => {
    const { navegacao } = await iniciarNavegacao();
    http.expectOne('/api/sessao').flush({}, { status: 401, statusText: 'Unauthorized' });
    await navegacao;
    expect(router.parseUrl(router.url).queryParams['retorno']).toBe('/produtos/novo?origem=teste');
    expect(harness.routeNativeElement?.querySelector('form')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('.conta')).toBeNull();
  });

  it('recupera indisponibilidade sem perder o destino nem duplicar consultas', async () => {
    const { navegacao } = await iniciarNavegacao();
    http.expectOne('/api/sessao').flush({}, { status: 500, statusText: 'Server Error' });
    await navegacao;
    expect(router.url).toContain('/sessao-indisponivel');
    const botao = harness.routeNativeElement!.querySelector('button')!;
    botao.click();
    botao.click();
    harness.detectChanges();
    expect(botao.disabled).toBe(true);
    http.expectOne('/api/sessao').flush({}, { status: 500, statusText: 'Server Error' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'continua indisponível',
    );
    botao.click();
    http.expectOne('/api/sessao').flush({ id: 1, email: 'conta@exemplo.test' });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/produtos/novo?origem=teste');
  });

  it('mantém a conta em falha de saída e só sai após confirmação, sem duplicar o envio', async () => {
    await autenticar();
    const botao = harness.routeNativeElement!.querySelector<HTMLButtonElement>('.botao-saida')!;
    botao.click();
    botao.click();
    http.expectOne('/api/logout').flush({}, { status: 500, statusText: 'Server Error' });
    harness.detectChanges();
    expect(auth.usuario()?.id).toBe(1);
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível sair',
    );
    botao.click();
    http.expectOne('/api/logout').flush({ success: true, message: 'Sessão encerrada' });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/');
    expect(auth.usuario()).toBeNull();
    await harness.navigateByUrl('/produtos/novo');
    expect(router.parseUrl(router.url).queryParams['retorno']).toBe('/produtos/novo');
    expect(harness.routeNativeElement?.querySelector('form')).not.toBeNull();
  });

  it('remove a estrutura em 401 protegido e informa expiração no login', async () => {
    await autenticar();
    TestBed.inject(HttpClient)
      .get('/api/produtos')
      .subscribe({ error: () => undefined });
    http.expectOne('/api/produtos').flush({}, { status: 401, statusText: 'Unauthorized' });
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.parseUrl(router.url).queryParams['motivo']).toBe('expirada');
    expect(harness.routeNativeElement?.textContent).toContain('Sua sessão expirou');
    expect(harness.routeNativeElement?.querySelector('.conta')).toBeNull();
  });
});
