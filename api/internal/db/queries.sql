-- name: GetUserByEmail :one
SELECT id_usuario, senha_hash
FROM CAD_USUARIO
WHERE email = $1;

-- name: GetUserById :one
SELECT id_usuario, email
FROM CAD_USUARIO
WHERE id_usuario = $1;

-- name: ListProdutos :many
SELECT id_produto, nome_produto, sku, preco_base 
FROM CAD_PRODUTO 
WHERE id_usuario = $1 
ORDER BY nome_produto, id_produto
LIMIT $2 OFFSET $3;

-- name: CountProdutos :one
SELECT COUNT(*)
FROM CAD_PRODUTO
WHERE id_usuario = $1;

-- name: GetProdutoById :one
SELECT * 
FROM CAD_PRODUTO 
WHERE id_produto = $1 AND id_usuario = $2;

-- name: CreateProduto :one
INSERT INTO CAD_PRODUTO (
    id_usuario, sku, nome_produto, preco_base
) VALUES (
    $1, $2, $3, $4
) RETURNING id_produto;

-- name: UpdateProduto :execrows
UPDATE CAD_PRODUTO
SET sku = $3,
    nome_produto = $4,
    preco_base = $5
WHERE id_produto = $1 AND id_usuario = $2;

-- name: ListAnuncios :many
SELECT
    a.id_anuncio,
    a.id_marketplace,
    m.nome_marketplace,
    a.id_produto,
    p.nome_produto,
    p.sku,
    a.titulo_anuncio,
    a.preco_venda,
    a.id_externo_mp,
    a.status_campo
FROM CAD_ANUNCIO a
INNER JOIN CAD_PRODUTO p ON p.id_produto = a.id_produto
INNER JOIN CAD_MARKETPLACE m ON m.id_marketplace = a.id_marketplace
WHERE p.id_usuario = $1
ORDER BY a.titulo_anuncio, a.id_anuncio
LIMIT $2 OFFSET $3;

-- name: CountAnuncios :one
SELECT COUNT(*)
FROM CAD_ANUNCIO a
INNER JOIN CAD_PRODUTO p ON p.id_produto = a.id_produto
WHERE p.id_usuario = $1;

-- name: GetAnuncioById :one
SELECT
    a.id_anuncio,
    a.id_marketplace,
    m.nome_marketplace,
    a.id_produto,
    p.nome_produto,
    a.titulo_anuncio,
    a.descricao_anuncio,
    a.preco_venda,
    a.id_externo_mp,
    a.status_campo
FROM CAD_ANUNCIO a
INNER JOIN CAD_PRODUTO p ON p.id_produto = a.id_produto
INNER JOIN CAD_MARKETPLACE m ON m.id_marketplace = a.id_marketplace
WHERE a.id_anuncio = $1 AND p.id_usuario = $2;

