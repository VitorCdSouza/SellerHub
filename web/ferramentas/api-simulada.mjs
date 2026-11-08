import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { parseArgs } from 'node:util';
import { setTimeout as esperar } from 'node:timers/promises';

export const cenarios = ['catalogo', 'vazio', 'falha-produtos', 'falha-sessao', 'falha-saida'];
const contas = [
  { id: 1, email: 'catalogo@exemplo.test' },
  { id: 2, email: 'outra@exemplo.test' },
];
const nomeCookie = 'sellerhub_simulada';

// Apoio ao desenvolvimento do Angular; não é implementação de autenticação ou persistência.
export function criarApiSimulada({ cenario = 'catalogo', atraso = 0, duracaoSessao = 28800 } = {}) {
  if (!cenarios.includes(cenario)) throw new Error('Cenário de simulação inválido');
  if (!Number.isInteger(atraso) || atraso < 0 || atraso > 60000)
    throw new Error('Atraso deve estar entre 0 e 60000 ms');
  if (!Number.isInteger(duracaoSessao) || duracaoSessao < 1)
    throw new Error('Duração da sessão deve ser um número inteiro positivo de segundos');

  const sessoes = new Map();
  const produtos =
    cenario === 'vazio'
      ? []
      : Array.from({ length: 25 }, (_, indice) => ({
          id: indice + 1,
          usuario: 1,
          name: `Produto de demonstração ${String(indice + 1).padStart(2, '0')}`,
          sku: `DEMO-${String(indice + 1).padStart(3, '0')}`,
          basePrice: 10 + indice + 0.5,
        }));
  let proximoId = produtos.length + 1;

  function responder(resposta, status, dados, cookie) {
    resposta.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-SellerHub-Simulacao': 'true',
      ...(cookie ? { 'Set-Cookie': cookie } : {}),
    });
    resposta.end(JSON.stringify(dados));
  }

  function falhar(resposta, status, message) {
    responder(resposta, status, { success: false, message });
  }

  function cookieSessao(valor, duracao) {
    return `${nomeCookie}=${valor}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${duracao}`;
  }

  function produtoPublico({ id, name, sku, basePrice }) {
    return { id, name, sku, basePrice };
  }

  async function lerCorpo(requisicao) {
    const partes = [];
    let tamanho = 0;
    for await (const parte of requisicao) {
      tamanho += parte.length;
      if (tamanho <= 4096) partes.push(parte);
    }
    if (tamanho > 4096) throw new Error('JSON inválido');
    const corpo = JSON.parse(Buffer.concat(partes).toString('utf8'));
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo))
      throw new Error('JSON inválido');
    return corpo;
  }

  function inteiro(valor, padrao) {
    if (valor === null || valor === '') return padrao;
    if (!/^\+?\d+$/.test(valor)) return NaN;
    const numero = Number(valor);
    return Number.isInteger(numero) && numero <= 2147483647 ? numero : NaN;
  }

  return createServer(async (requisicao, resposta) => {
    try {
      if (atraso) await esperar(atraso);
      const { pathname: caminho, searchParams } = new URL(requisicao.url, 'http://localhost');
      const metodo = requisicao.method;
      if (caminho === '/api/login' && metodo === 'POST') {
        const corpo = await lerCorpo(requisicao);
        const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : '';
        const senha = typeof corpo.password === 'string' ? corpo.password : '';
        if (!email || !senha || Buffer.byteLength(senha) > 72) {
          falhar(resposta, 400, 'Informe e-mail e senha de até 72 bytes');
          return;
        }
        const conta = contas.find((conta) => conta.email === email);
        if (!conta || senha !== '123456') {
          falhar(resposta, 401, 'Credenciais inválidas');
          return;
        }
        const identificador = randomUUID();
        sessoes.set(identificador, { conta, expira: Date.now() + duracaoSessao * 1000 });
        responder(
          resposta,
          200,
          { success: true, message: 'Login simulado realizado' },
          cookieSessao(identificador, duracaoSessao),
        );
        return;
      }

      if (caminho === '/api/logout' && metodo === 'POST') {
        if (cenario === 'falha-saida') falhar(resposta, 500, 'Falha de saída simulada');
        else
          responder(
            resposta,
            200,
            { success: true, message: 'Sessão encerrada' },
            cookieSessao('', 0),
          );
        return;
      }

      const produtoId = caminho.match(/^\/api\/produtos\/([^/]+)$/);
      const rotaSessao = caminho === '/api/sessao' && metodo === 'GET';
      const rotaProdutos = caminho === '/api/produtos' && ['GET', 'POST'].includes(metodo);
      const rotaProduto = produtoId && ['GET', 'PUT'].includes(metodo);
      if (!rotaSessao && !rotaProdutos && !rotaProduto) {
        falhar(resposta, 404, 'Rota não disponível na simulação');
        return;
      }

      const token = requisicao.headers.cookie
        ?.split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${nomeCookie}=`))
        ?.slice(nomeCookie.length + 1);
      const sessao = sessoes.get(token);
      if (!sessao || sessao.expira <= Date.now()) {
        if (token) sessoes.delete(token);
        falhar(resposta, 401, 'Sessão inválida ou expirada');
        return;
      }

      if (rotaSessao) {
        if (cenario === 'falha-sessao')
          falhar(resposta, 500, 'Falha de consulta de sessão simulada');
        else responder(resposta, 200, sessao.conta);
        return;
      }
      if (cenario === 'falha-produtos') {
        falhar(resposta, 500, 'Falha de catálogo simulada');
        return;
      }

      if (rotaProdutos && metodo === 'GET') {
        const pagina = inteiro(searchParams.get('pagina'), 1);
        const limite = inteiro(searchParams.get('limite'), 20);
        const inicio = (pagina - 1) * limite;
        if (!(pagina >= 1 && limite >= 1 && limite <= 100 && inicio <= 2147483647)) {
          falhar(resposta, 400, 'Parâmetros de paginação inválidos');
          return;
        }
        const catalogo = produtos
          .filter((produto) => produto.usuario === sessao.conta.id)
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR') || a.id - b.id);
        responder(resposta, 200, {
          items: catalogo.slice(inicio, inicio + limite).map(produtoPublico),
          total: catalogo.length,
        });
        return;
      }

      const id = produtoId ? inteiro(produtoId[1], NaN) : null;
      const produto = produtos.find(
        (produto) => produto.id === id && produto.usuario === sessao.conta.id,
      );
      if (produtoId && (!id || !produto)) {
        falhar(resposta, 404, 'Produto não encontrado');
        return;
      }
      if (metodo === 'GET') {
        responder(resposta, 200, produtoPublico(produto));
        return;
      }

      const corpo = await lerCorpo(requisicao);
      const name = typeof corpo.name === 'string' ? corpo.name.trim() : '';
      const sku = typeof corpo.sku === 'string' ? corpo.sku.trim() : '';
      const basePrice = corpo.basePrice;
      if (
        !name ||
        [...name].length > 255 ||
        !sku ||
        [...sku].length > 100 ||
        typeof basePrice !== 'number' ||
        !(basePrice > 0 && basePrice < 1e8) ||
        Math.round(basePrice * 100) / 100 !== basePrice
      ) {
        falhar(
          resposta,
          400,
          'Informe nome (até 255 caracteres), SKU (até 100) e preço base maior que zero com até 2 casas decimais',
        );
        return;
      }
      if (metodo === 'POST') {
        const novo = { id: proximoId++, usuario: sessao.conta.id, name, sku, basePrice };
        produtos.push(novo);
        responder(resposta, 201, { id: novo.id });
      } else {
        Object.assign(produto, { name, sku, basePrice });
        responder(resposta, 200, { success: true, message: 'Produto atualizado' });
      }
    } catch {
      if (!resposta.headersSent) falhar(resposta, 400, 'JSON inválido');
      else resposta.end();
    }
  });
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      cenario: { type: 'string', default: 'catalogo' },
      atraso: { type: 'string', default: '0' },
      'duracao-sessao': { type: 'string', default: '28800' },
    },
  });
  const servidor = criarApiSimulada({
    cenario: values.cenario,
    atraso: Number(values.atraso),
    duracaoSessao: Number(values['duracao-sessao']),
  });
  servidor.on('error', (erro) => {
    console.error(`Não foi possível iniciar a simulação: ${erro.message}`);
    process.exitCode = 1;
  });
  servidor.listen(8081, '127.0.0.1', () => {
    console.log(`SIMULAÇÃO do front-end em http://127.0.0.1:8081 — cenário: ${values.cenario}`);
    console.log('Dados fictícios em memória. Use npm run start:simulado em outro terminal.');
    console.log('Contas: catalogo@exemplo.test e outra@exemplo.test; senha fictícia: 123456');
  });
}
