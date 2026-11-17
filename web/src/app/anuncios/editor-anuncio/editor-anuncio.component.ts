import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize, forkJoin, map } from 'rxjs';
import { FormularioComponent } from '../../compartilhado/formulario/formulario.component';
import {
  CampoFormulario,
  ValoresFormulario,
} from '../../compartilhado/formulario/campo-formulario';
import { EstoqueService, ItemEstoque } from '../../estoque/estoque.service';
import { Anuncio, Condicao, DadosAnuncio, DetalheAnuncio, Marketplace } from '../anuncio.model';
import { AnunciosService } from '../anuncios.service';

type Situacao = DadosAnuncio['situacao'];

interface DadosEditor {
  produtos: ItemEstoque[];
  marketplaces: Marketplace[];
  detalhe: DetalheAnuncio | null;
}

const padraoEan = /^(\d{8}|\d{12,14})$/;

@Component({
  selector: 'app-editor-anuncio',
  imports: [FormularioComponent],
  templateUrl: './editor-anuncio.component.html',
  styleUrl: './editor-anuncio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorAnuncioComponent implements OnInit {
  private readonly service = inject(AnunciosService);
  private readonly estoqueService = inject(EstoqueService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly formulario = viewChild.required(FormularioComponent);

  // null abre o cadastro; um id abre a edicao
  readonly anuncioId = input<number | null>(null);
  // anuncios existentes, para marcar os canais em que o produto ja esta anunciado
  readonly anuncios = input<Anuncio[]>([]);
  readonly salvo = output();
  readonly fechado = output();

  protected readonly dados = signal<DadosEditor | null>(null);
  protected readonly carregando = signal(false);
  protected readonly erroLeitura = signal('');
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  private readonly situacaoPedida = signal<Situacao>('rascunho');
  private readonly produtoSelecionado = signal<number | null>(null);

  protected readonly edicao = computed(() => this.anuncioId() !== null);

  protected readonly podeSalvar = computed(() => {
    const dados = this.dados();
    return dados !== null && (dados.detalhe !== null || dados.produtos.length > 0);
  });

  protected readonly canaisOcupados = computed(() => {
    const produtoId = this.produtoSelecionado();
    return new Set(
      this.anuncios()
        .filter((anuncio) => anuncio.produtoId === produtoId)
        .map((anuncio) => anuncio.marketplaceId),
    );
  });

  protected readonly saldo = computed(() => {
    const dados = this.dados();
    if (dados?.detalhe) return dados.detalhe.saldo;
    return dados?.produtos.find((produto) => produto.produtoId === this.produtoSelecionado())
      ?.saldo;
  });

  protected readonly campos = computed<CampoFormulario[]>(() => {
    const dados = this.dados();
    if (!dados) return [];

    const detalhe = dados.detalhe;
    const saldo = this.saldo();
    // aprovado exige descricao e condicao, como na api
    const paraAprovar = () => this.situacaoPedida() === 'aprovado';

    const produtoECanal: CampoFormulario[] = [
      {
        nome: 'produtoId',
        rotulo: 'Produto',
        tipo: 'selecao',
        obrigatorio: true,
        largura: 'metade',
        ajuda: saldo === undefined ? undefined : `${saldo} un. em estoque`,
        opcoes: dados.produtos.map((produto) => ({
          valor: produto.produtoId,
          rotulo: `${produto.nome} — ${produto.sku}`,
        })),
      },
      {
        nome: 'marketplaceId',
        rotulo: 'Canal',
        tipo: 'selecao',
        obrigatorio: true,
        largura: 'metade',
        opcoes: dados.marketplaces.map((marketplace) => {
          const ocupado = this.canaisOcupados().has(marketplace.id);
          return {
            valor: marketplace.id,
            rotulo: ocupado ? `${marketplace.nome} (já anunciado)` : marketplace.nome,
            desabilitada: ocupado,
          };
        }),
      },
    ];

    return [
      ...(detalhe ? [] : produtoECanal),
      {
        nome: 'titulo',
        rotulo: 'Título',
        tipo: 'texto',
        valorInicial: detalhe?.titulo,
        obrigatorio: true,
        maximo: 255,
      },
      {
        nome: 'descricao',
        rotulo: 'Descrição',
        tipo: 'texto-longo',
        valorInicial: detalhe?.descricao,
        obrigatorio: paraAprovar,
        maximo: 50_000,
      },
      {
        nome: 'preco',
        rotulo: 'Preço (R$)',
        tipo: 'preco',
        valorInicial: detalhe?.preco,
        placeholder: 'Ex.: 129,90',
        obrigatorio: true,
        largura: 'terco',
      },
      {
        nome: 'condicao',
        rotulo: 'Condição',
        tipo: 'selecao',
        valorInicial: detalhe?.condicao || null,
        obrigatorio: paraAprovar,
        largura: 'terco',
        opcoes: [
          { valor: 'novo', rotulo: 'Novo' },
          { valor: 'usado', rotulo: 'Usado' },
        ],
      },
      {
        nome: 'marca',
        rotulo: 'Marca',
        tipo: 'texto',
        valorInicial: detalhe?.marca,
        maximo: 100,
        largura: 'terco',
      },
      {
        nome: 'ean',
        rotulo: 'Código de barras (EAN)',
        tipo: 'texto',
        valorInicial: detalhe?.ean,
        largura: 'terco',
        padrao: { regex: padraoEan, mensagem: 'O EAN deve ter 8, 12, 13 ou 14 dígitos.' },
      },
    ];
  });

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erroLeitura.set('');

    const id = this.anuncioId();
    const leitura: Observable<DadosEditor> =
      id === null
        ? forkJoin({
            produtos: this.estoqueService.listar(),
            marketplaces: this.service.marketplaces(),
          }).pipe(map((resposta) => ({ ...resposta, detalhe: null })))
        : this.service
            .consultar(id)
            .pipe(map((detalhe) => ({ produtos: [], marketplaces: [], detalhe })));

    leitura
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (dados) => this.dados.set(dados),
        error: (erro: unknown) => {
          this.erroLeitura.set(
            erro instanceof HttpErrorResponse && erro.status === 404
              ? 'Anúncio não encontrado. Ele pode ter sido removido.'
              : 'Não foi possível carregar os dados do anúncio. Tente novamente.',
          );
        },
      });
  }

  protected pedirSituacao(situacao: Situacao): void {
    this.situacaoPedida.set(situacao);
  }

  protected aoAlterar(valores: ValoresFormulario): void {
    const produtoId = (valores['produtoId'] as number | undefined) ?? null;
    if (this.edicao() || produtoId === this.produtoSelecionado()) return;

    this.produtoSelecionado.set(produtoId);

    if (this.canaisOcupados().has(valores['marketplaceId'] as number)) {
      this.formulario().definirValor('marketplaceId', null);
    }
    // o nome do produto serve de ponto de partida para o titulo
    const produto = this.dados()?.produtos.find((item) => item.produtoId === produtoId);
    if (produto && !String(valores['titulo']).trim()) {
      this.formulario().definirValor('titulo', produto.nome);
    }
  }

  protected salvar(valores: ValoresFormulario): void {
    if (this.enviando()) {
      return;
    }

    const detalhe = this.dados()?.detalhe;
    const dados: DadosAnuncio = {
      produtoId: detalhe?.produtoId ?? (valores['produtoId'] as number),
      marketplaceId: detalhe?.marketplaceId ?? (valores['marketplaceId'] as number),
      titulo: valores['titulo'] as string,
      descricao: valores['descricao'] as string,
      preco: valores['preco'] as number,
      situacao: this.situacaoPedida(),
      condicao: (valores['condicao'] ?? '') as Condicao,
      marca: valores['marca'] as string,
      ean: valores['ean'] as string,
    };

    this.enviando.set(true);
    this.erro.set('');

    const id = this.anuncioId();
    const envio: Observable<unknown> =
      id === null ? this.service.cadastrar(dados) : this.service.atualizar(id, dados);

    envio
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: () => {
          this.salvo.emit();
          this.fechar();
        },
        error: (erro: unknown) => this.erro.set(this.mensagemErro(erro)),
      });
  }

  protected fechar(): void {
    this.dialogo().nativeElement.close();
  }

  // esc dispara cancel; durante o envio o modal fica aberto ate a resposta
  protected impedirFechamentoDuranteEnvio(evento: Event): void {
    if (this.enviando()) {
      evento.preventDefault();
    }
  }

  private mensagemErro(erro: unknown): string {
    if (!(erro instanceof HttpErrorResponse)) {
      return 'Ocorreu um erro inesperado. Tente novamente.';
    }
    if (erro.status === 401) {
      return 'Sua sessão expirou. Faça login novamente.';
    }
    // a api devolve mensagens prontas para entrada invalida, inexistente e conflito
    const mensagem = (erro.error as { message?: string } | null)?.message;
    if ([400, 404, 409].includes(erro.status) && mensagem) {
      return mensagem;
    }
    return 'Não foi possível salvar o anúncio. Tente novamente.';
  }
}