-- name: CreateAnuncio :one
INSERT INTO CAD_ANUNCIO (
    id_marketplace,
    id_produto,
    titulo_anuncio,
    descricao_anuncio,
    preco_venda,
    id_externo_mp,
    status_campo
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING id_anuncio;

-- name: UpdateAnuncio :execrows
UPDATE CAD_ANUNCIO a
SET id_marketplace = $3,
    titulo_anuncio = $4,
    descricao_anuncio = $5,
    preco_venda = $6,
    id_externo_mp = $7,
    status_campo = $8
FROM CAD_PRODUTO p
WHERE a.id_produto = p.id_produto
  AND a.id_anuncio = $1
  AND p.id_usuario = $2;

-- name: DeleteAnuncio :execrows
DELETE FROM CAD_ANUNCIO a
USING CAD_PRODUTO p
WHERE a.id_produto = p.id_produto
  AND a.id_anuncio = $1
  AND p.id_usuario = $2;

  -- name: ListMarketplaces :many
SELECT
    id_marketplace,
    nome_marketplace,
    taxa_comissao
FROM CAD_MARKETPLACE
ORDER BY nome_marketplace, id_marketplace;

-- name: ListMarketplacesComResumo :many
SELECT
    m.id_marketplace,
    m.nome_marketplace,
    m.taxa_comissao,
    COUNT(a.id_anuncio) AS total_anuncios
FROM CAD_MARKETPLACE m
LEFT JOIN CAD_ANUNCIO a ON a.id_marketplace = m.id_marketplace
LEFT JOIN CAD_PRODUTO p ON p.id_produto = a.id_produto AND p.id_usuario = $1
GROUP BY m.id_marketplace, m.nome_marketplace, m.taxa_comissao
ORDER BY m.nome_marketplace, m.id_marketplace;

-- name: GetMarketplaceById :one
SELECT
    id_marketplace,
    nome_marketplace,
    taxa_comissao
FROM CAD_MARKETPLACE
WHERE id_marketplace = $1;

-- name: CreateMarketplace :one
INSERT INTO CAD_MARKETPLACE (
    nome_marketplace,
    taxa_comissao
) VALUES (
    $1, $2
) RETURNING id_marketplace;

-- name: UpdateMarketplace :execrows
UPDATE CAD_MARKETPLACE
SET nome_marketplace = $2,
    taxa_comissao = $3
WHERE id_marketplace = $1;

-- name: GetResumoMetricasUsuario :one
SELECT
    COUNT(DISTINCT a.id_anuncio) AS total_anuncios,
    COALESCE(SUM(h.visualizacoes), 0)::bigint AS total_visualizacoes,
    COALESCE(SUM(h.conversoes), 0)::bigint AS total_conversoes
FROM CAD_PRODUTO p
INNER JOIN CAD_ANUNCIO a ON a.id_produto = p.id_produto
LEFT JOIN HIST_METRICA_ANUNCIO h
    ON h.id_anuncio = a.id_anuncio
   AND h.data_referencia BETWEEN $2 AND $3
WHERE p.id_usuario = $1;

-- name: ListMetricasPorAnuncio :many
SELECT
    a.id_anuncio,
    a.titulo_anuncio,
    m.nome_marketplace,
    a.status_campo,
    COALESCE(SUM(h.visualizacoes), 0)::bigint AS total_visualizacoes,
    COALESCE(SUM(h.conversoes), 0)::bigint AS total_conversoes
FROM CAD_ANUNCIO a
INNER JOIN CAD_PRODUTO p ON p.id_produto = a.id_produto
INNER JOIN CAD_MARKETPLACE m ON m.id_marketplace = a.id_marketplace
LEFT JOIN HIST_METRICA_ANUNCIO h ON h.id_anuncio = a.id_anuncio
WHERE p.id_usuario = $1
GROUP BY a.id_anuncio, a.titulo_anuncio, m.nome_marketplace, a.status_campo
ORDER BY total_conversoes DESC, total_visualizacoes DESC;

-- name: ListMetricasPorDia :many
SELECT
    h.data_referencia,
    COALESCE(SUM(h.visualizacoes), 0)::bigint AS visualizacoes,
    COALESCE(SUM(h.conversoes), 0)::bigint AS conversoes
FROM HIST_METRICA_ANUNCIO h
INNER JOIN CAD_ANUNCIO a ON a.id_anuncio = h.id_anuncio
INNER JOIN CAD_PRODUTO p ON p.id_produto = a.id_produto
WHERE p.id_usuario = $1
  AND h.data_referencia BETWEEN $2 AND $3
GROUP BY h.data_referencia
ORDER BY h.data_referencia ASC;

-- name: CreateMetricaAnuncio :one
INSERT INTO HIST_METRICA_ANUNCIO (
    id_anuncio,
    data_referencia,
    visualizacoes,
    conversoes
) VALUES (
    $1, $2, $3, $4
) RETURNING id_metrica;

-- name: ListUsuarios :many
SELECT
    u.id_usuario,
    u.id_pessoa,
    p.nome,
    p.cpf_cnpj,
    p.tipo_pessoa,
    u.login_campo,
    u.email
FROM CAD_USUARIO u
INNER JOIN CAD_PESSOA p ON p.ID_pessoa = u.id_pessoa
ORDER BY p.nome, u.id_usuario
LIMIT $1 OFFSET $2;

-- name: CountUsuarios :one
SELECT COUNT(*)
FROM CAD_USUARIO;

-- name: CreatePessoa :one
INSERT INTO CAD_PESSOA (
    nome,
    cpf_cnpj,
    tipo_pessoa
) VALUES (
    $1, $2, $3
) RETURNING ID_pessoa;

-- name: CreateUsuario :one
INSERT INTO CAD_USUARIO (
    id_pessoa,
    login_campo,
    senha_hash,
    email
) VALUES (
    $1, $2, $3, $4
) RETURNING id_usuario;

-- name: UpdateUsuario :execrows
UPDATE CAD_USUARIO
SET login_campo = $2,
    email = $3
WHERE id_usuario = $1;

-- name: ListAuditoria :many
SELECT
    aud.id_auditoria,
    aud.id_usuario,
    u.login_campo,
    u.email,
    aud.acao,
    aud.tabela_afetada,
    aud.data_hora
FROM CAD_AUDITORIA aud
INNER JOIN CAD_USUARIO u ON u.id_usuario = aud.id_usuario
ORDER BY aud.data_hora DESC, aud.id_auditoria DESC
LIMIT $1 OFFSET $2;

-- name: CountAuditoria :one
SELECT COUNT(*)
FROM CAD_AUDITORIA;

-- name: CreateAuditoria :one
INSERT INTO CAD_AUDITORIA (
    id_usuario,
    acao,
    tabela_afetada
) VALUES (
    $1, $2, $3
) RETURNING id_auditoria;