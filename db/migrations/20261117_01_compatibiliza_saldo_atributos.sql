BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.cad_produto
    ADD COLUMN saldo integer NOT NULL DEFAULT 0,
    ADD COLUMN saldo_atualizado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD CONSTRAINT cad_produto_saldo_check CHECK (saldo >= 0);

ALTER TABLE public.cad_anuncio
    ADD COLUMN atributos_canal jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
