import { request, type FullConfig } from '@playwright/test';

export default async function preparar(configuracao: FullConfig) {
  const cliente = await request.newContext({
    baseURL: configuracao.projects[0].use.baseURL,
    timeout: 10_000,
    maxRedirects: 0,
  });
  try {
    const pagina = await cliente.get('/');
    if (pagina.status() !== 200) throw new Error('Angular não respondeu com 200.');
    const sessao = await cliente.get('/api/sessao');
    if (sessao.headers()['x-sellerhub-simulacao'] === 'true') {
      throw new Error('A suíte E2E exige Go/PostgreSQL reais; o proxy está em modo simulado.');
    }
    if (sessao.status() !== 401) {
      throw new Error(`Sessão anônima respondeu ${sessao.status()}, esperado 401 da API real.`);
    }
  } catch (erro) {
    throw new Error(
      'Não foi possível preparar o E2E. Inicie Go/PostgreSQL e npm start em web, ' +
        'com o proxy real em http://localhost:4200. ' +
        String(erro),
    );
  } finally {
    await cliente.dispose();
  }
}
