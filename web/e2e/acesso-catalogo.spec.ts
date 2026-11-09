import { test, expect, conta, entrar, capturar } from './apoio';

test('login inválido, entrada por teclado, recarga e saída reais', async ({ page }, info) => {
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill(conta.email);
  await page.getByLabel('Senha', { exact: true }).fill('incorreta');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Credenciais inválidas');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Senha', { exact: true })).toBeFocused();
  await page.keyboard.type(conta.password);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.reload();
  await expect(page.getByText(conta.email, { exact: true })).toBeVisible();
  await capturar(page, info, 'inicio-autenticado');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await page.goto('/produtos');
  await expect(page).toHaveURL(/\/?retorno=%2Fprodutos/);
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('acesso anônimo preserva a URL após o login', async ({ page }) => {
  await page.goto('/produtos/novo');
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await expect(page.getByLabel('Nome do produto')).toHaveCount(0);
  await entrar(page);
  await expect(page).toHaveURL('/produtos/novo');
  await expect(page.getByLabel('Nome do produto')).toBeVisible();
});

test('navega pelo catálogo real e cancela sem gravar', async ({ page, produtoId }) => {
  await page.goto('/inicio');
  await page.getByRole('link', { name: 'Ver produtos', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Novo produto', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cadastrar produto', exact: true })).toBeDisabled();
  await page.getByLabel('Nome do produto').fill('Rascunho local não salvo');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL('/produtos');
  await page.goto(`/produtos/${produtoId}`);
  await expect(page.getByRole('link', { name: 'Editar produto', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Editar produto', exact: true }).click();
  await expect(page.getByLabel('Nome do produto')).not.toHaveValue('');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL(`/produtos/${produtoId}`);
});

test('produto de outra conta recebe 404 real no detalhe e na edição', async ({
  page,
  produtoId,
}) => {
  const resposta = await page.request.post('/api/login', {
    data: { ...conta, email: 'samuel@sellerhub.com' },
  });
  expect(resposta.status()).toBe(200);
  for (const caminho of [`/produtos/${produtoId}`, `/produtos/${produtoId}/editar`]) {
    const leitura = page.waitForResponse(
      (r) => new URL(r.url()).pathname === `/api/produtos/${produtoId}`,
    );
    await page.goto(caminho);
    expect((await leitura).status()).toBe(404);
    await expect(page.getByText('Produto não encontrado.', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Nome do produto')).toHaveCount(0);
    await expect(page.getByText('samuel@sellerhub.com', { exact: true })).toBeVisible();
  }
});

test('perda do cookie durante uso exige login e recupera o destino', async ({
  page,
  context,
  produtoId,
}) => {
  await page.goto('/inicio');
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
  await context.clearCookies();
  await page.getByRole('link', { name: 'Ver produtos', exact: true }).click();
  await expect(page).toHaveURL(/motivo=expirada/);
  await expect(page.getByRole('table')).toHaveCount(0);
  await entrar(page);
  await expect(page).toHaveURL('/produtos');
  await expect(page.getByRole('link', { name: 'Ver detalhes' }).first()).toBeVisible();
  expect(produtoId).toBeGreaterThan(0);
});

test('falha controlada de rede na sessão permite recuperação', async ({ page, produtoId }) => {
  await page.route('**/api/sessao', (route) => route.abort('connectionrefused'));
  await page.goto(`/produtos/${produtoId}`);
  await expect(
    page.getByRole('heading', { name: 'Não foi possível verificar seu acesso' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Editar produto', exact: true })).toHaveCount(0);
  await page.unroute('**/api/sessao');
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page).toHaveURL(`/produtos/${produtoId}`);
  await expect(page.getByRole('link', { name: 'Editar produto', exact: true })).toBeVisible();
});

test('500 controlado na lista permite tentar novamente na API real', async ({
  page,
  produtoId,
}) => {
  await page.route('**/api/produtos?*', (route) =>
    route.fulfill({
      status: 500,
      json: { success: false, message: 'Falha controlada do E2E' },
    }),
  );
  await page.goto('/produtos');
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível' })).toBeVisible();
  await page.unroute('**/api/produtos?*');
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  expect(produtoId).toBeGreaterThan(0);
});

test('500 controlado no PUT preserva os valores digitados sem alterar o banco', async ({
  page,
  produtoId,
}, info) => {
  let envios = 0;
  await page.route(`**/api/produtos/${produtoId}`, async (route) => {
    if (route.request().method() !== 'PUT') return route.continue();
    envios++;
    await route.fulfill({
      status: 500,
      json: { success: false, message: 'Falha controlada do E2E' },
    });
  });
  await page.goto(`/produtos/${produtoId}/editar`);
  await expect(page.getByLabel('Nome do produto')).not.toHaveValue('');
  await page.getByLabel('Nome do produto').fill('Edição local preservada');
  await page.getByLabel('Preço base (R$)').fill('42,01');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível salvar' }),
  ).toBeVisible();
  await expect(page.getByLabel('Nome do produto')).toHaveValue('Edição local preservada');
  await expect(page.getByLabel('Preço base (R$)')).toHaveValue('42,01');
  expect(envios).toBe(1);
  await capturar(page, info, 'falha-gravacao-controlada');
});
