# SellerHub — tarefas para concluir a entrega

Revisão em **17/11/2026**, com cruzamento dos 22 commits entre `336af955` e `776b91fc`, correção do banco local e da grade responsiva sobre `170af005`. Apresentação prevista para **17/11/2026**. Fila única para front-end, dependências de back-end e decisões; os IDs FE/BE/DEC anteriores continuam rastreáveis.

**Estado de qualidade em 17/11: APROVADO**, conforme [QUALIDADE.md](QUALIDADE.md): 94 Angular, 8 do executor, 5 do simulador, tipos/build, 19 HTTP reais e 26 E2E; zero skips/flaky e oito laudos AXE da suíte sem violações. Rodada `20261117155518103-34ad6bdb`, impressão `b33aa94f4139379f12b20bdcc34862c8cc4c17bd85a74fbc78c0591156e4c774`. Inclui regressão da grade em Produtos/Anúncios nas sete larguras descritas abaixo. O resultado não conclui todos os critérios do MVP. Caixas marcadas identificam subentregas, não aceite integral.

Base da correção atual: **`170af005`**. O cruzamento anterior cobriu `336af955..776b91fc`: APIs e telas de anúncios, saldo/entrada, conta/senha e indicadores. Nesse corte, Vitor contribuiu em 13 commits que tocaram `web/`; Leticia entregou modais, administração e indicadores, e Samuel ampliou SQL/sqlc. Referências de autoria e aceites históricos foram preservados.

**Bloqueio de BE-02 resolvido neste ambiente:** a [migration SQL](../db/migrations/20261117_01_compatibiliza_saldo_atributos.sql) acrescentou `saldo`, `saldo_atualizado_em` e `atributos_canal`, com CHECK de saldo não negativo. Atualização aplicada somente ao banco local, com backup e comparação de integridade; demais dados, IDs e situações preservados. Produtos/estoque e detalhe de anúncio voltaram a responder 200. Os defaults novos são zero/data da atualização/objeto vazio, sem representar contagem física ou atributos conferidos. Não houve mudança de código Go ou Angular de produção, seed/reset, normalização de situações ou aplicação de UNIQUE.

**Testes de catálogo ajustados:** seletores agora usam o nome acessível do campo, preservando foco/valores/erro; a validação confere a descrição acessível e `aria-invalid`. O teste aguarda a abertura do modal antes de Escape. Dois arquivos E2E alterados, sem remoção de AXE/interceptações/assertivas e sem gravação de produtos. As rodadas anteriores com falhas de banco e seletores permanecem como histórico.

**Defeito visual corrigido — QA-20261117-003-VIS-01:** o mínimo da grade agora soma as larguras declaradas e reserva espaço útil para cada coluna textual. A tabela mantém rolagem interna quando não cabe; nomes não são comprimidos letra por letra e cabeçalhos não se sobrepõem. Regressão independente falhou antes e passou depois em Produtos/Anúncios nas larguras CSS 390, 640, 768, 1024, 1280, 1440 e 1920; 640 representa também a largura CSS equivalente a uma janela de 1280 com zoom de 200%, sem afirmar teste de zoom nativo. Não houve mudança de dados, API ou páginas fora da grade compartilhada.

## Cruzamento das entregas recentes com a fila

| Referência | Implementação entregue | O que ainda impede concluir o item integral |
| --- | --- | --- |
| **FE-02/04/05/06; ENT-02/07** | Cadastro/edição em modais, grade/formulário compartilhados, exclusão de produto e retorno à lista. `119cbfa2`, `739959dc`, `8097567f`, `6ef470ca`. | Homologar o fluxo novo e fechar lacunas de cobertura. Detalhe/edição por URL e GET atrasado no editor deixaram de ser o fluxo do Angular. |
| **FE-08/09; BE-07; ENT-03/04/05** | CRUD de anúncios; modelos/serviço Angular, filtros locais e editor manual com rascunho/aprovação. `5104260d`, `5cfab6b7`, `a8ed2965`. | Prévia dedicada, revisão estável com autor/versão, operação de envio, resultado externo e homologação. Aprovação atual grava um estado mutável; não envia ao canal. |
| **FE-11; BE-11** | Consulta de saldo e entrada manual; saldo/data aparecem em Produtos, sem tela separada de estoque. `5104260d`, `5cfab6b7`, `d426c5e4`. | Movimentos/histórico, idempotência, vendas/cancelamento, conciliação e sincronização externa. Incremento SQL local não conclui a operação entre canais. |
| **FE-12; BE-12** | API mensal, serviço e tela com acessos/conversões/taxa, barras e agregação por canal. `4e98d087`, `364ab327`, `121b844f`. | Conferir amostra no banco, origem/atualização dos dados e acessibilidade real. Sem coleta automática externa. |
| **FE-13; BE-13** | Nome/e-mail, senha atual/nova/confirmação, atualização da sessão e resumo de canais. `364ab327`, `121b844f`. | Homologar persistência/erros. Preferências e conexão/reconexão externas não entregues. Trocar senha autenticado não conclui FE-14/BE-14. |
| **ENT-01/06; BE-08** | Listagem local de marketplaces e vínculo do anúncio ao canal. | Destino de testes e envio/recebimento/resposta não implementados no recorte. Nome de canal/status no banco não comprova publicação. |
| **FE-07/10/14; BE-06/09/10/14** | Nenhuma entrega dos respectivos fluxos encontrada nos commits revisados. | Fotos, IA, pedidos e recuperação de senha continuam pendentes. Vendas segue “Em breve”. |
| **ENT-07/08; FE-15/BE-15** | Banco local compatibilizado, grade responsiva corrigida e suíte atual aprovada; catálogo/login e geometria da grade exercitados. Roteiro preparado separadamente. | Concluir cenários adicionais, novos módulos, persistência/gravação, fluxo externo e ensaio. |

