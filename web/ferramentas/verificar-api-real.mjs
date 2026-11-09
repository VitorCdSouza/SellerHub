import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    origem: { type: 'string', default: 'http://localhost:8080' },
    gravar: { type: 'boolean', default: false },
  },
});
const origem = new URL(values.origem);
if (
  origem.protocol !== 'http:' ||
  !['localhost', '127.0.0.1', '[::1]'].includes(origem.hostname) ||
  origem.username ||
  origem.password ||
  origem.pathname !== '/' ||
  origem.search ||
  origem.hash
) {
  throw new Error('Informe somente uma origem HTTP local, como http://localhost:4200.');
}

let verificacoes = 0;
let produtoCriado = null;
const contas = [];

function criarCliente() {
  let cookie = '';
  async function requisitar(caminho, { metodo = 'GET', corpo, esperado = 200 } = {}) {
    const resposta = await fetch(new URL(caminho, origem), {
      method: metodo,
      redirect: 'error',
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(10000),
    });
    assert.notEqual(
      resposta.headers.get('x-sellerhub-simulacao'),
      'true',
      'Foi detectada a API simulada. Use a API Go ou o proxy do comando npm start.',
    );
    assert.equal(resposta.status, esperado, `${metodo} ${caminho}: status inesperado`);
    const cookieRecebido = resposta.headers
      .getSetCookie()
      .find((item) => item.startsWith('sessao='));
    if (cookieRecebido)
      cookie = cookieRecebido.split(';')[0] === 'sessao=' ? '' : cookieRecebido.split(';')[0];
    let dados;
    try {
      dados = await resposta.json();
    } catch {
      throw new Error(`${metodo} ${caminho}: resposta sem JSON válido`);
    }
    verificacoes++;
    return { dados, cookieRecebido };
  }
  return requisitar;
}

async function entrar(email) {
  const cliente = criarCliente();
  const { dados, cookieRecebido } = await cliente('/api/login', {
    metodo: 'POST',
    corpo: { email, password: '123456' },
  });
  assert.equal(dados.success, true);
  assert.ok(cookieRecebido, 'O login não retornou o cookie de sessão.');
  assert.match(cookieRecebido, /HttpOnly/i);
  assert.match(cookieRecebido, /SameSite=Strict/i);
  assert.match(cookieRecebido, /Max-Age=28800/i);
  contas.push(cliente);
  return cliente;
}

async function verificar() {
  const anonimo = criarCliente();
  await anonimo('/api/sessao', { esperado: 401 });
  await anonimo('/api/produtos', { esperado: 401 });
  await anonimo('/api/login', { metodo: 'POST', corpo: {}, esperado: 400 });
  await anonimo('/api/login', {
    metodo: 'POST',
    corpo: { email: 'caio@sellerhub.com', password: 'incorreta' },
    esperado: 401,
  });
  await anonimo('/api/login', {
    metodo: 'POST',
    corpo: { email: 'qa-inexistente@exemplo.test', password: '123456' },
    esperado: 401,
  });

  const caio = await entrar(' CAIO@SELLERHUB.COM ');
  const { dados: sessao } = await caio('/api/sessao');
  assert.equal(sessao.email, 'caio@sellerhub.com');
  const { dados: primeira } = await caio('/api/produtos?pagina=1&limite=1');
  assert.ok(Array.isArray(primeira.items));
  assert.ok(Number.isInteger(primeira.total) && primeira.total >= 0);
  assert.ok(primeira.items.length <= 1);
  const { dados: segunda } = await caio('/api/produtos?pagina=2&limite=1');
  assert.equal(segunda.total, primeira.total);
  if (primeira.items.length && segunda.items.length)
    assert.notEqual(primeira.items[0].id, segunda.items[0].id);
  await caio('/api/produtos?pagina=0', { esperado: 400 });
  await caio('/api/produtos?limite=101', { esperado: 400 });
  await caio('/api/produtos/2147483647', { esperado: 404 });

  let id = primeira.items[0]?.id;
  let produtoEsperado = null;
  if (values.gravar) {
    console.log(
      'Modo de gravação: um produto QA será mantido no banco local; a API não oferece exclusão.',
    );
    const sku = `QA-FE-${Date.now()}`;
    const { dados: criado } = await caio('/api/produtos', {
      metodo: 'POST',
      corpo: { name: ' Produto QA de integracao ', sku: ` ${sku} `, basePrice: 35.5 },
      esperado: 201,
    });
    assert.ok(Number.isInteger(criado.id) && criado.id > 0);
    id = criado.id;
    produtoCriado = { id, sku };
    const { dados: consultado } = await caio(`/api/produtos/${id}`);
    assert.deepEqual(consultado, { id, name: 'Produto QA de integracao', sku, basePrice: 35.5 });
    produtoEsperado = { id, name: 'Produto QA de integracao - editado', sku, basePrice: 42.01 };
    const { id: _id, ...corpo } = produtoEsperado;
    const { dados: atualizado } = await caio(`/api/produtos/${id}`, { metodo: 'PUT', corpo });
    assert.equal(atualizado.success, true);
    for (const basePrice of [0, -1, 1.001, 100000000]) {
      await caio('/api/produtos', {
        metodo: 'POST',
        corpo: { ...corpo, basePrice },
        esperado: 400,
      });
    }
    const { dados: lista } = await caio('/api/produtos?pagina=1&limite=1');
    assert.equal(lista.total, primeira.total + 1);
  }

  const samuel = await entrar('samuel@sellerhub.com');
  const { dados: outraConta } = await samuel('/api/sessao');
  assert.equal(outraConta.email, 'samuel@sellerhub.com');
  assert.notEqual(outraConta.id, sessao.id);
  if (id !== undefined) {
    await samuel(`/api/produtos/${id}`, { esperado: 404 });
    if (values.gravar) {
      await samuel(`/api/produtos/${id}`, {
        metodo: 'PUT',
        corpo: { name: 'Alteracao indevida', sku: 'NEGADO', basePrice: 1 },
        esperado: 404,
      });
    }
    const { dados: preservado } = await caio(`/api/produtos/${id}`);
    assert.equal(preservado.id, id);
    if (produtoEsperado) assert.deepEqual(preservado, produtoEsperado);
  } else console.log('Isolamento por produto não exercitado: catálogo da primeira conta vazio.');

  await caio('/api/logout', { metodo: 'POST', corpo: {} });
  await caio('/api/sessao', { esperado: 401 });
  await anonimo('/api/logout', { metodo: 'POST', corpo: {} });
  console.log(
    JSON.stringify(
      {
        resultado: 'aprovado',
        origem: origem.origin,
        modo: values.gravar ? 'gravacao' : 'leitura',
        verificacoes,
        produtoCriado,
      },
      null,
      2,
    ),
  );
}

try {
  await verificar();
} catch (erro) {
  console.error(`Verificação interrompida: ${erro.message}`);
  if (produtoCriado)
    console.error(
      `Produto QA criado antes da falha: ID ${produtoCriado.id}, SKU ${produtoCriado.sku}.`,
    );
  process.exitCode = 1;
} finally {
  // Encerra apenas os cookies mantidos em memória por este comando.
  await Promise.allSettled(
    contas.map((conta) => conta('/api/logout', { metodo: 'POST', corpo: {} })),
  );
}
