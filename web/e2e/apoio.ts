import { expect, test as base, type Locator, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

export const conta = { email: 'caio@sellerhub.com', password: '123456' };

export const test = base.extend<{ produtoId: number }>({
  produtoId: async ({ page }, use) => {
    const request = page.request;
    const login = await request.post('/api/login', { data: conta });
    expect(login.status()).toBe(200);
    const resposta = await request.get('/api/produtos?pagina=1&limite=1');
    expect(resposta.status()).toBe(200);
    const dados: { items: { id: number }[] } = await resposta.json();
    expect(
      dados.items.length,
      'Prepare ao menos um produto da conta fictícia no banco local.',
    ).toBeGreaterThan(0);
    await use(dados.items[0].id);
  },
});

export { expect };

export async function entrar(page: Page, email = conta.email) {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(conta.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('app-estrutura main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

export function gradeVisivel(page: Page): Locator {
  return page.locator('app-grade table:visible, app-grade .lista-registros:visible');
}

export function registrosVisiveis(page: Page): Locator {
  return page.locator('app-grade table:visible tbody > tr, app-grade .lista-registros:visible > li');
}

export async function abrirConta(page: Page): Promise<void> {
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
}

export async function abrirEdicao(page: Page, linha: Locator = registrosVisiveis(page).first()) {
  await linha.getByRole('button', { name: /^Opções de / }).click();
  await linha.getByRole('button', { name: 'Editar', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Editar produto' });
  await expect(modal).toBeVisible();
  return modal;
}

export async function capturar(page: Page, info: TestInfo, nome: string) {
  const arquivo = info.outputPath(`${nome}.png`);
  await page.screenshot({ path: arquivo, fullPage: true });
  await info.attach(nome, { path: arquivo, contentType: 'image/png' });
}

export async function auditar(page: Page, info: TestInfo, nome = 'pagina') {
  await capturar(page, info, nome);
  // Sem exclusões: inclui WCAG e recomendações de landmarks do axe.
  const resultado = await new AxeBuilder({ page }).analyze();
  const arquivo = info.outputPath(nome === 'pagina' ? 'axe.json' : `${nome}-axe.json`);
  await writeFile(
    arquivo,
    JSON.stringify({ violations: resultado.violations, incomplete: resultado.incomplete }, null, 2),
  );
  await info.attach(`${nome}-axe`, { path: arquivo, contentType: 'application/json' });
  expect(
    resultado.violations.map(({ id, nodes }) => ({ id, elementos: nodes.map((n) => n.target) })),
  ).toEqual([]);
}
