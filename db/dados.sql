-- senha de todos os usuarios de desenvolvimento: 123456 (bcrypt, custo 10)

-- 1. Inserir Pessoas
INSERT INTO CAD_PESSOA (nome, cpf_cnpj, tipo_pessoa) VALUES
('Samuel Do Prado Silva', '11122233344', 'PF'),
('Caio Beneton', '55566677788', 'PF'),
('Vitor Souza', '99988877766', 'PF');

-- 2. Inserir Marketplaces
INSERT INTO CAD_MARKETPLACE (nome_marketplace, taxa_comissao) VALUES
('Mercado Livre', 16.00),
('Shopee', 14.00),
('Amazon', 11.00);

-- 3. Inserir Usuários (Relacionados aos IDs das pessoas acima: 1, 2 e 3)
INSERT INTO CAD_USUARIO (id_pessoa, login_campo, senha_hash, email) VALUES
(1, 'samuel.admin', '$2a$10$s2xxrllamNO8GTcA9dq6auL69ycZQda0TRjJDJL.fKvzctezuKU2y', 'samuel@sellerhub.com'),
(2, 'caio.beneton', '$2a$10$s2xxrllamNO8GTcA9dq6auL69ycZQda0TRjJDJL.fKvzctezuKU2y', 'caio@sellerhub.com'),
(3, 'vitor.souza', '$2a$10$s2xxrllamNO8GTcA9dq6auL69ycZQda0TRjJDJL.fKvzctezuKU2y', 'vitor@sellerhub.com');

-- 4. Inserir Auditoria de exemplo
INSERT INTO CAD_AUDITORIA (id_usuario, acao, tabela_afetada) VALUES
(1, 'INSERT', 'CAD_USUARIO'),
(1, 'UPDATE', 'CAD_PESSOA'),
(2, 'INSERT', 'CAD_MARKETPLACE');

-- 5. Inserir Produtos (Relacionados aos usuários; temática de peças de moto)
INSERT INTO CAD_PRODUTO (id_usuario, sku, nome_produto, preco_base) VALUES
(1, 'CAP-SM-001', 'Capacete San Marino Classic', 150.00),
(1, 'LUV-ALP-02', 'Luva de Couro Alpinestars', 250.00),
(2, 'ANT-CP-01', 'Antena Corta Pipa Retrátil', 35.50),
(3, 'ESC-T-04', 'Escapamento Esportivo', 450.00);

-- 6. Inserir Anúncios (Cruzando Produtos e Marketplaces)
INSERT INTO CAD_ANUNCIO (id_marketplace, id_produto, titulo_anuncio, descricao_anuncio, preco_venda, id_externo_mp, status_campo) VALUES
(1, 1, 'Capacete San Marino Classic Preto', 'Capacete original com selo Inmetro, viseira cristal.', 175.00, 'MLB123456789', 'ATIVO'),
(2, 1, 'Capacete Moto San Marino Viseira Cristal', 'Envio rápido. Capacete fechado para o dia a dia.', 170.00, 'SHP987654321', 'ATIVO'),
(1, 2, 'Luva Alpinestars Couro Legítimo', 'Proteção e conforto para motociclistas. Tamanho G.', 290.00, 'MLB987654321', 'PAUSADO'),
(3, 4, 'Escapamento Esportivo Moto', 'Aumente o ronco da sua moto, fácil instalação.', 500.00, 'AMZ112233', 'ATIVO');

-- 7. Inserir Histórico de Métricas dos Anúncios
INSERT INTO HIST_METRICA_ANUNCIO (id_anuncio, data_referencia, visualizacoes, conversoes) VALUES
(1, '2026-11-01', 120, 5),
(1, '2026-11-02', 150, 8),
(2, '2026-11-01', 85, 2),
(3, '2026-11-03', 45, 0),
(4, '2026-11-02', 300, 15);