**Documentação ainda pendente:** o guia técnico mantém a referência incorreta a login em `/inicio`. A incompatibilidade de seletor/mensagem obrigatória do E2E foi reproduzida e corrigida nos testes, sem mudar a validação do produto. A visibilidade do erro associado também foi confirmada em sondagem independente; a aprovação não elimina as demais lacunas de cobertura de ENT-02.

## O que significa concluir esta entrega

O recorte de demonstração confirmado em DEC-01 é: **entrar → cadastrar/reabrir produto → preparar anúncio → revisar e aprovar → enviar pelo Go a um destino de testes → mostrar resultado verificável**.

A entrega só termina quando todos estes critérios forem atendidos:

- [ ] Produto criado pela interface permanece disponível após recarga e reinício da API.
- [ ] Anúncio pode ser salvo e reaberto, vinculado ao produto e ao destino escolhido.
- [ ] A pessoa revisa conteúdo/preço/destino e aprova explicitamente a versão enviada; alteração posterior exige nova aprovação.
- [ ] O Go envia a versão aprovada e há prova de recebimento e resposta do destino, relacionada ao anúncio/operação.
- [ ] A interface distingue envio em andamento, sucesso confirmado, falha e resultado desconhecido; clique duplo ou timeout não causa repetição cega.
- [ ] Ambiente e destino são identificados como testes/sandbox/receptor simulado. Identificador de teste não é anunciado como publicação comercial.
- [ ] Verificação de qualidade aprovada para o conteúdo final, com API/PostgreSQL reais, navegador, teclado, desktop/390 px e AXE nos estados exercitados.
- [ ] Outra pessoa consegue repetir o roteiro no computador da apresentação, com dados preparados e limitações documentadas.

**Não concluído hoje:** o CRUD e a aprovação local de anúncios já existem no Go/Angular, mas não há envio a destino de testes nem recebimento/resposta consultáveis. Faltam revisão estável da aprovação, operação/recuperação e homologação do conteúdo atual. O fluxo completo da entrega permanece aberto.

Fotos, Gemini, conexão comercial, pedidos, estoque operacional entre canais, RF11 e demais complementos permanecem na evolução abaixo. Consulta de saldo/entrada local, indicadores e conta têm subentregas descritas no cruzamento. Não são pré-requisitos gerais deste envio mínimo; se o destino escolhido exigir algum deles, ENT-01 deve identificar a dependência antes da implementação.

## Tarefas concluídas

Esta seção reúne **entregas delimitadas já realizadas**, com sua evidência. Conclusão de implementação não equivale a aceite integral de um módulo. Os itens restantes foram retirados desses pacotes e estão na seção de pendências.

| Entrega concluída | Autoria / referência | Evidência e limite |
| --- | --- | --- |
| **BE-01 — Restaurar compilação do login** | `88731577` | Consulta de usuário/sqlc e identificadores corrigidos; `go vet` registrado em 08/11. Não repetir como tarefa de implementação. |
| **BE-04 — Catálogo HTTP básico autenticado** | `88731577` | Lista paginada/total, detalhe, POST e PUT; isolamento por usuário e `404`. Homologação final em ENT-07. |
| **FE-01 — Implementar login relativo e proxy** | Caio, `f4013d63` e incrementos | `/api/login`, confirmação de sessão, validações e bloqueio de repetição. Casos restantes em ENT-02/07. |
| **FE-03 — Implementar sessão, guard, interceptor e logout** | Caio, `f4013d63` e incrementos | Consulta de sessão, indisponibilidade, troca de conta e proteção contra respostas atrasadas. Logout remove cookie; não revoga JWT copiado. |
| **FE-04 — Implementar lista de produtos** | Leticia, `47ee5b7b` | Tabela, BRL, paginação, vazio/erro/retry e rotas/menu; testes próprios e recuperação de página vazia adicionados depois. |
| **FE-05 — Implementar cadastro básico** | Leticia, `51898427` | Formulário nome/SKU/preço, POST com `201`/ID, validações e bloqueio de repetição. Cobertura restante em ENT-02. |
| **FE-06 — Implementar detalhe e edição** | Leticia, `7f0be9c0` | GET/PUT, `404`, formulário compartilhado, cancelamento e recuperação. Cobertura restante em ENT-02. |
| **FE-02 — Estrutura e identidade visual iniciais** | Leticia, `da81eb35`; Caio, `df05afe7` | Menu/rotas, logo/favicon e integração do catálogo. A antiga página `/inicio` foi substituída no commit mais recente; não reconstruí-la. |
| **QA-001/002/003 — Foco, landmarks e contraste** | `89748604` | Correções verificadas em 09/11 por Playwright/AXE. Novo visual exige validação atual em ENT-07. |
| **QA-004/005 — Recuperação da lista e limites de texto** | `89748604` | Retry para itens vazios com total positivo, inclusive página 1; trim/Unicode conforme o Go, com regressões. |
| **QA-006/007/008 — Recuperação e concorrência da edição** | `89748604` | Retry de leitura, alert/status, bloqueio de PUT duplicado e resposta tardia sem afetar outro ID. |
| **QA-009 — Ajustar ações do antigo início** | `89748604` | Entrega histórica concluída e depois substituída pela entrada direta em Produtos. Não há correção pendente dessa página removida. |
| **FE-15 — Disponibilizar ferramentas de verificação** | Caio, `52a1f522`, `44ba1d24`, `143596f5`, `89748604` | Simulador explícito de login/catálogo, verificador HTTP real, Playwright/AXE e comando global. Ferramenta pronta não significa aceite atual aprovado. |
| **FE-15/BE-15 — Executar ensaios históricos de catálogo** | Registros de 08–09/11 | HTTP real com PostgreSQL, gravação/edição e persistência após reinício da API; E2E com duas contas e `404`. A gravação ID 7 foi retomada após corrigir uma espera, sem repetir o cadastro. Não é uma nova prova da versão de 14/11. |
| **FE-01/02/04/05/06 — Atualizar interface e navegação** | Leticia, **`7da52efb`** | Login e catálogo redesenhados; validação após envio, foco no campo inválido, controle de visibilidade da senha e ações/formulários atualizados. Entrada padrão e marca apontam para `/produtos`; `/inicio` foi removido. |
| **FE-02 — Otimizar marca e usar NgOptimizedImage** | Leticia, **`7da52efb`** | PNG reduzido de **1.088.280 para 10.510 bytes**; `ngSrc` com dimensões no login/estrutura. Favicon referencia o PNG reduzido. Não manter a antiga otimização de 1 MB como pendente. |
| **FE-15 — Adaptar testes ao novo fluxo visual** | Leticia, **`7da52efb`** | Testes ajustados para Produtos e novos rótulos; regressão de foco no formulário adicionada. O relatório entregue aprovava 81 testes Angular, tipos e build; a nova verificação integrada está registrada abaixo. |
| **FE-15/BE-15 — Verificar a base atual com ambiente real** | Verificação de 14/11, rodada `20261114210628252-5b33ac2d` | 82 Angular, 8 do verificador, 5 do simulador, tipos/build, 19 HTTP reais e 26 E2E aprovados; sem skips/flaky. API/PostgreSQL e proxy reais, desktop/390 px. Nenhuma fonte/teste alterado ou produto gravado. Falhas registradas não se reproduziram; critérios adicionais de ENT-07 permanecem abertos. |

