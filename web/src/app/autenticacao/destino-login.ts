export function destinoAposLogin(retorno: string | null): string {
  if (!retorno || !retorno.startsWith('/') || retorno.startsWith('//')) return '/inicio';
  const caminho = retorno.split(/[?#]/, 1)[0];
  return caminho === '/' || caminho === '/sessao-indisponivel' ? '/inicio' : retorno;
}
