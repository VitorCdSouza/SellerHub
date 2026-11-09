import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { cp, mkdir, open, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

const raizPadrao = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const versaoPlano = 1;
export const verificacoes = [
  ['executor', 'node --test ferramentas/verificar-qualidade.test.mjs'],
  ['angular', 'npm test -- --watch=false'],
  ['simulador', 'npm run test:simulador'],
  ['tipos-e2e', 'npm run test:e2e:tipos'],
  ['build', 'npm run build'],
  ['api-real', 'npm run test:api-real -- --origem=http://localhost:4200'],
  ['e2e', 'npm run test:e2e'],
];
const codigoSaida = { APROVADO: 0, FALHOU: 1, BLOQUEADO: 2, DESATUALIZADO: 3 };
const pastasIgnoradas = [
  'node_modules',
  'tmp',
  'dist',
  '.angular',
  '.git',
  'test-results',
  'playwright-report',
  'coverage',
];

// Também aceita arquivos removidos: não consulta a existência do caminho.
export function ehArquivoCodigo(caminhoRelativo) {
  const caminho = caminhoRelativo.replaceAll('\\', '/').replace(/^\.\//, '');
  const partes = caminho.split('/');
  const nome = partes.at(-1);
  if (partes.some((parte) => parte === '..' || pastasIgnoradas.includes(parte))) return false;
  if (nome.startsWith('.env') || nome.endsWith('.md') || nome.endsWith('.local.json')) return false;
  if (
    ['web/src/', 'web/e2e/', 'web/ferramentas/', 'web/public/'].some((prefixo) =>
      caminho.startsWith(prefixo),
    )
  )
    return true;
  if (caminho.startsWith('api/') && caminho.endsWith('.go')) return true;
  if (caminho.startsWith('db/') && caminho.endsWith('.sql')) return true;
  return (
    partes.length === 2 && partes[0] === 'web' && !nome.startsWith('.') && /\.(json|ts)$/.test(nome)
  );
}

// Caminhos relativos da árvore atual, inclusive arquivos ainda não rastreados.
export async function listarArquivosCodigo(raiz = raizPadrao) {
  const arquivos = [];
  async function visitar(relativo) {
    let entradas;
    try {
      entradas = await readdir(join(raiz, relativo), { withFileTypes: true });
    } catch (erro) {
      if (erro.code === 'ENOENT') return;
      throw erro;
    }
    for (const entrada of entradas) {
      const caminho = `${relativo}/${entrada.name}`;
      if (entrada.isDirectory() && !pastasIgnoradas.includes(entrada.name)) {
        await visitar(caminho);
      } else if (entrada.isFile() && ehArquivoCodigo(caminho)) arquivos.push(caminho);
    }
  }
  for (const pasta of ['web/src', 'web/e2e', 'web/ferramentas', 'web/public', 'api', 'db'])
    await visitar(pasta);
  const configuracoes = await readdir(join(raiz, 'web'), { withFileTypes: true });
  for (const entrada of configuracoes) {
    if (entrada.isFile() && ehArquivoCodigo(`web/${entrada.name}`)) {
      arquivos.push(`web/${entrada.name}`);
    }
  }
  return arquivos.sort();
}

// SHA-256 dos caminhos e conteúdos relevantes, sem ler credenciais ou relatórios.
export async function impressaoCodigo(raiz = raizPadrao) {
  const hash = createHash('sha256');
  for (const arquivo of await listarArquivosCodigo(raiz)) {
    hash
      .update(arquivo)
      .update('\0')
      .update(await readFile(join(raiz, arquivo)))
      .update('\0');
  }
  return hash.digest('hex');
}

export function estadoFinal(checks, antes, depois) {
  if (antes !== depois) return 'DESATUALIZADO';
  if (checks.some((check) => check.status === 'FALHOU')) return 'FALHOU';
  if (
    checks.length !== verificacoes.length ||
    verificacoes.some(
      ([id], indice) => checks[indice]?.id !== id || checks[indice]?.status !== 'APROVADO',
    )
  )
    return 'BLOQUEADO';
  return 'APROVADO';
}

export function conferirRegistro(registro, hashAtual) {
  if (!registro || registro.versaoPlano !== versaoPlano || registro.hash !== hashAtual)
    return 'DESATUALIZADO';
  if (registro.status !== 'APROVADO')
    return Object.hasOwn(codigoSaida, registro.status) ? registro.status : 'DESATUALIZADO';
  const completos = verificacoes.every(
    ([id], indice) =>
      registro.checks?.[indice]?.id === id && registro.checks[indice].status === 'APROVADO',
  );
  return completos && registro.checks.length === verificacoes.length ? 'APROVADO' : 'DESATUALIZADO';
}

export async function adquirirLock(pasta) {
  await mkdir(pasta, { recursive: true });
  const arquivo = join(pasta, 'execucao.lock');
  let descritor;
  try {
    descritor = await open(arquivo, 'wx');
  } catch (erro) {
    if (erro.code === 'EEXIST')
      throw new Error(
        'Há uma rodada em andamento ou um lock órfão. Confira o processo antes de recuperar o lock.',
      );
    throw erro;
  }
  await descritor.writeFile(JSON.stringify({ pid: process.pid, inicio: new Date().toISOString() }));
  return async () => {
    await descritor.close();
    await unlink(arquivo);
  };
}

async function atomico(arquivo, conteudo) {
  const temporario = `${arquivo}.${process.pid}.tmp`;
  await writeFile(temporario, conteudo, { encoding: 'utf8', flag: 'wx' });
  await rename(temporario, arquivo);
}

async function ambienteDisponivel() {
  try {
    for (const [url, status] of [
      ['http://localhost:4200/', 200],
      ['http://localhost:4200/api/sessao', 401],
      ['http://localhost:8080/api/sessao', 401],
    ]) {
      const resposta = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5_000) });
      if (resposta.status !== status || resposta.headers.get('x-sellerhub-simulacao') === 'true')
        return false;
      await resposta.body?.cancel();
    }
    return true;
  } catch {
    return false;
  }
}

