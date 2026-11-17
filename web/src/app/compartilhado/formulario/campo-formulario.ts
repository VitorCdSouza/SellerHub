import { ValidationErrors } from '@angular/forms';

export type ValorCampo = string | number | null;
export type ValoresFormulario = Record<string, ValorCampo>;

export interface OpcaoCampo {
  valor: string | number;
  rotulo: string;
  desabilitada?: boolean;
}

export interface CampoFormulario {
  nome: string;
  rotulo: string;
  tipo: 'texto' | 'texto-longo' | 'preco' | 'inteiro' | 'selecao' | 'senha';
  valorInicial?: ValorCampo;
  placeholder?: string;
  // funcao quando a obrigatoriedade depende do estado da tela no momento do envio
  obrigatorio?: boolean | (() => boolean);
  // caracteres em texto, valor em inteiro
  maximo?: number;
  // caracteres em senha
  minimo?: number;
  padrao?: { regex: RegExp; mensagem: string };
  opcoes?: OpcaoCampo[];
  ajuda?: string;
  largura?: 'inteira' | 'metade' | 'terco';
}

export function valorInicial(campo: CampoFormulario): ValorCampo {
  const valor = campo.valorInicial ?? null;

  if (campo.tipo === 'selecao') return valor;
  if (valor === null) return '';
  if (campo.tipo === 'preco' && typeof valor === 'number') {
    return valor.toFixed(2).replace('.', ',');
  }
  return String(valor);
}

// limites contam caracteres unicode depois do trim, como a API
export function validarCampo(campo: CampoFormulario, valor: ValorCampo): ValidationErrors | null {
  const texto = textoDoCampo(campo, valor);
  const obrigatorio =
    typeof campo.obrigatorio === 'function' ? campo.obrigatorio() : campo.obrigatorio;

  if (texto === '') {
    if (!obrigatorio) return null;
    return { mensagem: campo.tipo === 'selecao' ? 'Selecione uma opção.' : 'Preencha este campo.' };
  }

  switch (campo.tipo) {
    case 'selecao':
      return null;
    case 'preco':
      return validarPreco(texto);
    case 'inteiro':
      return validarInteiro(texto, campo.maximo);
    case 'senha':
      return validarSenha(texto, campo.minimo);
  }

  if (campo.maximo !== undefined && Array.from(texto).length > campo.maximo) {
    return { mensagem: `Use no máximo ${formatarNumero(campo.maximo)} caracteres.` };
  }
  if (campo.padrao && !campo.padrao.regex.test(texto)) {
    return { mensagem: campo.padrao.mensagem };
  }
  return null;
}

export function converterValor(campo: CampoFormulario, valor: ValorCampo): ValorCampo {
  if (campo.tipo === 'selecao') return valor;

  const texto = textoDoCampo(campo, valor);

  if (campo.tipo === 'preco') return texto ? Number(texto.replace(',', '.')) : null;
  if (campo.tipo === 'inteiro') return texto ? Number(texto) : null;
  return texto;
}

// senha vale como digitada, sem trim
function textoDoCampo(campo: CampoFormulario, valor: ValorCampo): string {
  const texto = valor === null ? '' : String(valor);
  return campo.tipo === 'senha' ? texto : texto.trim();
}

// bcrypt so considera os primeiros 72 bytes
function validarSenha(texto: string, minimo = 1): ValidationErrors | null {
  if (Array.from(texto).length < minimo) {
    return { mensagem: `Use pelo menos ${minimo} caracteres.` };
  }
  if (new TextEncoder().encode(texto).length > 72) {
    return {
      mensagem: 'Use até 72 bytes; caracteres acentuados podem ocupar mais de um byte.',
    };
  }
  return null;
}

function validarPreco(texto: string): ValidationErrors | null {
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(texto)) {
    return { mensagem: 'Informe um preço válido, com até duas casas decimais.' };
  }

  const preco = Number(texto.replace(',', '.'));

  if (preco <= 0) return { mensagem: 'O preço deve ser maior que zero.' };
  if (preco >= 100_000_000) return { mensagem: 'O preço deve ser menor que R$ 100 milhões.' };
  return null;
}

function validarInteiro(texto: string, maximo = Number.MAX_SAFE_INTEGER): ValidationErrors | null {
  const numero = Number(texto);

  if (!/^\d+$/.test(texto) || numero < 1 || numero > maximo) {
    return { mensagem: `Informe um número inteiro entre 1 e ${formatarNumero(maximo)}.` };
  }
  return null;
}

function formatarNumero(numero: number): string {
  return numero.toLocaleString('pt-BR');
}
