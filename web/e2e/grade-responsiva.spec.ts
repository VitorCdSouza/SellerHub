import { type Locator } from '@playwright/test';
import { conta, test, expect, capturar, auditar, gradeVisivel, registrosVisiveis } from './apoio';

// 640 px CSS também representa uma janela de 1280 px com zoom de 200%.
const larguras = [320, 390, 640, 768, 1024, 1280, 1440, 1920];
const cenarios = [
  { nome: 'produtos', rota: '/produtos', email: conta.email },
  { nome: 'anuncios', rota: '/anuncios', email: 'samuel@sellerhub.com' },
];

async function medirGrade(tabela: Locator) {
  return tabela.evaluate((elemento) => {
    const container = elemento.parentElement!;
    const retangulosTexto = (alvo: Element) => {
      const walker = document.createTreeWalker(alvo, NodeFilter.SHOW_TEXT);
      const retangulos: DOMRect[] = [];
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        retangulos.push(...Array.from(range.getClientRects()));
      }
      return retangulos.filter((retangulo) => retangulo.width > 0 && retangulo.height > 0);
    };

    const cabecalhos = Array.from(elemento.querySelectorAll('thead th')).slice(1);
    const sobreposicoes: string[] = [];
    for (let indice = 0; indice < cabecalhos.length - 1; indice++) {
      const atual = cabecalhos[indice];
      const seguinte = cabecalhos[indice + 1];
      const sobrepoe = retangulosTexto(atual).some((primeiro) =>
        retangulosTexto(seguinte).some(
          (segundo) =>
            primeiro.right > segundo.left + 0.5 &&
            segundo.right > primeiro.left + 0.5 &&
            primeiro.bottom > segundo.top + 0.5 &&
            segundo.bottom > primeiro.top + 0.5,
        ),
      );
      if (sobrepoe) {
        sobreposicoes.push(`${atual.textContent?.trim()} / ${seguinte.textContent?.trim()}`);
      }
    }

    const lista = elemento.tagName === 'UL';
    const linhas = lista ? Array.from(elemento.children) : Array.from(elemento.querySelectorAll('tbody tr'));
    const nomes = linhas.map((linha, indice) => {
      const celula = lista ? linha.querySelector('h2')! : linha.querySelectorAll('td')[1];
      const texto = celula.textContent?.trim() ?? '';
      const maiorPalavra = Math.max(...texto.split(/\s+/).map((palavra) => Array.from(palavra).length));
      const caracteresPorLinha = new Map<number, number>();
      const walker = document.createTreeWalker(celula, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const no = walker.currentNode;
        let inicio = 0;
        for (const caractere of no.textContent ?? '') {
          const fim = inicio + caractere.length;
          if (caractere.trim()) {
            const range = document.createRange();
            range.setStart(no, inicio);
            range.setEnd(no, fim);
            const retangulo = range.getBoundingClientRect();
            const linhaTexto = Math.round(retangulo.top * 2) / 2;
            caracteresPorLinha.set(linhaTexto, (caracteresPorLinha.get(linhaTexto) ?? 0) + 1);
          }
          inicio = fim;
        }
      }
      return {
        linha: indice + 1,
        caracteres: Array.from(texto).length,
        linhas: caracteresPorLinha.size,
        maiorLinha: Math.max(0, ...caracteresPorLinha.values()),
        // Uma palavra curta deve caber; nomes longos não podem virar uma letra por linha.
        minimoLegivel: Math.min(8, maiorPalavra),
      };
    });

    container.scrollLeft = container.scrollWidth;
    const deslocamentoInterno = container.scrollLeft;
    container.scrollLeft = 0;
    return {
      lista,
      campos: lista ? linhas.map((linha) => ({
        rotulos: Array.from(linha.querySelectorAll('dt')).map((rotulo) => rotulo.textContent?.trim()),
        valores: Array.from(linha.querySelectorAll('dd')).map((valor) => ({ texto: valor.textContent?.trim(), largura: valor.getBoundingClientRect().width, larguraConteudo: valor.scrollWidth })),
      })) : [],
      larguraJanela: window.innerWidth,
      larguraDocumento: document.documentElement.scrollWidth,
      larguraContainer: container.clientWidth,
      larguraConteudo: container.scrollWidth,
      deslocamentoInterno,
      sobreposicoes,
      nomes,
    };
  });
}