async function copiarArtefatos(web, destino) {
  for (const pasta of ['test-results', 'playwright-report']) {
    try {
      await cp(join(web, pasta), join(destino, pasta), { recursive: true });
    } catch (erro) {
      if (erro.code !== 'ENOENT') throw erro;
    }
  }
}

function executar(comando, web, log) {
  const descritor = openSync(log, 'wx');
  try {
    return spawnSync(comando, {
      cwd: web,
      shell: true,
      windowsHide: true,
      timeout: 600_000,
      stdio: ['ignore', descritor, descritor],
      env: { ...process.env, CI: 'true', NO_COLOR: '1', FORCE_COLOR: '0' },
    });
  } finally {
    closeSync(descritor);
  }
}

async function contar(id, log, web, inicioCheck) {
  if (id === 'e2e') {
    try {
      const dados = JSON.parse(await readFile(join(web, 'test-results/resumo.json'), 'utf8'));
      if (
        !Number.isFinite(Date.parse(dados.stats.startTime)) ||
        Date.parse(dados.stats.startTime) < inicioCheck
      )
        return null;
      return {
        aprovados: dados.stats.expected,
        falhas: dados.stats.unexpected,
        ignorados: dados.stats.skipped,
        instaveis: dados.stats.flaky,
      };
    } catch {
      return null;
    }
  }
  return contarLog(id, await readFile(log, 'utf8'));
}

export function contagemAprovada(contagem) {
  return (
    Number.isInteger(contagem?.aprovados) &&
    contagem.aprovados > 0 &&
    ['falhas', 'ignorados', 'pendentes', 'cancelados', 'instaveis'].every(
      (campo) => (contagem[campo] ?? 0) === 0,
    )
  );
}

