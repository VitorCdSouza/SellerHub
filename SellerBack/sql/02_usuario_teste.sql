-- Credenciais públicas e exclusivas para a demonstração: teste@email.com / 123456.
-- Hash gerado por cmd/gerar-hash com bcrypt e custo 10.
INSERT INTO users (email, password)
VALUES ('teste@email.com', '$2a$10$s2xxrllamNO8GTcA9dq6auL69ycZQda0TRjJDJL.fKvzctezuKU2y')
ON CONFLICT (email) DO NOTHING;
