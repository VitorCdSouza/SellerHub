# SellerHub — orientações compartilhadas do back-end

Antes de planejar ou alterar comportamento da API, leia o [guia de contribuição](../CONTRIBUTING.md) e as [decisões de produto e arquitetura](../documentacao/DECISOES.md). Elas se aplicam também a regras de negócio, persistência e integrações; não são decisões exclusivas do front-end.

Antes de trabalhar em pedidos, cancelamento ou estoque, confira o estado de [DEC-01](../documentacao/DECISOES.md#dec-01--pedidos-e-estoque). O adiamento do comando manual de RF11 ainda depende de deliberação conjunta. Não remover o requisito, considerá-lo concluído ou presumir aprovação dos colegas.

Use os itens BE da [fila de execução](../web/TODO.md) para contratos, dependências e critérios de homologação. Garantias de saldo, repetição, concorrência e estados atrasados pertencem ao servidor; a ausência de um botão na interface não dispensa essas garantias. Propostas não comprovam API implementada.

Registre a deliberação e suas condições no documento central, com referências na fila. Preserve dados privados e credenciais fora de arquivos versionados.
