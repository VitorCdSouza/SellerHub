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