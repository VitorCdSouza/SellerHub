import { type Locator } from '@playwright/test';
import { conta, test, expect, capturar } from './apoio';

// 640 px CSS também representa uma janela de 1280 px com zoom de 200%.
const larguras = [390, 640, 768, 1024, 1280, 1440, 1920];
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

    const nomes = Array.from(elemento.querySelectorAll('tbody tr')).map((linha, indice) => {
      const celula = linha.querySelectorAll('td')[1];
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
    const tabela = page.getByRole('table');
    await expect(tabela).toBeVisible();
    await expect(tabela.locator('tbody tr')).not.toHaveCount(0);

    for (const largura of larguras) {
      await test.step(`${largura} px CSS`, async () => {
        await page.setViewportSize({ width: largura, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        const medidas = await medirGrade(tabela);
        await info.attach(`${cenario.nome}-${largura}-geometria`, {
          body: JSON.stringify(medidas, null, 2),
          contentType: 'application/json',
        });
        expect.soft(medidas.larguraDocumento, 'A página não deve ganhar rolagem horizontal.').toBeLessThanOrEqual(medidas.larguraJanela);
        expect.soft(medidas.sobreposicoes, 'Textos dos cabeçalhos não podem se sobrepor.').toEqual([]);
        for (const nome of medidas.nomes) {
          expect.soft(nome.maiorLinha, `Nome da linha ${nome.linha} deve ter leitura em palavras, sem quebra letra a letra.`).toBeGreaterThanOrEqual(nome.minimoLegivel);
        }
        if (medidas.larguraConteudo > medidas.larguraContainer + 1) {
          expect.soft(medidas.deslocamentoInterno, 'O conteúdo excedente deve ser alcançável pela rolagem interna da tabela.').toBeGreaterThan(0);
        }
        if ([390, 768, 1280, 1920].includes(largura)) {
          await capturar(page, info, `grade-${cenario.nome}-${largura}`);
        }
      });
    }
  });
}
