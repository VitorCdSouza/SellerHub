import { CampoFormulario } from '../compartilhado/formulario/campo-formulario';
import { DadosProduto } from './produto.model';

// os nomes dos campos sao as chaves de DadosProduto
export function camposProduto(produto?: DadosProduto): CampoFormulario[] {
  return [
    {
      nome: 'nome',
      rotulo: 'Nome',
      tipo: 'texto',
      valorInicial: produto?.nome,
      obrigatorio: true,
      maximo: 255,
    },
    {
      nome: 'sku',
      rotulo: 'SKU',
      tipo: 'texto',
      valorInicial: produto?.sku,
      obrigatorio: true,
      maximo: 100,
      largura: 'metade',
    },
    {
      nome: 'precoBase',
      rotulo: 'Preço base (R$)',
      tipo: 'preco',
      valorInicial: produto?.precoBase,
      placeholder: 'Ex.: 129,90',
      obrigatorio: true,
      largura: 'metade',
    },
  ];
}