### Subentregas concluídas em 17/11

| Entrega | Evidência e limite |
| --- | --- |
| **BE-02 — Corrigir compatibilidade do banco local** | Migration de saldo/data/atributos aplicada com backup e integridade preservada; consultas antes afetadas respondem 200. Situações antigas e UNIQUE não modificadas; demais ambientes e acentuação permanecem pendentes. |
| **ENT-02 — Atualizar testes do catálogo em modais** | Seletores por nome acessível, validação associada ao campo e espera de abertura antes de Escape; testes focados e 22 E2E aprovados. Sem alterar componentes de produção ou gravar produtos. |
| **ENT-07 — Revalidar os checks atuais** | Todos os sete checks aprovados na rodada indicada no início; oito laudos AXE sem violações. Cenários adicionais e módulos externos continuam com aceite aberto. |
| **FE-04/08 — Corrigir legibilidade da grade responsiva** | QA-20261117-003-VIS-01 corrigido na grade compartilhada; regressão geométrica e capturas em sete larguras para Produtos/Anúncios, com rolagem interna e sem sobreposição de cabeçalhos. Suíte final com 26 E2E aprovados; não conclui os demais marcos do produto. |

### Evidência histórica de qualidade e limite da revisão de 14/11

**Resultado histórico em 14/11/2026: APROVADO.** `npm.cmd run test:qualidade`, com Go/PostgreSQL e Angular/proxy reais, aprovou todos os sete checks: **82 Angular, 8 do verificador, 5 do simulador, tipos, build, 19 HTTP e 26 E2E**, sem skips/flaky. Impressão `2cad5b7c702341eb47f7d3ca71cdac999a5c781c64eb9a9b40e210345a973470`; rodada `20261114210628252-5b33ac2d`. O resultado detalhado está em [QUALIDADE.md](QUALIDADE.md).

As falhas do relatório entregue em `7da52efb` **não se reproduziram no ensaio de 14/11**, com o ambiente preparado. Não foi necessária correção de produção ou de testes, nem gravação de produtos. Foram conferidos **10 laudos AXE sem violações** e capturas da lista desktop/cadastro a 390 px. A causa exata daquela execução Linux não pode ser determinada pelo resumo antigo. Tanto esse ensaio quanto o resultado de 09/11 são históricos e não validam os commits de 15–17/11.

O aceite de 14/11 cobre os cenários então existentes de acesso, catálogo, isolamento, recuperação controlada e acessibilidade. Não inclui novo POST/PUT persistido, expiração temporal do JWT, desligamento real da API na interface, ensaio integral por leitor de tela ou módulos novos. Não encerra ENT-02, ENT-07 integral ou o MVP. As mudanças recebidas justificam nova suíte sobre o código atual.

## Pendências para a apresentação — ordem de execução

São **oito tarefas com aceite ainda aberto**, algumas com implementação parcial entregue. Responsáveis da próxima etapa são propostos, sem presumir disponibilidade individual; autoria das entregas segue os commits. Samuel/Vitor continuam responsáveis pelo Go/schema. Trabalho em paralelo depende de contrato acordado e de arquivos distintos.

