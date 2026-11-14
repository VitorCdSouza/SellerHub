import { test, expect, entrar, capturar } from './apoio';

test('cadastra ou retoma um produto QA e edita pela interface real', async ({ page }, info) => {
  let sku = `QA-E2E-${Date.now()}`;
  let nome = `Produto ${sku}`;
  let precoInicial = 35.5;
  let id: number;
  await page.goto('/');
  await entrar(page);
  const retomar = process.env['E2E_PRODUTO_QA'];
  if (retomar) {
    expect(retomar, 'Informe somente o ID de um QA-E2E desta conta.').toMatch(/^[1-9]\d*$/);
    id = Number(retomar);
    const resposta = await page.request.get(`/api/produtos/${id}`);
    expect(resposta.status()).toBe(200);
    const produto: { sku: string; name: string; basePrice: number } = await resposta.json();
    expect(produto.sku).toMatch(/^QA-E2E-\d+$/);
    expect(produto.name).toMatch(/^Produto QA-E2E-\d+( editado)?$/);
    sku = produto.sku;
    precoInicial = produto.basePrice;
    nome = `Produto ${sku}`;
    await page.goto('/produtos');
  } else {
    await page.getByRole('link', { name: 'Novo produto', exact: true }).click();
    await page.getByLabel('Nome', { exact: true }).fill(nome);
    await page.getByLabel('SKU', { exact: true }).fill(sku);
    await page.getByLabel('Preço base (R$)').fill('35,50');
    const criacao = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/produtos' && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Salvar produto', exact: true }).click();
    const resposta = await criacao;
    expect(resposta.status()).toBe(201);
    const criado: { id: number } = await resposta.json();
    id = criado.id;
    expect(id).toBeGreaterThan(0);
  }
  console.log(`Produto QA mantido no banco: ID ${id}, SKU ${sku}.`);
  await info.attach('produto-qa', {
    body: JSON.stringify({ id, sku }),
    contentType: 'application/json',
  });
  await expect(page).toHaveURL('/produtos');
  await expect(page.getByRole('table')).toBeVisible();
  const linha = page.getByRole('row').filter({ hasText: sku });
  // A ordenação/paginação real pode colocar o QA fora da primeira página.
  while (
    !(await linha.count()) &&
    (await page.getByRole('button', { name: 'Próxima', exact: true }).isEnabled())
  ) {
    const leitura = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/produtos' && r.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Próxima', exact: true }).click();
    expect((await leitura).status()).toBe(200);
    await expect(page.getByRole('table')).toBeVisible();
  }
  await expect(linha).toContainText(precoInicial.toFixed(2).replace('.', ','));
  await linha.getByRole('link').click();
  await expect(page).toHaveURL(`/produtos/${id}`);
  await expect(page.getByRole('link', { name: 'Editar produto', exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', {
      name: retomar ? new RegExp(`^${nome}( editado)?$`) : nome,
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Editar produto', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill(`${nome} editado`);
  await page.getByLabel('Preço base (R$)').fill('42,01');
  const atualizacao = page.waitForResponse((r) => r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  expect((await atualizacao).status()).toBe(200);
  await expect(page).toHaveURL(`/produtos/${id}`);
  await page.reload();
  await expect(page.getByRole('heading', { name: `${nome} editado`, exact: true })).toBeVisible();
  const consulta = await page.request.get(`/api/produtos/${id}`);
  expect(await consulta.json()).toEqual({ id, name: `${nome} editado`, sku, basePrice: 42.01 });
  await capturar(page, info, 'produto-gravado');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.goto(`/produtos/${id}`);
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await entrar(page, 'samuel@sellerhub.com');
  await expect(page.getByText('Produto não encontrado.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
});
