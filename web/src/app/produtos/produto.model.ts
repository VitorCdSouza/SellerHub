export interface Produto {
  id: number;
  nome: string;
  sku: string;
  precoBase: number;
}

export type DadosProduto = Omit<Produto, 'id'>;

export interface PaginaProdutos {
  itens: Produto[];
  total: number;
}
