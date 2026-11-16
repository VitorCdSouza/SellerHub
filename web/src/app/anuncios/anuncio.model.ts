export type SituacaoAnuncio =
  'rascunho' | 'aprovado' | 'publicado' | 'pausado' | 'encerrado' | 'erro';

export type Condicao = '' | 'novo' | 'usado';

export interface Anuncio {
  id: number;
  marketplaceId: number;
  marketplace: string;
  produtoId: number;
  produto: string;
  sku: string;
  titulo: string;
  preco: number;
  situacao: SituacaoAnuncio;
}

export interface DetalheAnuncio extends Anuncio {
  saldo: number;
  descricao: string;
  condicao: Condicao;
  marca: string;
  ean: string;
}

export interface DadosAnuncio {
  produtoId: number;
  marketplaceId: number;
  titulo: string;
  descricao: string;
  preco: number;
  situacao: 'rascunho' | 'aprovado';
  condicao: Condicao;
  marca: string;
  ean: string;
}

export interface Marketplace {
  id: number;
  nome: string;
}

export const situacoes: { valor: SituacaoAnuncio; rotulo: string; plural: string }[] = [
  { valor: 'publicado', rotulo: 'Publicado', plural: 'Publicados' },
  { valor: 'pausado', rotulo: 'Pausado', plural: 'Pausados' },
  { valor: 'rascunho', rotulo: 'Rascunho', plural: 'Rascunhos' },
  { valor: 'aprovado', rotulo: 'Aprovado', plural: 'Aprovados' },
  { valor: 'encerrado', rotulo: 'Encerrado', plural: 'Encerrados' },
  { valor: 'erro', rotulo: 'Erro', plural: 'Erros' },
];

// publicado, pausado e encerrado ja estao no marketplace e a api recusa a edicao
export function anuncioEditavel(anuncio: Anuncio): boolean {
  return ['rascunho', 'aprovado', 'erro'].includes(anuncio.situacao);
}
