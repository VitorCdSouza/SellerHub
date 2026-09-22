CREATE TABLE usuarios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email varchar(254) NOT NULL UNIQUE,
    senha_hash text NOT NULL,
    CONSTRAINT email_normalizado CHECK (email = lower(btrim(email)))
);
