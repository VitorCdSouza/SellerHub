# Decisões de produto e arquitetura

Registro compartilhado das decisões que afetam o projeto, incluindo front-end, back-end, banco e documentação. Propostas pendentes não alteram requisitos por si só. A fila de execução continua em [web/TODO.md](../web/TODO.md); este documento concentra justificativas, aprovações e condições das decisões transversais.

## DEC-01 — Pedidos e estoque

**Estado em 09/11/2026: encaminhamento aprovado por Caio; aprovação conjunta do grupo ainda não registrada.** Caio, Leticia, Samuel e Vitor devem deliberar sobre a alteração de escopo abaixo. A aprovação individual não substitui a decisão do grupo.

### Proposta

Manter pedidos somente para consulta no primeiro MVP e adiar o comando manual de marcar cancelamento com reposição de estoque, previsto em RF11, para um incremento posterior. A sincronização automática de estoque por estados verificados dos pedidos permanece no planejamento; não equivale ao cumprimento do comando manual de RF11.

### Motivo e justificativa

O recorte de consulta mantém o foco em catálogo, publicação real e acompanhamento operacional. O comando manual acrescenta uma ação sensível de escrita, com efeitos sobre o saldo e os canais, antes de existirem contrato e garantias de consistência.

O [RF11](capitulos/03-analise.tex) exige marcação de cancelamento com reposição; o [fluxo descrito no capítulo 4](capitulos/04-projeto.tex) admite que repetir a marcação some a quantidade novamente. Uma confirmação visual não evita essa duplicidade. Propõe-se concentrar os movimentos automáticos no servidor, com registro durável e aplicação única por pedido/item, e avaliar a ação manual como incremento próprio. Adiar o botão não dispensa essas garantias no back-end nem autoriza tratar diferença de saldo remoto como venda.

### Impacto nas frentes

| Frente | Consequência e dependência |
| --- | --- |
| Produto e documentação | Adiar RF11 altera o escopo documentado. O requisito continua aberto até deliberação; após a decisão, alinhar RF11, RN05, casos de uso e fluxo do capítulo 4, preservando sua rastreabilidade. |
| Front-end — FE-10/FE-11 | Consulta de pedidos e acompanhamento de saldo/divergências podem avançar conforme os contratos. Não implementar botões de cancelamento, reposição ou entrada manual por suposição. |
| Back-end e banco — BE-10/BE-11/BE-15 | Definir fonte e estados elegíveis, vínculo ao SKU e registro durável do efeito aplicado. Garantir aplicação única com concorrência, repetição, eventos atrasados e recuperação. Cálculos de estoque ficam no servidor; consulta na interface não elimina a necessidade desses registros. |
| Integração e parceiro | Confirmar quem controla o saldo, quando as unidades ficam comprometidas e quais cancelamentos liberam estoque. Cancelamento e devolução física exigem tratamentos distintos; essas premissas precisam ser validadas antes de ativar movimentos reais. |

### Deliberação necessária

- [ ] **Grupo — Caio, Leticia, Samuel e Vitor:** registrar abaixo data, participantes, resultado (aprovar, rejeitar ou ajustar) e condições. Não presumir concordância dos demais.
- [ ] **Se aprovado pelo grupo:** registrar o incremento posterior do comando manual e seu responsável; alinhar requisitos e documentação com o recorte acordado.
- [ ] **Se rejeitado ou ajustado:** manter RF11 no escopo correspondente e especificar com Samuel/Vitor a operação manual segura em BE-10/BE-11 antes de implementá-la no front-end.
- [ ] **Samuel/Vitor:** especificar e homologar as garantias de BE-10/BE-11/BE-15 descritas acima; atualizar os itens correspondentes na fila de execução.

**Registro da decisão conjunta:** pendente. Preencher data, participantes, resultado, condições, destino de RF11/incremento posterior e responsáveis após a deliberação. Não há aprovação dos demais integrantes registrada neste documento.

Enquanto isso, RF11 permanece aberto na documentação e o MVP não deve ser declarado integralmente aceito com base no adiamento. Este registro não comprova entrega de RF11 ou disponibilidade de API. Os demais requisitos permanecem na fila.
