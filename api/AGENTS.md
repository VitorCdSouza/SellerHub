# SellerHub — orientações compartilhadas do back-end

Antes de planejar ou alterar comportamento da API, leia o [guia de contribuição](../CONTRIBUTING.md) e as [decisões de produto e arquitetura](../documentacao/DECISOES.md). Elas se aplicam também a regras de negócio, persistência e integrações; não são decisões exclusivas do front-end.

Confira o [recorte da primeira entrega em DEC-01](../documentacao/DECISOES.md#dec-01--pedidos-e-estoque): produto → anúncio → chamada a destino de teste. Integração real e comando manual RF11 ficam para evolução, com os controles necessários. Um marketplace próprio de teste continua em avaliação. Não exigir Mercado Livre real para esta demonstração, remover RF11 ou apresentar teste como integração comercial concluída.

Use os itens BE da [fila de execução](../web/TODO.md) para contratos, dependências e critérios de homologação. Garantias de saldo, repetição, concorrência e estados atrasados pertencem ao servidor; a ausência de um botão na interface não dispensa essas garantias. Propostas não comprovam API implementada.

Registre a deliberação e suas condições no documento central, com referências na fila. Preserve dados privados e credenciais fora de arquivos versionados.