| ID | Tarefa concreta | Responsável proposto | Depende de | Conclusão verificável |
| --- | --- | --- | --- | --- |
| **ENT-01** | Escolher destino e fechar contrato da demonstração | Grupo; Caio/Leticia + Samuel/Vitor | Decisão do grupo | Destino acessível, campos, rotas, respostas e erros documentados; produto mínimo e regra de anúncio explicitados. |
| **ENT-02** | Adequar cobertura ao catálogo em modais e fechar lacunas | Leticia nas páginas; Caio em autenticação/integração | Catálogo atual disponível | Casos abaixo cobertos e testes focados aprovados; critérios de rotas removidas substituídos pelo fluxo atual. |
| **ENT-03** | Completar garantias da aprovação; CRUD local já implementado | Samuel/Vitor | ENT-01 para o envio | Aprovação vinculada à versão exata, acesso/validação e persistência homologados. |
| **ENT-04** | Completar envio/resultado; serviço Angular de CRUD já implementado | Caio, com revisão dos adaptadores entregues por Vitor | Contrato ENT-01/06 | Modelos/serviço local homologados; operação/envio/resultado implementados sem chamada externa no Angular. |
| **ENT-05** | Homologar lista/editor entregues e completar prévia/envio | Leticia, com revisão das páginas entregues por Vitor | ENT-03/04/06 | Rascunho reaberto, prévia/revisão e resultado da operação, além do CRUD local existente. |
| **ENT-06** | Enviar pelo Go e comprovar resposta do destino de testes | Samuel/Vitor | ENT-01/03 | Requisição aprovada recebida e correlacionada; resultado consultável, timeout/falha e repetição tratados. |
| **ENT-07** | Homologar o código de 17/11 e o fluxo completo | Caio/Leticia, apoio Samuel/Vitor | Aceite final após ENT-02–06 | Nova prova sobre o conteúdo atual; aprovação de 14/11 permanece histórica. |
| **ENT-08** | Completar ambiente, documentação e ensaio; roteiro preparado | Quatro integrantes | ENT-07 para fechar | Outra pessoa repete a demonstração; dados/backup/comandos e limites conferidos. |

### ENT-01 — Destino e contrato (FE-08/09, BE-07/08, DEC-01/02/03)

- [ ] Escolher **um destino de testes** e verificar como acessá-lo. Receptor próprio continua opção; não iniciar sua construção antes da escolha, nem construir uma plataforma comercial completa.
- [ ] Registrar contrato curto compartilhado: método/caminho, campos do rascunho, vínculo ao produto/destino, versão/aprovação, envio, consulta do resultado, sucesso e erros. Identificar campos obrigatórios e IDs de teste.
- [x] Implementar contrato local de CRUD de anúncios e listagem de marketplaces. Isso não define o destino externo, a operação de envio ou o aceite humano do contrato completo.
- [ ] Confirmar se nome/SKU/preço atuais atendem ao produto mínimo e quais dados adicionais pertencem ao anúncio. Preservar isolamento atual por usuário até decisão explícita sobre catálogo compartilhado.
- [ ] Definir a regra mínima de anúncio por produto/destino e a recuperação após resposta perdida. Não impor unicidade por canal apenas por causa do protótipo.

**Termina quando:** front e back conseguem implementar o mesmo exemplo de requisição/resposta, com destino escolhido e decisões confirmadas registradas com data e condições. Proposta não confirmada continua aberta. **Bloqueia o envio mínimo enquanto não resolvida.**

### ENT-02 — Complementos de cobertura (FE-01/05/06)

- [ ] Cadastro: resposta `200` ou `201` sem ID não confirma criação/navega; `201` com ID confirma. Testar falha com valores realmente digitados preservados e nova tentativa.
- [ ] Edição: homologar preservação dos controles reais após `500` e nova tentativa. Há E2E escrito com campos reais; o teste unitário do modal apenas emite o evento de salvar e confere a mensagem, sem provar preservação. Nenhum desses testes foi executado nesta revisão.
- [ ] Edição em modal: conferir produto selecionado, dados atuais após reabrir, `404`, cancelamento e resposta de PUT pendente ao fechar/destruir. GET por ID no editor e troca de ID pela rota antiga deixaram de ser o fluxo atual; não cobrar a implementação de páginas removidas. O teste unitário mantém cobertura escrita de PUT duplicado.
- [ ] Novo login/formulário: conferir erros após submissão, foco no primeiro campo inválido, limites de senha e controle de mostrar/ocultar senha por teclado, sem envio acidental.

**Termina quando:** cada risco listado tem evidência pertinente e os testes focados passam. A verificação no navegador e a persistência ficam em ENT-07; testes controlados não as substituem.

### ENT-03 — Anúncio persistido e aprovado (BE-07; FE-08/09)

- [x] Expor criação, listagem/consulta, edição e exclusão local de anúncios, com produto/canal, conteúdo e situação. Há rotas/controllers/services e bloqueios para situações não editáveis.
- [x] Implementar persistência e consulta via SQL/sqlc, com isolamento pelo usuário do produto. Reabertura com o banco real ainda precisa de homologação.
- [ ] Validar campos no servidor e registrar autor/versão/conteúdo aprovado. Alteração posterior não reutiliza aprovação antiga.
- [ ] Rejeitar envio sem aprovação válida. Não representar uma tabela/seed como API pronta.

**Termina quando:** contrato implementado e verificado com banco, reabertura e rejeição de acesso/envio inválidos. Entrega somente do rascunho não conclui envio ao destino (ENT-06).

### ENT-04 — Serviços e coordenação no Angular (Caio; FE-08/09)

