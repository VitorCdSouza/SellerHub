import { test, expect, auditar } from './apoio';

test('AXE e captura do login', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await auditar(page, info);
});

for (const tela of ['lista', 'cadastro', 'detalhe', 'edicao'] as const) {
  test(`AXE, foco e largura da página: ${tela}`, async ({ page, produtoId }, info) => {
    const caminhos = {
      lista: '/produtos',
      cadastro: '/produtos/novo',
      detalhe: `/produtos/${produtoId}`,
      edicao: `/produtos/${produtoId}/editar`,
    };
    await page.goto(caminhos[tela]);
    await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
    if (tela === 'lista') await expect(page.getByRole('table')).toBeVisible();
    if (tela === 'detalhe')
      await expect(page.getByRole('link', { name: 'Editar produto', exact: true })).toBeVisible();
    if (tela === 'edicao') await expect(page.getByLabel('Nome', { exact: true })).not.toHaveValue('');
    await expect.soft(page.getByRole('heading', { level: 1 })).toBeFocused({ timeout: 2_000 });
    const largura = await page.evaluate(() => ({
      conteudo: document.documentElement.scrollWidth,
      janela: window.innerWidth,
    }));
    expect
      .soft(largura.conteudo, 'Rolagem horizontal deve ficar restrita à tabela.')
      .toBeLessThanOrEqual(largura.janela);
    await auditar(page, info);
  });
}