for (const cenario of cenarios) {
  test(`grade de ${cenario.nome} mantém nomes e cabeçalhos legíveis em diferentes larguras`, async ({ page }, info) => {
    const login = await page.request.post('/api/login', {
      data: { email: cenario.email, password: conta.password },
    });
    expect(login.status()).toBe(200);
    await page.goto(cenario.rota);
    await expect(gradeVisivel(page)).toBeVisible();
    await expect(registrosVisiveis(page)).not.toHaveCount(0);

    for (const largura of larguras) {
      await test.step(`${largura} px CSS`, async () => {
        await page.setViewportSize({ width: largura, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        const medidas = await medirGrade(gradeVisivel(page));
        await info.attach(`${cenario.nome}-${largura}-geometria`, {
          body: JSON.stringify(medidas, null, 2),
          contentType: 'application/json',
        });
        expect.soft(medidas.larguraDocumento, 'A página não deve ganhar rolagem horizontal.').toBeLessThanOrEqual(medidas.larguraJanela);
        expect.soft(medidas.sobreposicoes, 'Textos dos cabeçalhos não podem se sobrepor.').toEqual([]);
        for (const nome of medidas.nomes) {
          expect.soft(nome.maiorLinha, `Nome da linha ${nome.linha} deve ter leitura em palavras, sem quebra letra a letra.`).toBeGreaterThanOrEqual(nome.minimoLegivel);
        }
        expect.soft(medidas.larguraConteudo, 'A consulta deve caber sem rolagem horizontal interna.').toBeLessThanOrEqual(medidas.larguraContainer + 1);
        if (largura <= 768) expect.soft(medidas.lista, 'Mobile e tablet estreito usam lista empilhada.').toBe(true);
        if (largura >= 1280) expect.soft(medidas.lista, 'Desktop mantém comparação em tabela.').toBe(false);
        if (medidas.lista) {
          const rotulos = cenario.nome === 'produtos'
            ? ['SKU', 'Preço base', 'Saldo', 'Saldo atualizado em']
            : ['Título do anúncio', 'Marketplace', 'Preço', 'Situação'];
          for (const campo of medidas.campos) {
            expect.soft(campo.rotulos).toEqual(rotulos);
            expect.soft(campo.valores).toHaveLength(4);
            for (const valor of campo.valores) {
              expect.soft(valor.texto).not.toBe('');
              expect.soft(valor.larguraConteudo).toBeLessThanOrEqual(valor.largura + 1);
            }
          }
          await expect(page.getByRole('table')).toHaveCount(0);
        } else {
          await expect(page.getByRole('table')).toBeVisible();
          await expect(page.getByRole('columnheader')).toHaveCount(6);
        }
        if ([320, 390, 1440].includes(largura)) {
          const opcoes = registrosVisiveis(page).first().getByRole('button', { name: /^Opções de / });
          await opcoes.click();
          const painel = page.locator('.menu-opcoes:popover-open');
          await expect(painel).toBeVisible();
          const area = (await painel.boundingBox())!;
          expect.soft(area.x).toBeGreaterThanOrEqual(0);
          expect.soft(area.x + area.width).toBeLessThanOrEqual(largura + 1);
          expect.soft(area.y).toBeGreaterThanOrEqual(0);
          expect.soft(area.y + area.height).toBeLessThanOrEqual(900 + 1);
          await expect(painel.getByRole('button', { name: 'Editar', exact: true })).toBeVisible();
          await expect(painel.getByRole('button', { name: 'Excluir', exact: true })).toBeVisible();
          if (cenario.nome === 'produtos') {
            await expect(painel.getByRole('button', { name: 'Registrar entrada', exact: true })).toBeVisible();
          }
          await page.keyboard.press('Escape');
          await expect(painel).not.toBeVisible();
        }
        if ([390, 1440].includes(largura)) await auditar(page, info, `${cenario.nome}-${largura}`);
        if ([390, 768, 1280, 1920].includes(largura)) {
          await capturar(page, info, `grade-${cenario.nome}-${largura}`);
        }
      });
    }
  });
}