- [x] Criar modelos e métodos HTTP de lista/consulta/cadastro/edição/exclusão e canais. Rascunho/aprovado são enviados no campo de situação do CRUD local.
- [ ] Acrescentar coordenação e métodos de operação/envio/resultado após contrato de ENT-01/06; eles não existem no serviço atual.
- [ ] Combinar entradas/saídas dos componentes com Leticia; manter modelos e serviços compartilhados, sem duplicação de chamadas.
- [ ] Coordenar revisão/operação, impedir repetição durante processamento e consultar resultado desconhecido antes de oferecer novo envio. Falha real não troca para simulação.

**Termina quando:** testes de contrato/estados passam e os métodos operam com a API entregue. Mock isolado conclui só a parte controlada; integração continua aberta até ENT-07.

### ENT-05 — Lista, editor e prévia (Leticia; FE-08/09)

- [x] Implementar lista, abertura/cadastro/edição em modal, seleção de produto/canal, filtros locais, carregando/vazio/erro/nova tentativa e exclusão permitida. Confirmar a execução com API/banco no aceite.
- [ ] Editar os campos acordados, salvar/reabrir e preservar texto em falha; escrita manual deve funcionar sem Gemini.
- [ ] Mostrar conteúdo/preço/destino na prévia e exigir ação humana explícita de aprovação/envio; mudança invalida a aprovação conforme o servidor.
- [ ] Mostrar resposta/identificador de teste correlacionados ao anúncio; processamento não é sucesso final e falha não é publicação.

**Termina quando:** páginas integradas à API atendem aos casos acima; teclado, foco e 390 px são verificados em ENT-07. Fotos/IA não são dependência automática do editor mínimo.

### ENT-06 — Envio e retorno verificáveis (BE-08; BE-07/15)

- [ ] Implementar envio do conteúdo aprovado pelo Go ao destino escolhido. Se houver receptor próprio, limitar sua entrega a receber/validar/responder o contrato de teste.
- [ ] Correlacionar anúncio/revisão, operação, recebimento e resposta; disponibilizar resultado para consulta pela interface.
- [ ] Tratar sucesso, rejeição, indisponibilidade e timeout. Se o recebimento ocorreu e a resposta se perdeu, consultar/reconciliar antes de repetir criação.
- [ ] Garantir proteção no servidor contra duplo envio; botão desabilitado no Angular sozinho não atende ao critério.

**Termina quando:** há prova de recebimento e retorno, mais cenário de falha e repetição segura, sem qualquer alegação de publicação comercial.

### ENT-07 — Homologação e qualidade (FE-15/BE-15)

**Prova atual de 17/11: APROVADO**, após correção local do banco, testes desatualizados e grade responsiva, com execução e limites descritos no início da fila. A aprovação de 14/11 permanece histórica. QA-20261117-003-VIS-01 foi encerrado no recorte reproduzido; os critérios adicionais abaixo não são encerrados pela suíte verde.

- [ ] Repetir o catálogo atual: login inválido/válido → `/produtos` → cadastrar em modal → lista → editar em modal → F5 → sair → bloquear retorno → entrar com outra conta e confirmar isolamento. Testar `404` do produto alheio diretamente na API; não exigir página de detalhe removida.
- [ ] Confirmar persistência após reinício da API. Gravação QA é explícita e limitada; reutilizar registros adequados, sem criar massa só para paginação. A suíte padrão não grava produtos.
- [ ] Exercitar paginação com amostra adequada e catálogo vazio; falha/recuperação de logout e indisponibilidade real da API na interface. Combinar interrupção controlada dos serviços; não desligar aplicações de outra pessoa.
- [ ] Verificar expiração temporal do JWT em ambiente controlado pelo back-end. Remover cookie ou encurtar sessão apenas no simulador não comprova esse caso no Go.
- [ ] Repetir produto → anúncio salvo/reaberto → revisão → aprovação → envio → resposta; incluir rejeição, clique duplo, edição após aprovação e timeout/resultado desconhecido sem duplicar envio.
- [ ] Conferir teclado, foco, leitura por leitor de tela e largura de 390 px; executar AXE em login/catálogo e novas páginas, inclusive erros/validação. Não excluir regras para passar.
- [ ] Executar `npm.cmd run test:qualidade` em `web/` sobre o conteúdo final com ambiente real; registrar hash/rodada, resultados e limitações. Executar verificações pertinentes do Go com Samuel/Vitor. `test:qualidade:conferir` verifica prova existente; não substitui a execução ausente.

**Termina quando:** todos os critérios do recorte têm evidência atual, verificações obrigatórias aprovadas e revisão cruzada. Falha ou ambiente bloqueado mantém a tarefa aberta. Havendo correção de produto, aplicar reprodução e revalidação independentes; não reduzir cobertura/AXE. Não repetir suíte aprovada sem mudança ou motivo concreto.

### ENT-08 — Preparação e ensaio (FE-15/BE-15)

- [x] Preparar roteiro para as falas de front-end, com tempos e limites do que está implementado. Isso não substitui ensaio, ambiente pronto ou revisão acadêmica completa.
- [ ] Escolher o computador da demonstração, conferir contas fictícias/produto/anúncio e destino acessível; manter segredos fora dos documentos.
- [ ] Registrar comandos de subir/verificar os serviços, preparar backup de dados relevantes e conferir recuperação sem sobrescrever o banco em uso.
- [ ] Atualizar o guia técnico [README.md](README.md) para `/produtos` e o fluxo final. O guia ainda cita `/inicio`; manter o acompanhamento somente nesta fila. README da raiz continua apresentação/instalação, sem status ou divisão de tarefas.
- [ ] Alinhar roteiro e afirmações da apresentação/documentação acadêmica: o que usa Go/PostgreSQL real, qual destino é de teste e o que segue futuro. Não relatar métricas ou publicações comerciais não verificadas.
- [ ] Ensaiar com os quatro integrantes e repetir o fluxo por quem não implementou a parte; incluir mensagem de falha e recuperação. Preparar registro local da execução como apoio, identificado como evidência anterior.

