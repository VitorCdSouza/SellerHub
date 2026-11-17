import { test, expect, conta, entrar, capturar, abrirEdicao } from './apoio';

test('login inválido, entrada por teclado, recarga e saída reais', async ({ page }, info) => {
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill(conta.email);
  await page.getByLabel('Senha', { exact: true }).fill('incorreta');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Credenciais inválidas');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Senha', { exact: true })).toBeFocused();
  await page.keyboard.type(conta.password);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/produtos');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.reload();
  await expect(page.getByText(conta.email, { exact: true })).toBeVisible();
  await capturar(page, info, 'produtos-autenticado');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await page.goto('/produtos');
  await expect(page).toHaveURL(/\/?retorno=%2Fprodutos/);
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('acesso anônimo preserva a URL após o login', async ({ page }) => {
  await page.goto('/produtos?origem=teste');
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await entrar(page);
  await expect(page).toHaveURL('/produtos?origem=teste');
  await expect(page.getByRole('heading', { name: 'Produtos', level: 1 })).toBeVisible();
});

test('navega pelo catálogo real e cancela sem gravar', async ({ page, produtoId }) => {
  expect(produtoId).toBeGreaterThan(0);
  await page.goto('/produtos');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Novo produto' });
  await expect(modal).toBeVisible();
  const campoNome = modal.getByRole('textbox', { name: 'Nome', exact: true });
  await expect(campoNome).toBeFocused();
  await modal.getByRole('button', { name: 'Salvar produto', exact: true }).click();
  await expect(campoNome).toHaveAccessibleDescription('Preencha este campo.');
  await expect(campoNome).toHaveAttribute('aria-invalid', 'true');
  await expect(campoNome).toBeFocused();
  await expect(page).toHaveURL('/produtos');
  await campoNome.fill('Rascunho local não salvo');
  await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Novo produto', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  const edicao = await abrirEdicao(page);
  await expect(edicao.getByRole('textbox', { name: 'Nome', exact: true })).not.toHaveValue('');
  await edicao.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(edicao).toHaveCount(0);
  await expect(page).toHaveURL('/produtos');
});

test('perda do cookie durante uso exige login e recupera o destino', async ({
  page,
  context,
  produtoId,
}) => {
  await page.goto('/produtos');
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
  const edicao = await abrirEdicao(page);
  await context.clearCookies();
  await edicao.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page).toHaveURL(/motivo=expirada/);
  await expect(page.getByRole('table')).toHaveCount(0);
  await entrar(page);
  await expect(page).toHaveURL('/produtos');
  await expect(page.getByRole('row').nth(1)).toBeVisible();
  expect(produtoId).toBeGreaterThan(0);
});

test('falha controlada de rede na sessão permite recuperação', async ({ page, produtoId }) => {
  await page.route('**/api/sessao', (route) => route.abort('connectionrefused'));
  await page.goto('/produtos');
  await expect(
    page.getByRole('heading', { name: 'Não foi possível verificar seu acesso' }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.unroute('**/api/sessao');
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page).toHaveURL('/produtos');
  await expect(page.getByRole('table')).toBeVisible();
  expect(produtoId).toBeGreaterThan(0);
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
  await page.goto('/produtos');
  const edicao = await abrirEdicao(page);
  await expect(edicao.getByRole('textbox', { name: 'Nome', exact: true })).not.toHaveValue('');
  await edicao.getByRole('textbox', { name: 'Nome', exact: true }).fill('Edição local preservada');
  await edicao.getByRole('textbox', { name: 'Preço base (R$)', exact: true }).fill('42,01');
  await edicao.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(
    edicao.getByRole('alert').filter({ hasText: 'Não foi possível salvar' }),
  ).toBeVisible();
  await expect(edicao.getByRole('textbox', { name: 'Nome', exact: true })).toHaveValue('Edição local preservada');
  await expect(edicao.getByRole('textbox', { name: 'Preço base (R$)', exact: true })).toHaveValue('42,01');
  expect(envios).toBe(1);
  await capturar(page, info, 'falha-gravacao-controlada');
});
