import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { once } from 'node:events';
import { criarApiSimulada } from './api-simulada.mjs';

const servidores = [];
afterEach(async () => {
  await Promise.all(
    servidores.splice(0).map(
      (servidor) =>
        new Promise((resolve, reject) => {
          servidor.close((erro) => (erro ? reject(erro) : resolve()));
          servidor.closeAllConnections();
        }),
    ),
  );
});

async function iniciar(opcoes) {
  const servidor = criarApiSimulada(opcoes);
  servidores.push(servidor);
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const origem = `http://127.0.0.1:${servidor.address().port}`;
  return async (caminho, { cookie, corpo, metodo = 'GET' } = {}) => {
    const resposta = await fetch(`${origem}${caminho}`, {
      method: metodo,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    return {
      status: resposta.status,
      corpo: await resposta.json(),
      cookie: resposta.headers.get('set-cookie'),
      simulacao: resposta.headers.get('x-sellerhub-simulacao'),
    };
  };
}

async function entrar(requisitar, email = 'catalogo@exemplo.test') {
  const resposta = await requisitar('/api/login', {
    metodo: 'POST',
    corpo: { email, password: '123456' },
  });
  assert.equal(resposta.status, 200);
  return resposta.cookie.split(';')[0];
}

test('exige sessão, confirma conta e remove somente o cookie simulado ao sair', async () => {
  const requisitar = await iniciar();
  assert.equal((await requisitar('/api/produtos')).status, 401);
  assert.equal(
    (
      await requisitar('/api/login', {
        metodo: 'POST',
        corpo: { email: 'catalogo@exemplo.test', password: 'errada' },
      })
    ).status,
    401,
  );
  const cookie = await entrar(requisitar);
  assert.match(cookie, /^sellerhub_simulada=/);
  const sessao = await requisitar('/api/sessao', { cookie });
  assert.deepEqual(sessao.corpo, { id: 1, email: 'catalogo@exemplo.test' });
  assert.equal(sessao.simulacao, 'true');
  const saida = await requisitar('/api/logout', { metodo: 'POST', cookie });
  assert.match(saida.cookie, /Max-Age=0/);
  assert.equal((await requisitar('/api/sessao')).status, 401);
});

test('fornece duas páginas e rejeita paginação inválida', async () => {
  const requisitar = await iniciar();
  const cookie = await entrar(requisitar);
  const primeira = await requisitar('/api/produtos?pagina=1&limite=20', { cookie });
  const segunda = await requisitar('/api/produtos?pagina=2&limite=20', { cookie });
  assert.equal(primeira.corpo.total, 25);
  assert.equal(primeira.corpo.items.length, 20);
  assert.equal(segunda.corpo.items.length, 5);
  assert.equal(segunda.corpo.items[0].id, 21);
  for (const parametros of [
    'pagina=0',
    'limite=101',
    'pagina=1.5',
    'pagina=2147483647&limite=100',
  ]) {
    assert.equal((await requisitar(`/api/produtos?${parametros}`, { cookie })).status, 400);
  }
});

test('cadastro e edição preservam preço decimal e isolam os dados entre contas', async () => {
  const requisitar = await iniciar();
  const primeira = await entrar(requisitar);
  const segunda = await entrar(requisitar, 'outra@exemplo.test');
  const criado = await requisitar('/api/produtos', {
    metodo: 'POST',
    cookie: primeira,
    corpo: { name: ' Produto novo ', sku: ' SKU-NOVO ', basePrice: 35.5 },
  });
  assert.equal(criado.status, 201);
  const caminho = `/api/produtos/${criado.corpo.id}`;
  assert.deepEqual((await requisitar(caminho, { cookie: primeira })).corpo, {
    id: criado.corpo.id,
    name: 'Produto novo',
    sku: 'SKU-NOVO',
    basePrice: 35.5,
  });
  assert.equal((await requisitar(caminho, { cookie: segunda })).status, 404);
  assert.equal(
    (
      await requisitar(caminho, {
        metodo: 'PUT',
        cookie: segunda,
        corpo: { name: 'Indevido', sku: 'X', basePrice: 10 },
      })
    ).status,
    404,
  );
  assert.deepEqual((await requisitar('/api/produtos', { cookie: segunda })).corpo, {
    items: [],
    total: 0,
  });
  assert.equal(
    (
      await requisitar(caminho, {
        metodo: 'PUT',
        cookie: primeira,
        corpo: { name: 'Nome editado', sku: 'SKU-EDITADO', basePrice: 42.01 },
      })
    ).status,
    200,
  );
  assert.equal((await requisitar(caminho, { cookie: primeira })).corpo.basePrice, 42.01);
});

test('não arredonda preços inválidos nem simula unicidade de SKU ausente na API', async () => {
  const requisitar = await iniciar({ cenario: 'vazio' });
  const cookie = await entrar(requisitar);
  for (const basePrice of [0, -1, 1.001, 100000000, '35,50']) {
    assert.equal(
      (
        await requisitar('/api/produtos', {
          metodo: 'POST',
          cookie,
          corpo: { name: 'Produto', sku: 'REPETIDO', basePrice },
        })
      ).status,
      400,
    );
  }
  for (let indice = 0; indice < 2; indice++) {
    assert.equal(
      (
        await requisitar('/api/produtos', {
          metodo: 'POST',
          cookie,
          corpo: { name: '🛒'.repeat(255), sku: 'REPETIDO', basePrice: 0.01 },
        })
      ).status,
      201,
    );
  }
  assert.equal((await requisitar('/api/produtos', { cookie })).corpo.total, 2);
});

test('oferece vazio e falhas controladas sem criar contratos para módulos bloqueados', async () => {
  for (const [cenario, caminho] of [
    ['vazio', '/api/produtos'],
    ['falha-produtos', '/api/produtos'],
    ['falha-sessao', '/api/sessao'],
    ['falha-saida', '/api/logout'],
  ]) {
    const requisitar = await iniciar({ cenario });
    const cookie = await entrar(requisitar);
    const resposta = await requisitar(caminho, {
      cookie,
      metodo: caminho === '/api/logout' ? 'POST' : 'GET',
    });
    assert.equal(resposta.status, cenario === 'vazio' ? 200 : 500);
    if (cenario === 'vazio') assert.deepEqual(resposta.corpo, { items: [], total: 0 });
    assert.equal((await requisitar('/api/anuncios', { cookie })).status, 404);
  }
});
