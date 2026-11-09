# Decisões de produto e arquitetura

Registro compartilhado das decisões que afetam o projeto, incluindo front-end, back-end, banco e documentação. Propostas pendentes não alteram requisitos por si só. A fila de execução continua em [web/TODO.md](../web/TODO.md); este documento concentra justificativas, aprovações e condições das decisões transversais.

## DEC-01 — Pedidos e estoque

**Estado em 09/11/2026: escopo da primeira entrega esclarecido por Caio.** O primeiro MVP será demonstrado em ambiente de testes até cadastrar produto, criar anúncio e enviar uma chamada a um destino de marketplace. Integração real e comando manual de cancelamento/reposição ficam para entrega futura, com os controles necessários. Esse esclarecimento substitui a proposta anterior de exigir uma deliberação de adiamento para liberar a demonstração; não registra votos individuais dos demais integrantes nem entrega de RF11.

### Recorte da primeira entrega

O fluxo de demonstração é cadastrar produto → criar/preparar anúncio → revisar e aprovar → enviar a chamada pelo back-end ao destino de teste escolhido → exibir o resultado. O destino ainda precisa ser definido: construir um marketplace de teste é uma alternativa em avaliação, não uma implementação aprovada ou já disponível. A exigência anterior de Mercado Livre real não é condição de aceite desta primeira entrega.

Pedidos, estoque operacional, comando manual de RF11 e os demais módulos do produto completo permanecem na fila de evolução; não são exigências para encerrar este recorte de demonstração. Fotos e IA permanecem planejadas, sem presumir aqui que já estejam integradas ou que sejam necessárias para o envio mínimo escolhido. Os detalhes do anúncio, do destino e de seu contrato ainda precisam ser combinados.

### Motivo e justificativa

O objetivo imediato é demonstrar o fluxo do SellerHub em ambiente de testes, não operar pedidos e estoque reais. Portanto, a ausência do comando manual não é uma lacuna dentro desse primeiro recorte. A necessidade dele na evolução do produto permanece, incluindo os controles sobre saldo e canais.

O [RF11](capitulos/03-analise.tex) exige marcação de cancelamento com reposição; o [fluxo descrito no capítulo 4](capitulos/04-projeto.tex) admite que repetir a marcação some a quantidade novamente. Essa fragilidade deverá ser corrigida na especificação da entrega operacional: confirmação visual não evita duplicidade. Registro durável, aplicação única, concorrência e eventos atrasados continuam necessários antes de ativar movimentos reais. Diferença de saldo remoto não deve ser tratada isoladamente como prova de venda.

### Impacto nas frentes

| Frente | Consequência e dependência |
| --- | --- |
| Produto e documentação | Distinguir aceite do primeiro MVP de conclusão de todos os requisitos. RF11/RN05 e fluxos operacionais permanecem rastreáveis para a entrega futura. Alinhar a descrição acadêmica dos incrementos sem apagar requisitos. |
| Front-end — FE-04/05/06/08/09/15 | Priorizar produto e anúncio, revisão humana, envio e apresentação de sucesso/falha. Identificar o ambiente e o destino de teste; resultado simulado não aparece como anúncio publicado em marketplace real. FE-10/FE-11 ficam como evolução. |
| Back-end — BE-07/BE-08/BE-15 | Combinar contrato do anúncio e do destino, enviar a requisição pelo Go e devolver resultado verificável. Não fazer o Angular chamar o marketplace diretamente. Criar receptor de teste depende de escolha explícita; não presumir seu contrato. |
| Operação futura — BE-10/BE-11 | Antes de comandos reais, definir fonte/estados, vínculo ao SKU, efeitos persistidos, concorrência, repetição, eventos atrasados e recuperação. Fonte de estoque, cancelamentos e devoluções físicas exigem validação com o parceiro. |

### Critérios e pendências por entrega

- [x] **Recorte informado por Caio:** primeira demonstração em testes até produto → anúncio → envio; integração real e comando manual ficam para entrega futura. Substitui a pendência de decidir se RF11 bloqueia esta demonstração.
- [ ] **Grupo/front/back:** escolher o destino de teste e acordar contrato, dados, respostas e falhas. Marketplace próprio continua alternativa em avaliação; não exige construir uma plataforma comercial completa.
- [ ] **Aceite de demonstração — FE-15/BE-15:** produto persistido e reaberto, anúncio preparado e aprovado, requisição recebida no destino escolhido e resposta apresentada. Só disparar a chamada não comprova sucesso: registrar recebimento, resposta e erros. Identificar claramente real, sandbox ou receptor simulado; identificadores de teste não são IDs de anúncios reais.
- [ ] **Entrega operacional futura — Samuel/Vitor e grupo:** especificar e homologar RF11/BE-10/BE-11 com os controles descritos acima, antes de uso real; alinhar requisitos, regras e documentação e atualizar a fila.

**Origem do esclarecimento:** Caio, em 09/11/2026, informou o recorte pretendido pelo time para a primeira entrega e que o trabalho está em ambiente de testes. Não foram coletados votos individuais dos demais integrantes. A escolha do destino e o detalhamento da operação futura permanecem abertos.

O primeiro MVP pode ser aceito quando cumprir seu recorte de demonstração. Isso não conclui RF11, a integração real nem o produto completo. Este registro não comprova APIs implementadas, testes executados ou autorização para operar contas reais.