**Termina quando:** execução repetível no computador escolhido e roteiro coerente com a versão aprovada. Gravação/captura anterior não substitui aceite do fluxo atual.

## Agenda histórica proposta em 14/11

A ordem é uma recomendação de execução, **sem confirmação individual de disponibilidade ou garantia de prazo**.

| Quando | Trabalho e resultado esperado |
| --- | --- |
| **14/11** | Fechar ENT-01; Leticia/Caio concluem ENT-02 e iniciam diagnóstico de ENT-07. Samuel/Vitor começam ENT-03/06; Caio/Leticia combinam interfaces de ENT-04/05 após contrato. |
| **15/11** | Unir ENT-03/04/05/06 com destino acessível. Encerrar o dia com um anúncio aprovado, requisição recebida e resposta visível; tratar falhas do fluxo. |
| **16/11** | Encerrar ENT-07 sobre a versão final e ENT-08 com ensaio/recuperação e documentação coerente. Corrigir somente o que impedir o aceite. |
| **17/11 — apresentação** | Conferir serviços/destino/dados e executar o roteiro validado. Evitar estrear funcionalidades sem verificação. |

Se ENT-01 ou o envio pelo Go continuarem bloqueados, registrar imediatamente a dependência e o impacto: a demonstração de catálogo sozinha permanece uma entrega parcial. O prazo não transforma pendência em conclusão.

## Evolução posterior — pendências preservadas

Os itens abaixo **não estão concluídos**. Não competem com o recorte mínimo, salvo dependência explicitada em ENT-01. Os critérios são do produto completo; subentregas de testes em ENT-03–06 não encerram automaticamente FE-08/09/13 ou BE-07/08 integrais.

### Front-end por tarefa original

| ID e referência | Próxima tarefa delimitada / responsável | Dependência | Critério para conclusão integral |
| --- | --- | --- | --- |
| **FE-01 — Login (RF01)** | Caio: fechar ENT-02/07 para login atual. | BE-02/03/15 | Uma requisição válida, inválido não envia, erros distintos, cookie/sessão pelo proxy, foco/teclado e falhas verificados. Implementação movida para concluídas. |
| **FE-02 — Estrutura** | Caio/Leticia: aceitar navegação atual em ENT-07 e alinhar guias em ENT-08. | FE-03/15 | Rotas de lista/anúncios/indicadores/administração e recarga; cadastro/edição em modais, rota inválida recuperável, sessão/menu/saída a 390 px e por teclado. Não reconstruir as rotas antigas de detalhe/edição. |
| **FE-03 — Sessão** | Caio: homologar falha de logout/indisponibilidade e expiração temporal em ENT-07. | BE-03/15 | `200`/`401`/falha sem loops; acesso anônimo sem dados, F5, troca de conta e saída; sem leitura/persistência de JWT no Angular ou promessa de revogação. |
| **FE-04 — Lista (RF03)** | Leticia: homologar grade, exclusão e saldo atuais em ENT-07. | BE-04/11/15 | Paginação/total/vazio/retry; valores após gravar/excluir/entrada; saldo/data, isolamento, acessibilidade e bloqueio de exclusão com anúncios (`409`). Busca remota e canais por produto ainda ausentes. |
| **FE-05 — Cadastro (RF02)** | Leticia: concluir ENT-02/07; ampliar cadastro apenas após DEC-02. | BE-05/DEC-02 para ampliação | `201`/ID, erro sem perda de campos, validações contratuais e persistência após F5. Cadastro básico pode ser aceito separadamente do cadastro ampliado. |
| **FE-06 — Edição (RF04)** | Leticia: homologar modal em ENT-02/07; conflitos/campos adicionais após contrato. | BE-05 para ampliação | Modal recebe o produto da lista; PUT/`404`, cancelar sem gravar, preservar campos em falha, reabrir dados corretos e persistir após F5. Página de detalhe e método Angular `consultar` foram removidos; GET por ID continua na API. |
| **FE-07 — Dados/fotos** | Leticia: seleção/prévia; Caio: serviço de upload/tratamento. | BE-05/06, DEC-02 | Campos aprovados persistem; foto real selecionada/enviando/salva/erro, reaberta após salvar; limites da API, original/versão tratada e aprovação distinguíveis. Prévia local é só subentrega. |
| **FE-08 — Gestão de anúncios (RF05)** | Lista/serviço/filtros locais/modal/exclusão entregues; Leticia/Caio revisam a implementação de Vitor e homologam ENT-05/07. | BE-07/08/15 | Confirmar produto/canal, filtros, abertura/erros e ações permitidas com API/banco; refletir operação externa quando existir. Filtros atuais são locais sobre a resposta, sem paginação remota de anúncios. |
| **FE-09 — Editor/IA/publicação (RF06)** | Editor manual, rascunho e ação de aprovação local entregues; Leticia/Caio completam prévia/coordenação/IA após contratos. | BE-06/07/08/09, DEC-03 | Reabrir/preservar texto; revisão estável da versão exata e repetição/timeout seguros ainda pendentes. Aprovar hoje grava situação; não há envio, resultado externo, Gemini ou fotos. |
| **FE-10 — Pedidos (RF07)** | Leticia: lista/detalhe; Caio: serviço/modelo. | BE-10; DEC-01 para escritas | Consulta real com itens/filtros/paginação, origem/atualização e falha parcial/total; vazio não encobre indisponibilidade. Não calcular estoque no Angular. |
| **FE-11 — Estoque (RF08)** | Saldo/data e entrada manual entregues em Produtos; Leticia/Caio homologam esse recorte. | BE-11, DEC-01 | Validar consulta/entrada/erros; distinguir saldo local de saldo por canal. Divergências, movimentos, sincronização, repetição e cancelamentos operacionais seguem pendentes. Não recriar a tela separada removida. |
| **FE-12 — Indicadores (RF09/10)** | Tela de Leticia e API/serviço entregues; homologar período, totais/taxa, barras/tabela e falhas. | BE-12/15 | Amostra confere com métricas do banco; zero/vazio/falha e leitura acessível. Fonte/atualização externas ainda não implementadas; dados de seed não são medição comercial. |
| **FE-13 — Administração/canais** | Conta nome/e-mail/senha e resumo de canais entregues; Leticia/Caio homologam persistência/erros e mantêm preferências/conexões como etapas futuras. | BE-08/11/13/15 | Aceitar conta separadamente de preferências e conexão/reconexão. Atualizar sessão após conta salva; nenhuma gestão de perfis criada. Resumo de canais não é conta externa conectada. |
| **FE-14 — Recuperação (RF12)** | Leticia: solicitação/redefinição; Caio: serviço. | BE-14 | Entrega real das instruções, token inválido/expirado/usado, confirmação de senha e recuperação. Senha nova permite login conforme servidor; sem registrar token/senha no navegador/log. |
| **FE-15 — Aceite por marcos** | Caio/Leticia: ENT-07/08 agora; integração comercial/operação posteriormente. | BE-15 e módulos envolvidos | Aceitar separadamente catálogo, envio em testes, publicação real e operação. Suíte verde de um marco não conclui os demais nem todo o produto. |