export function contarLog(id, bruto) {
  const texto = stripVTControlCharacters(bruto);
  if (id === 'angular') {
    const aprovados = texto.match(/Tests\s+(\d+)\s+passed/);
    return aprovados
      ? {
          aprovados: Number(aprovados[1]),
          ignorados: Number(texto.match(/(\d+)\s+skipped/)?.[1] ?? 0),
          pendentes: Number(texto.match(/(\d+)\s+todo/)?.[1] ?? 0),
        }
      : null;
  }
  if (['executor', 'simulador'].includes(id)) {
    const aprovados = texto.match(/(?:#|ℹ) pass\s+(\d+)/);
    return aprovados
      ? {
          aprovados: Number(aprovados[1]),
          falhas: Number(texto.match(/(?:#|ℹ) fail\s+(\d+)/)?.[1] ?? 0),
          ignorados: Number(texto.match(/(?:#|ℹ) skipped\s+(\d+)/)?.[1] ?? 0),
          pendentes: Number(texto.match(/(?:#|ℹ) todo\s+(\d+)/)?.[1] ?? 0),
          cancelados: Number(texto.match(/(?:#|ℹ) cancelled\s+(\d+)/)?.[1] ?? 0),
        }
      : null;
  }
  if (id === 'api-real')
    return { aprovados: Number(texto.match(/"verificacoes":\s*(\d+)/)?.[1] ?? 0) };
  return null;
}

function resumo(registro) {
  const linhas = registro.checks.map((check) => {
    const quantidade = check.contagem ? `; ${JSON.stringify(check.contagem)}` : '';
    return `| ${check.id} | ${check.status} | ${check.codigo ?? '—'}${quantidade} |`;
  });
  return (
    `# Verificação técnica do front-end\n\n` +
    `Estado: **${registro.status}**. Finalizado em ${registro.fim}.\n\n` +
    `Código verificado: \`${registro.hash}\`. HEAD de referência: \`${registro.head}\`. Plano ${registro.versaoPlano}.\n\n` +
    `Ambiente: Node ${registro.ambiente.node}; ${registro.ambiente.plataforma}/${registro.ambiente.arquitetura}.\n\n` +
    `| Verificação | Resultado | Saída / contagem |\n| --- | --- | --- |\n${linhas.join('\n')}\n\n` +
    `Este resultado vale para o conteúdo identificado acima e os checks executados. Não conclui o MVP nem substitui os critérios de aceite.\n\n` +
    `Pendências, responsáveis de front/back-end e decisões: [TODO.md](TODO.md). Logs completos e evidências permanecem locais em \`tmp/qualidade/\`.\n`
  );
}

export async function conferirProva(raiz = raizPadrao) {
  try {
    await readFile(join(raiz, 'web/tmp/qualidade/execucao.lock'));
    return 'BLOQUEADO';
  } catch (erro) {
    if (erro.code !== 'ENOENT') return 'BLOQUEADO';
  }
  let registro;
  try {
    registro = JSON.parse(await readFile(join(raiz, 'web/tmp/qualidade/ultimo.json'), 'utf8'));
  } catch {
    return 'DESATUALIZADO';
  }
  return conferirRegistro(registro, await impressaoCodigo(raiz));
}

export async function verificarQualidade(raiz = raizPadrao) {
  const web = join(raiz, 'web');
  const historico = join(web, 'tmp/qualidade');
  const liberar = await adquirirLock(historico);
  try {
    const inicio = new Date().toISOString();
    const id = `${inicio.replace(/[^0-9]/g, '')}-${randomUUID().slice(0, 8)}`;
    const pasta = join(historico, id);
    await mkdir(pasta);
    await copiarArtefatos(web, join(pasta, 'anteriores'));
    const antes = await impressaoCodigo(raiz);
    const head = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: raiz,
      encoding: 'utf8',
      windowsHide: true,
    }).stdout?.trim();
    const checks = [];
    for (const [nome, comando] of verificacoes) {
      if (['api-real', 'e2e'].includes(nome)) {
        if (!(await ambienteDisponivel())) {
          checks.push({
            id: nome,
            status: 'BLOQUEADO',
            motivo: 'Angular/Go/proxy real indisponível ou simulado.',
          });
          continue;
        }
      }
      console.log(`Verificando ${nome}...`);
      const log = join(pasta, `${nome}.log`);
      const inicioCheck = Date.now();
      const resultado = executar(comando, web, log);
      const contagem = await contar(nome, log, web, inicioCheck);
      let status = resultado.error ? 'BLOQUEADO' : resultado.status === 0 ? 'APROVADO' : 'FALHOU';
      if (
        status === 'FALHOU' &&
        ['api-real', 'e2e'].includes(nome) &&
        !(await ambienteDisponivel())
      )
        status = 'BLOQUEADO';
      if (
        status === 'APROVADO' &&
        ['executor', 'angular', 'simulador', 'api-real', 'e2e'].includes(nome) &&
        !contagemAprovada(contagem)
      )
        status = 'FALHOU';
      checks.push({ id: nome, status, codigo: resultado.status, contagem });
      console.log(`${nome}: ${status}`);
    }
    await copiarArtefatos(web, join(pasta, 'evidencias'));
    const hash = await impressaoCodigo(raiz);
    const registro = {
      id,
      inicio,
      fim: new Date().toISOString(),
      versaoPlano,
      ambiente: { node: process.version, plataforma: process.platform, arquitetura: process.arch },
      hash,
      hashInicial: antes,
      head: /^[a-f0-9]{40,64}$/.test(head ?? '') ? head : 'indisponivel',
      status: estadoFinal(checks, antes, hash),
      checks,
    };
    const json = JSON.stringify(registro, null, 2) + '\n';
    await writeFile(join(pasta, 'resultado.json'), json, { flag: 'wx' });
    await atomico(join(web, 'QUALIDADE.md'), resumo(registro));
    await atomico(join(historico, 'ultimo.json'), json);
    console.log(`Resultado: ${registro.status}. Rodada: ${id}.`);
    return registro.status;
  } finally {
    await liberar();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some((argumento) => argumento !== '--conferir'))
      throw new Error('Use somente --conferir ou nenhum argumento.');
    const status = process.argv.includes('--conferir')
      ? await conferirProva()
      : await verificarQualidade();
    console.log(`Qualidade: ${status}`);
    process.exitCode = codigoSaida[status];
  } catch (erro) {
    console.error(`Verificação bloqueada: ${erro.message}`);
    process.exitCode = 2;
  }
}
