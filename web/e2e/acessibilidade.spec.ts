import { test, expect, auditar, abrirEdicao, gradeVisivel } from './apoio';

test('AXE e captura do login', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await auditar(page, info);
});

for (const tela of ['lista', 'cadastro', 'edicao'] as const) {
  test(`AXE, foco e largura da página: ${tela}`, async ({ page, produtoId }, info) => {
    expect(produtoId).toBeGreaterThan(0);
    await page.goto('/produtos');
    await expect(gradeVisivel(page)).toBeVisible();
    if (tela === 'cadastro') {
      await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
      const modal = page.getByRole('dialog', { name: 'Novo produto' });
      await expect(modal).toBeVisible();
      await expect.soft(modal.getByRole('textbox', { name: 'Nome', exact: true })).toBeFocused({ timeout: 2_000 });
    } else if (tela === 'edicao') {
      const modal = await abrirEdicao(page);
      await expect(modal.getByRole('textbox', { name: 'Nome', exact: true })).not.toHaveValue('');
      await expect.soft(modal.getByRole('textbox', { name: 'Nome', exact: true })).toBeFocused({ timeout: 2_000 });
    } else {
      await expect.soft(page.getByRole('heading', { level: 1 })).toBeFocused({ timeout: 2_000 });
    }
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
