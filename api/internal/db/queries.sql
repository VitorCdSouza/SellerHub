-- name: GetPasswordHash :one
SELECT senha_hash FROM usuarios WHERE email = $1;
