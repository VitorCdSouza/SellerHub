-- name: GetPasswordHash :one
SELECT senha_hash FROM CAD_USUARIO WHERE email = $1;
