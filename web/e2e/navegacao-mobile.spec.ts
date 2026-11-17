import { test, expect, conta, auditar, capturar } from './apoio';

test.use({ hasTouch: true });

test('menu mobile mantém conteúdo à frente e permite navegar por teclado', async ({ page, produtoId }, info) => {
  expect(produtoId).toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/produtos');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await expect(menu).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeHidden();
  const titulo = page.getByRole('heading', { name: 'Produtos', level: 1 });
  expect((await titulo.boundingBox())!.y).toBeLessThan(180);
  const primeiro = page.locator('app-grade .lista-registros:visible > li').first();
  await expect(primeiro).toBeVisible();
  expect((await primeiro.boundingBox())!.y).toBeLessThan(844);
  await menu.focus();
  await page.keyboard.press('Enter');
  const painel = page.getByRole('dialog', { name: 'Menu', exact: true });
  await expect(painel).toBeVisible();
  await expect(painel.locator(':focus')).toHaveCount(1);
  await expect(painel.getByText(conta.email, { exact: true })).toBeVisible();
  await expect(painel.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
  await expect(painel.getByRole('link', { name: 'Produtos', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(painel.getByRole('link', { name: /Vendas/ })).toHaveCount(0);
  await auditar(page, info);
  await painel.getByRole('button', { name: 'Sair', exact: true }).focus();
  await page.keyboard.press('Tab');
  await info.attach('foco-apos-ultimo-tab', {
    body: JSON.stringify(await page.evaluate(() => ({
      elemento: document.activeElement?.tagName,
      texto: document.activeElement?.textContent?.trim(),
      dentroPainel: !!document.activeElement?.closest('dialog[open]'),
    }))),
    contentType: 'application/json',
  });
  await expect(painel.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Shift+Tab');
  await expect(painel.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(painel).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await painel.getByRole('link', { name: 'Anúncios', exact: true }).click();
  await expect(page).toHaveURL('/anuncios');
  await expect(painel).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Anúncios', level: 1 })).toBeFocused();
  await capturar(page, info, 'anuncios-mobile');
});

test('menu suporta tela curta, resize e falha de saída sem perder a mensagem', async ({ page, produtoId }, info) => {
  expect(produtoId).toBeGreaterThan(0);
  await page.setViewportSize({ width: 320, height: 360 });
  await page.goto('/produtos');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.tap();
  const painel = page.getByRole('dialog', { name: 'Menu', exact: true });
  await expect(painel).toBeVisible();
  const sair = painel.getByRole('button', { name: 'Sair', exact: true });
  await sair.scrollIntoViewIfNeeded();
  await expect(sair).toBeInViewport();
  let tentativas = 0;
  let liberarSaida = () => {};
  const respostaPendente = new Promise<void>((resolve) => { liberarSaida = resolve; });
  await page.route('**/api/logout', async (route) => {
    tentativas++;
    await respostaPendente;
    await route.fulfill({ status: 500, json: { message: 'Falha controlada do E2E' } });
  });
  await sair.tap();
  await expect(painel.getByRole('button', { name: 'Saindo...', exact: true })).toBeDisabled();
  expect(tentativas).toBe(1);
  liberarSaida();
  await expect(painel).toBeVisible();
  await expect(painel.getByRole('alert')).toContainText('Não foi possível sair');
  await expect(sair).toBeEnabled();
  await sair.tap();
  await expect.poll(() => tentativas).toBe(2);
  await expect(painel.getByRole('alert')).toContainText('Não foi possível sair');
  await expect(sair).toBeEnabled();
  await auditar(page, info);
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.tap();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(painel).not.toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  await expect(menu).toBeHidden();
  await expect(page.getByRole('link', { name: 'Produtos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeHidden();
  const largura = await page.evaluate(() => ({ janela: innerWidth, documento: document.documentElement.scrollWidth }));
  expect(largura.documento).toBeLessThanOrEqual(largura.janela);
});

test('falha de saída continua visível após fechar o menu durante a requisição', async ({ page, produtoId }, info) => {
  expect(produtoId).toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/produtos');
  await page.getByRole('button', { name: 'Menu', exact: true }).tap();
  const painel = page.getByRole('dialog', { name: 'Menu', exact: true });
  let liberarSaida = () => {};
  const pendente = new Promise<void>((resolve) => { liberarSaida = resolve; });
  await page.route('**/api/logout', async (route) => {
    await pendente;
    await route.fulfill({ status: 500, json: { message: 'Falha controlada do E2E' } });
  });
  await painel.getByRole('button', { name: 'Sair', exact: true }).tap();
  await expect(painel.getByRole('button', { name: 'Saindo...', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(painel).not.toBeVisible();
  liberarSaida();
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível sair' })).toBeVisible();
  await auditar(page, info);
  await page.getByRole('button', { name: 'Menu', exact: true }).tap();
  await expect(painel.getByRole('alert')).toContainText('Não foi possível sair');
  await expect(painel.getByRole('button', { name: 'Sair', exact: true })).toBeEnabled();
});
