-- name: GetUserByEmail :one
SELECT id, senha_hash FROM CAD_USUARIO WHERE email = $1;