### Back-end — pedidos concretos para Samuel/Vitor

Não implementar Go/schema como parte de uma tarefa de front. BE-01 e BE-04 foram movidos para concluídas; as partes entregues de itens parciais não precisam ser refeitas.

| ID | Trabalho restante | Critério para encerrar |
| --- | --- | --- |
| **BE-02 — Ambiente/carga (parcial)** | Estrutura local corrigida por migration e integração revalidada, sem perda dos dados anteriores. Confirmar demais ambientes; investigação anterior de UTF-8 do seed permanece separada. | Repetir a atualização adequada em cada ambiente autorizado e diagnosticar a acentuação com segurança. Não recarregar seed automaticamente nem converter texto no Angular. |
| **BE-03 — Sessão (parcial)** | Apoiar ENT-07 e decidir necessidade de revogação de JWT. | Expiração real/falhas verificadas e limite do logout explicitado. Middleware/consulta/remoção do cookie já existem; não exigir migração de mecanismo por suposição. |
| **BE-05 — Produto ampliado (parcial)** | Fechar DEC-02; unicidade de SKU no domínio aprovado, versão de edição/conflitos e campos adicionais acordados. | Restrições/persistência e respostas verificadas com banco e contrato entregue ao front. Validações atuais de nome/SKU/preço já existem. |
| **BE-06 — Fotos/tratamento** | Upload, consulta/vínculo e limites; versões/original e falhas. | Arquivo validado e reaberto no produto/anúncio; limites e erros acordados. Foto real e aprovação da prévia preservadas. |
| **BE-07 — Anúncios (parcial)** | CRUD local e validação de rascunho/aprovado entregues; completar revisão estável, autor/versão e coordenação da operação. | Homologar reabertura/acesso/erros; aprovação exata e resultado externo continuam pendentes. Estado aprovado atual é mutável. |
| **BE-08 — Destino/conector** | ENT-01/06 agora; OAuth/conexão/reconexão e conector real futuramente. | Recebimento/resposta no destino de teste encerra só essa subentrega. Conector real exige conta autorizada, capacidades e publicação/atualização verificáveis. |
| **BE-09 — IA** | Contrato de sugestão título/descrição, limites e erros/quota. | Gemini chamado pelo Go, sugestão editável; falha mantém edição manual. Chaves não chegam ao Angular. |
| **BE-10 — Pedidos** | Fonte, listagem/detalhe, filtros/paginação, vínculos e situações. | Consulta real com origem/atualização/falha; comandos RF11 somente após especificação segura em DEC-01. |
| **BE-11 — Estoque (parcial)** | Consulta de saldo e entrada por incremento SQL atômico entregues; faltam histórico/movimentos, idempotência e operação por canal. | Validar entrada/persistência/acesso; repetição, eventos atrasados, cancelamentos e sincronização seguem abertos. Incremento local não prova consistência entre canais. |
| **BE-12 — Indicadores (parcial)** | GET mensal e agregação por anúncio entregues; homologar datas, totais e origem. | Amostra no banco conferida, indisponibilidade diferente de zero; coleta externa/atualização continuam pendentes. Seed não é dado de canal. |
| **BE-13 — Conta/preferências (parcial)** | PUT de nome/e-mail e senha com bcrypt/senha atual entregues; homologar persistência, conflitos e erros. Preferências não expostas. | Consulta/gravação verificadas sem hashes/credenciais nas respostas. Troca autenticada de senha não substitui recuperação. |
| **BE-14 — Recuperação** | Mecanismo de entrega, emissão/expiração/uso único e redefinição. | Fluxo real validado, erros seguros e nova senha utilizável, sem reutilização indevida do token. |
| **BE-15 — Homologação (parcial)** | ENT-07/08 com front; cenários próprios do Go/PostgreSQL e marcos futuros. | Provas atuais por incremento, contratos/erros e recuperação conferidos. Não existem testes Go versionados nesta base; testes Angular controlados não substituem API/banco. Reinício do PostgreSQL permanece cenário adicional a planejar. |

