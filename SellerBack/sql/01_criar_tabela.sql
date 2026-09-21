CREATE TABLE IF NOT EXISTS users (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email varchar(254) NOT NULL UNIQUE,
    password text NOT NULL,
    CONSTRAINT email_normalizado CHECK (email = lower(btrim(email)))
);

COMMENT ON COLUMN users.password IS 'Hash bcrypt; nunca armazenar a senha em texto puro.';
