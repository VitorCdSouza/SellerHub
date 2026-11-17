export interface Produto {
  id: number;
  nome: string;
  sku: string;
  precoBase: number;
  saldo: number;
  saldoAtualizadoEm: string;
}

export type DadosProduto = Pick<Produto, 'nome' | 'sku' | 'precoBase'>;

export interface PaginaProdutos {
  itens: Produto[];
  total: number;
}
