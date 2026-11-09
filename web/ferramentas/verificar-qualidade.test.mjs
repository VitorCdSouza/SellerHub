import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  adquirirLock,
  conferirProva,
  conferirRegistro,
  contarLog,
  contagemAprovada,
  estadoFinal,
  ehArquivoCodigo,
  impressaoCodigo,
  verificacoes,
  versaoPlano,
} from './verificar-qualidade.mjs';

async function ambiente(t) {
  const raiz = await mkdtemp(join(tmpdir(), 'sellerhub-qualidade-'));
  t.after(async () => {
    assert.equal(dirname(resolve(raiz)), resolve(tmpdir()));
    assert.ok(basename(raiz).startsWith('sellerhub-qualidade-'));
    await rm(raiz, { recursive: true, force: true });
  });
  for (const pasta of [
    'web/src',
    'web/e2e',
    'web/ferramentas',
    'web/public',
    'api/cmd',
    'db',
    'web/tmp/qualidade',
  ])
    await mkdir(join(raiz, pasta), { recursive: true });
  return raiz;
}

function prova(hash) {
  return {
    status: 'APROVADO',
    hash,
    versaoPlano,
    checks: verificacoes.map(([id]) => ({ id, status: 'APROVADO' })),
  };
}

test('filtro para o índice considera caminhos removidos sem ler dados privados', () => {
  for (const arquivo of [
    'web/src/removido.ts',
    'web/e2e/removido.spec.ts',
    'web/public/logo.png',
    'web/package.json',
    'api/cmd/removido.go',
    'db/removido.sql',
  ])
    assert.equal(ehArquivoCodigo(arquivo), true, arquivo);
  for (const arquivo of [
    '.env',
    '.contexto-local.md',
    'web/src/.env.local',
    'web/tmp/saida.ts',
    'web/TODO.md',
    '.codex/agents/qa.toml',
    '.rotina-local/qa/rodada.json',
  ])
    assert.equal(ehArquivoCodigo(arquivo), false, arquivo);
});

test('impressão considera arquivos novos, exclusões, contrato e configurações', async (t) => {
  const raiz = await ambiente(t);
  const inicial = await impressaoCodigo(raiz);
  for (const arquivo of [
    'web/src/novo.ts',
    'web/e2e/fluxo.spec.ts',
    'web/ferramentas/check.mjs',
    'api/cmd/main.go',
    'db/estrutura.sql',
    'web/proxy.conf.json',
    'web/package-lock.json',
    'web/public/logo.png',
  ]) {
    await writeFile(join(raiz, arquivo), 'conteudo');
    assert.notEqual(await impressaoCodigo(raiz), inicial, arquivo);
    await rm(join(raiz, arquivo));
    assert.equal(await impressaoCodigo(raiz), inicial, arquivo);
  }
});

test('impressão ignora contexto privado, credenciais, documentação e artefatos', async (t) => {
  const raiz = await ambiente(t);
  const antes = await impressaoCodigo(raiz);
  for (const arquivo of [
    '.env',
    '.contexto-local.md',
    'web/src/.env',
    'web/QUALIDADE.md',
    'web/TODO.md',
    'web/tmp/qualidade/ultimo.json',
  ])
    await writeFile(join(raiz, arquivo), 'privado');
  assert.equal(await impressaoCodigo(raiz), antes);
});

test('resultado exige todos os checks e invalida uma árvore modificada', () => {
  const checks = prova('hash').checks;
  assert.equal(estadoFinal(checks, 'a', 'a'), 'APROVADO');
  assert.equal(estadoFinal(checks.slice(1), 'a', 'a'), 'BLOQUEADO');
  assert.equal(estadoFinal([{ status: 'BLOQUEADO' }], 'a', 'a'), 'BLOQUEADO');
  assert.equal(estadoFinal([{ status: 'FALHOU' }], 'a', 'a'), 'FALHOU');
  assert.equal(estadoFinal(checks, 'a', 'b'), 'DESATUALIZADO');
});

test('aprovação em cache exige hash, plano e lista completa de checks', () => {
  const registro = prova('atual');
  assert.equal(conferirRegistro(registro, 'atual'), 'APROVADO');
  assert.equal(conferirRegistro(registro, 'novo'), 'DESATUALIZADO');
  assert.equal(conferirRegistro({ ...registro, versaoPlano: 0 }, 'atual'), 'DESATUALIZADO');
  assert.equal(conferirRegistro({ ...registro, checks: [] }, 'atual'), 'DESATUALIZADO');
  assert.equal(conferirRegistro({ ...registro, status: 'BLOQUEADO' }, 'atual'), 'BLOQUEADO');
  assert.equal(conferirRegistro(null, 'atual'), 'DESATUALIZADO');
});

test('saída com skipped/todo/cancelled ou sem testes não permite aprovação', () => {
  assert.equal(contagemAprovada(contarLog('angular', 'Tests 10 passed (10)')), true);
  assert.equal(contagemAprovada(contarLog('angular', 'Tests 10 passed | 2 skipped (12)')), false);
  assert.equal(contagemAprovada(contarLog('angular', 'Tests 10 passed | 1 todo (11)')), false);
  assert.equal(contagemAprovada(contarLog('executor', '# pass 5\n# skipped 1\n# todo 0')), false);
  assert.equal(contagemAprovada(contarLog('simulador', 'ℹ pass 5\nℹ skipped 0\nℹ todo 1')), false);
  assert.equal(contagemAprovada(contarLog('executor', '# pass 5\n# cancelled 1')), false);
  assert.equal(contagemAprovada(contarLog('executor', '# pass 0')), false);
  assert.equal(contagemAprovada(contarLog('angular', 'sem resultado')), false);
});

test('conferir prova sem resultado ou após edição nunca aprova', async (t) => {
  const raiz = await ambiente(t);
  assert.equal(await conferirProva(raiz), 'DESATUALIZADO');
  await writeFile(
    join(raiz, 'web/tmp/qualidade/ultimo.json'),
    JSON.stringify(prova(await impressaoCodigo(raiz))),
  );
  assert.equal(await conferirProva(raiz), 'APROVADO');
  await writeFile(join(raiz, 'web/src/mudanca.ts'), 'alterado');
  assert.equal(await conferirProva(raiz), 'DESATUALIZADO');
});

test('lock exclui execução concorrente e libera somente sua própria rodada', async (t) => {
  const raiz = await ambiente(t);
  const pasta = join(raiz, 'web/tmp/qualidade');
  const liberar = await adquirirLock(pasta);
  assert.equal(JSON.parse(await readFile(join(pasta, 'execucao.lock'))).pid, process.pid);
  await writeFile(join(pasta, 'ultimo.json'), JSON.stringify(prova(await impressaoCodigo(raiz))));
  assert.equal(await conferirProva(raiz), 'BLOQUEADO');
  await assert.rejects(adquirirLock(pasta), /rodada em andamento/);
  await liberar();
  const liberarNovamente = await adquirirLock(pasta);
  await liberarNovamente();
});
