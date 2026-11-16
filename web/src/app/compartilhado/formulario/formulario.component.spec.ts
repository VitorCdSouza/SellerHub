import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioComponent } from './formulario.component';
import { CampoFormulario, ValoresFormulario } from './campo-formulario';

describe('Formulário genérico', () => {
  let fixture: ComponentFixture<FormularioComponent>;
  let salvar: ReturnType<typeof vi.fn<(valores: ValoresFormulario) => void>>;

  const camposPadrao: CampoFormulario[] = [
    { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, maximo: 255 },
    { nome: 'sku', rotulo: 'SKU', tipo: 'texto', obrigatorio: true, maximo: 100 },
    { nome: 'preco', rotulo: 'Preço', tipo: 'preco', obrigatorio: true },
  ];

  function criar(campos: CampoFormulario[] = camposPadrao): void {
    TestBed.configureTestingModule({ imports: [FormularioComponent] });
    fixture = TestBed.createComponent(FormularioComponent);
    fixture.componentRef.setInput('identificador', 'teste');
    fixture.componentRef.setInput('campos', campos);
    salvar = vi.fn<(valores: ValoresFormulario) => void>();
    fixture.componentInstance.salvar.subscribe(salvar);
    fixture.detectChanges();
  }

  function campo(nome: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`#teste-${nome}`);
  }

  function preencher(nome: string, valor: string): void {
    const elemento = campo(nome);
    elemento.value = valor;
    elemento.dispatchEvent(new Event(elemento instanceof HTMLSelectElement ? 'change' : 'input'));
    fixture.detectChanges();
  }

  function enviar(): void {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function erro(nome: string): string | undefined {
    return fixture.nativeElement.querySelector(`#teste-${nome}-erro`)?.textContent.trim();
  }

  it('não emite e mostra erro quando campos obrigatórios estão vazios ou só com espaços', () => {
    criar();
    preencher('nome', '   ');
    enviar();

    expect(salvar).not.toHaveBeenCalled();
    expect(erro('nome')).toBe('Preencha este campo.');
    expect(campo('nome').getAttribute('aria-invalid')).toBe('true');
  });

  it('respeita o limite de caracteres', () => {
    criar();
    preencher('nome', 'A'.repeat(256));
    preencher('sku', 'P-1');
    preencher('preco', '10');
    enviar();

    expect(salvar).not.toHaveBeenCalled();
    expect(erro('nome')).toBe('Use no máximo 255 caracteres.');
  });

  it.each([
    ['0', 'O preço deve ser maior que zero.'],
    ['-10', 'Informe um preço válido, com até duas casas decimais.'],
    ['10,999', 'Informe um preço válido, com até duas casas decimais.'],
    ['100000000', 'O preço deve ser menor que R$ 100 milhões.'],
  ])('recusa o preço %s', (preco, mensagem) => {
    criar();
    preencher('nome', 'Produto');
    preencher('sku', 'P-1');
    preencher('preco', preco);
    enviar();

    expect(salvar).not.toHaveBeenCalled();
    expect(erro('preco')).toBe(mensagem);
  });

  it('emite os valores aparados e com o preço convertido para número', () => {
    criar();
    preencher('nome', ' Produto ');
    preencher('sku', ' P-1 ');
    preencher('preco', '35,50');
    enviar();

    expect(salvar).toHaveBeenCalledWith({ nome: 'Produto', sku: 'P-1', preco: 35.5 });
  });

  it('aceita o limite contando caracteres Unicode fora do BMP', () => {
    criar();
    preencher('nome', '🔧'.repeat(255));
    preencher('sku', '🔩'.repeat(100));
    preencher('preco', '10,00');
    enviar();

    expect(salvar).toHaveBeenCalledWith({
      nome: '🔧'.repeat(255),
      sku: '🔩'.repeat(100),
      preco: 10,
    });
  });

  it('preenche os campos com o valor inicial, formatando o preço', () => {
    criar([
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', valorInicial: 'Produto existente' },
      { nome: 'preco', rotulo: 'Preço', tipo: 'preco', valorInicial: 49.9 },
    ]);

    expect(campo('nome').value).toBe('Produto existente');
    expect(campo('preco').value).toBe('49,90');
  });

  it('leva o foco ao primeiro campo inválido ao enviar', () => {
    criar();
    document.body.appendChild(fixture.nativeElement);
    preencher('nome', 'Produto');
    enviar();

    expect(document.activeElement?.id).toBe('teste-sku');
  });

  it('valida inteiro, padrão e seleção', () => {
    criar([
      {
        nome: 'produto',
        rotulo: 'Produto',
        tipo: 'selecao',
        obrigatorio: true,
        opcoes: [{ valor: 7, rotulo: 'Teclado' }],
      },
      { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'inteiro', obrigatorio: true, maximo: 10 },
      {
        nome: 'ean',
        rotulo: 'EAN',
        tipo: 'texto',
        padrao: { regex: /^\d{8}$/, mensagem: 'EAN inválido.' },
      },
    ]);
    preencher('quantidade', '11');
    preencher('ean', '123');
    enviar();

    expect(erro('produto')).toBe('Selecione uma opção.');
    expect(erro('quantidade')).toBe('Informe um número inteiro entre 1 e 10.');
    expect(erro('ean')).toBe('EAN inválido.');

    preencher('produto', '1: 7');
    preencher('quantidade', '3');
    preencher('ean', '');
    enviar();

    expect(salvar).toHaveBeenCalledWith({ produto: 7, quantidade: 3, ean: '' });
  });

  it('lê a obrigatoriedade no momento do envio quando ela é uma função', () => {
    let exigir = false;
    criar([{ nome: 'descricao', rotulo: 'Descrição', tipo: 'texto-longo', obrigatorio: () => exigir }]);

    exigir = true;
    enviar();
    expect(salvar).not.toHaveBeenCalled();

    exigir = false;
    enviar();
    expect(salvar).toHaveBeenCalledWith({ descricao: '' });
  });

  it('avisa as alterações e aceita valor definido pelo componente pai', () => {
    criar();
    const alterado = vi.fn<(valores: ValoresFormulario) => void>();
    fixture.componentInstance.alterado.subscribe(alterado);

    preencher('nome', 'Produto');
    fixture.componentInstance.definirValor('sku', 'P-9');
    fixture.detectChanges();

    expect(alterado).toHaveBeenLastCalledWith({ nome: 'Produto', sku: 'P-9', preco: '' });
    expect(campo('sku').value).toBe('P-9');
  });
});
