export interface ColunaGrade<T> {
  campo: keyof T & string;
  titulo: string;
  // codigo usa fonte mono; preco e inteiro alinham a direita
  tipo?: 'texto' | 'codigo' | 'preco' | 'inteiro' | 'data';
  // largura css fixa, ex.: '10rem'; sem ela, a coluna divide o espaco que sobra
  largura?: string;
}

export interface OpcaoGrade<T> {
  rotulo: string;
  acao: (linha: T) => void;
  perigo?: boolean;
  // sem a funcao, a opcao fica habilitada em todas as linhas
  habilitada?: (linha: T) => boolean;
}