### Decisões pendentes

- **DEC-01:** recorte inicial em testes está confirmado; falta escolher destino/contrato em ENT-01. RF11 e operação futura continuam abertos: fonte/estados, aplicação única, concorrência e recuperação antes de movimentos reais.
- **DEC-02:** confirmar produto mínimo para a demonstração e campos do incremento; definir posteriormente catálogo compartilhado e domínio de SKU/versão. O código atual isola por usuário; não mudar sem decisão. ENT-01 deve separar o mínimo aceito da ampliação futura.
- **DEC-03:** o schema atual implementa unicidade `(id_produto, id_marketplace)`, e o editor bloqueia o canal já ocupado. Isso confirma o comportamento entregue, sem comprovar decisão humana sobre a restrição comercial. Confirmar a política em ENT-01 antes de tratá-la como encerrada; suporte a canais externos continua pendente.

## Contrato básico já disponível

Consultar [guia técnico](README.md) e código antes de integrar. Cookie `sessao` é HttpOnly; JWT não é lido ou salvo pelo Angular. Produtos usam o usuário da sessão, sem `id_usuario` no formulário.

O serviço Angular de produtos disponibiliza `listar(pagina, limite)`, `cadastrar(dados)`, `atualizar(id, dados)` e `excluir(id)`. `consultar(id)` foi removido do Angular com a mudança para modais; o endpoint GET por ID permanece na API. O serviço adapta o JSON para os nomes internos, sem cache ou fallback simulado.

| Operação | Contrato atual |
| --- | --- |
| Entrar / consultar / sair | `POST /api/login` com `email`/`password`; `GET /api/sessao` com ID/e-mail; `POST /api/logout` remove cookie. |
| Lista | `GET /api/produtos?pagina=1&limite=20` → `{items,total}`; cada item inclui `id,name,sku,basePrice,stock,stockUpdatedAt`; limite entre 1 e 100. |
| Detalhe | `GET /api/produtos/{id}` → `{id,name,sku,basePrice}`. |
| Cadastro | `POST /api/produtos` com `{name,sku,basePrice}` → `201`/ID. |
| Edição | `PUT /api/produtos/{id}` com os três campos → `200`/success/message. |
| Exclusão | `DELETE /api/produtos/{id}`, autenticado → `200`/success/message (`Produto excluído`); `409` quando o produto possui anúncios. |
| Saldo/entrada | `GET /api/estoque`; `POST /api/estoque/{id}/entradas` com `{quantity}` → saldo; quantidade inteira de 1 a 100.000. |
| Anúncios/canais | `GET/POST /api/anuncios`; `GET/PUT/DELETE /api/anuncios/{id}`; `GET /api/marketplaces`. CRUD local, sem envio externo. |
| Conta/senha | `PUT /api/conta` e `PUT /api/conta/senha`; sessão retorna também `nome`. |
| Indicadores | `GET /api/indicadores?mes=YYYY-MM`; métricas do banco por anúncio no mês. |

Preço é número decimal JSON, não centavos/string BRL: maior que zero, menor que 100.000.000 e até duas casas. Nome/SKU após trim têm limites de 255/100 caracteres Unicode. Paginação começa em 1; ordem/total vêm da API. Erros básicos: `400`, `401`, `404`, `500`, com `success`/`message`. A exclusão é física e bloqueada pela FK de `CAD_ANUNCIO` quando há anúncios, com resposta `409`; não há `409` de SKU/versão. Não existem busca remota, campos completos ou fotos no contrato básico aqui registrado. Simulador de desenvolvimento é explícito e não substitui integração.

## Regras de execução e atualização da fila

- Respeitar Angular standalone, OnPush, signals, formulários reativos, rotas sob demanda e tipos sem `any`; usar os protótipos como referência e contratos reais como limite das operações.
- Caio mantém infraestrutura, autenticação, contratos/modelos/serviços e coordenação externa. Leticia mantém suas páginas, formulários, estados e testes; combinar mudanças de rotas/composição/arquivos compartilhados. A revisão dos commits preserva a autoria efetiva mesmo quando uma entrega atravessa a divisão proposta.
- Interface/controlado, API real, navegador e destino externo têm evidências distintas. Nenhum fallback silencioso, endpoint presumido, segredo no front ou publicação sem aprovação humana.
- Para concluir uma pendência, registrar versão, ambiente, cenário e resultado. Mover a entrega efetivamente aceita para **Tarefas concluídas**; desmembrar o restante com responsável e dependência. Código entregue com homologação aberta deve continuar com essa distinção.
- A lista acima substitui as matrizes e narrativas antigas que ainda cobravam foco/contraste/limites já corrigidos ou o retorno a `/inicio`. O histórico completo permanece no Git; não duplicar uma segunda fila em outros documentos.
- Sugestões de commit em Conventional Commits e português; commit/push dependem de pedido aplicável. Esta revisão organiza trabalho e não implementa as tarefas ENT.
