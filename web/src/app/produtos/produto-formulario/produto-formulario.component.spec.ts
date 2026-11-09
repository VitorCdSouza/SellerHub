
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProdutoFormularioComponent } from './produto-formulario.component';

describe('Formulário de produto', () => {
  let fixture: ComponentFixture<ProdutoFormularioComponent>;
  let component: ProdutoFormularioComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProdutoFormularioComponent],
    });

    fixture = TestBed.createComponent(ProdutoFormularioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function preencherCampo(id: string, valor: string): void {
    const campo = fixture.nativeElement.querySelector(
      `#${id}`,
    ) as HTMLInputElement;

    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function enviarFormulario(): void {
    const formulario = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    formulario.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('não deve emitir dados quando os campos obrigatórios estiverem vazios', () => {
    const salvar = vi.fn();
    component.salvar.subscribe(salvar);

    enviarFormulario();

    expect(salvar).not.toHaveBeenCalled();
  });

  it('não deve aceitar nome ou SKU preenchidos apenas com espaços', () => {
    const salvar = vi.fn();
    component.salvar.subscribe(salvar);

    preencherCampo('nome', '   ');
    preencherCampo('sku', '   ');
    preencherCampo('precoBase', '10,00');
    enviarFormulario();

    expect(salvar).not.toHaveBeenCalled();
  });

  it('deve respeitar o limite de caracteres do nome e do SKU', () => {
    const salvar = vi.fn();
    component.salvar.subscribe(salvar);

    preencherCampo('nome', 'A'.repeat(256));
    preencherCampo('sku', 'A'.repeat(101));
    preencherCampo('precoBase', '10,00');
    enviarFormulario();

    expect(salvar).not.toHaveBeenCalled();
  });

  it('não deve aceitar preço igual a zero', () => {
    const salvar = vi.fn();
    component.salvar.subscribe(salvar);

    preencherCampo('nome', 'Produto');
    preencherCampo('sku', 'P-1');
    preencherCampo('precoBase', '0');
    enviarFormulario();

    expect(salvar).not.toHaveBeenCalled();
  });

  it('não deve aceitar preço negativo', () => {
    const salvar = vi.fn();
    component.salvar.subscribe(salvar);

    preencherCampo('nome', 'Produto');
    preencherCampo('sku', 'P-1');
    preencherCampo('precoBase', '-10');
    enviarFormulario();

    expect(salvar).not.toHaveBeenCalled();
  });

  it('não deve aceitar mais de duas casas decimais', () => {
    const salvar = vi.fn();
    component.salvar.subscribe(salvar);

    preencherCampo('nome', 'Produto');
    preencherCampo('sku', 'P-1');
    preencherCampo('precoBase', '10,999');
    enviarFormulario();

    expect(salvar).not.toHaveBeenCalled();
  });

  it('não deve aceitar preço igual ou superior a 100 milhões', () => {
    const salvar = vi.fn();
    component.salvar.subscribe(salvar);

    preencherCampo('nome', 'Produto');
    preencherCampo('sku', 'P-1');
    preencherCampo('precoBase', '100000000');
    enviarFormulario();

    expect(salvar).not.toHaveBeenCalled();
  });

  it('deve emitir os dados válidos convertendo vírgula decimal para número', () => {
    const salvar = vi.fn();
    component.salvar.subscribe(salvar);

    preencherCampo('nome', ' Produto ');
    preencherCampo('sku', ' P-1 ');
    preencherCampo('precoBase', '35,50');
    enviarFormulario();

    expect(salvar).toHaveBeenCalledWith({
      nome: 'Produto',
      sku: 'P-1',
      precoBase: 35.5,
    });
  });

  it('deve preencher os campos quando receber dados iniciais', () => {
    fixture.componentRef.setInput('dadosIniciais', {
      nome: 'Produto existente',
      sku: 'P-2',
      precoBase: 49.9,
    });

    fixture.detectChanges();

    const nome = fixture.nativeElement.querySelector('#nome') as HTMLInputElement;
    const sku = fixture.nativeElement.querySelector('#sku') as HTMLInputElement;
    const preco = fixture.nativeElement.querySelector('#precoBase') as HTMLInputElement;

    expect(nome.value).toBe('Produto existente');
    expect(sku.value).toBe('P-2');
    expect(preco.value).toBe('49,9');
  });
});
