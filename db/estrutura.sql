-- 1. Tabelas sem chaves estrangeiras
CREATE TABLE CAD_PESSOA (
    ID_pessoa SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) UNIQUE NOT NULL,
    tipo_pessoa VARCHAR(50) NOT NULL
);

CREATE TABLE CAD_MARKETPLACE (
    id_marketplace SERIAL PRIMARY KEY,
    nome_marketplace VARCHAR(100) NOT NULL,
    taxa_comissao DECIMAL(5,2) NOT NULL
);

-- 2. Tabelas com dependências de 1º nível
CREATE TABLE CAD_USUARIO (
    id_usuario SERIAL PRIMARY KEY,
    id_pessoa INTEGER NOT NULL,
    login_campo VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    CONSTRAINT fk_usuario_pessoa FOREIGN KEY (id_pessoa) REFERENCES CAD_PESSOA(ID_pessoa)
);

-- 3. Tabelas com dependências de 2º nível
CREATE TABLE CAD_AUDITORIA (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    acao VARCHAR(255) NOT NULL,
    tabela_afetada VARCHAR(100) NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES CAD_USUARIO(id_usuario)
);

CREATE TABLE CAD_PRODUTO (
    id_produto SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    sku VARCHAR(100) NOT NULL,
    nome_produto VARCHAR(255) NOT NULL,
    preco_base DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_produto_usuario FOREIGN KEY (id_usuario) REFERENCES CAD_USUARIO(id_usuario)
);

-- 4. Tabelas com dependências de 3º nível
CREATE TABLE CAD_ANUNCIO (
    id_anuncio SERIAL PRIMARY KEY,
    id_marketplace INTEGER NOT NULL,
    id_produto INTEGER NOT NULL,
    titulo_anuncio VARCHAR(255) NOT NULL,
    descricao_anuncio TEXT,
    preco_venda DECIMAL(10,2) NOT NULL,
    id_externo_mp VARCHAR(100),
    status_campo VARCHAR(50) NOT NULL,
    CONSTRAINT fk_anuncio_marketplace FOREIGN KEY (id_marketplace) REFERENCES CAD_MARKETPLACE(id_marketplace),
    CONSTRAINT fk_anuncio_produto FOREIGN KEY (id_produto) REFERENCES CAD_PRODUTO(id_produto)
);

-- 5. Tabelas com dependências de 4º nível
CREATE TABLE HIST_METRICA_ANUNCIO (
    id_metrica SERIAL PRIMARY KEY,
    id_anuncio INTEGER NOT NULL,
    data_referencia DATE NOT NULL,
    visualizacoes INTEGER DEFAULT 0,
    conversoes INTEGER DEFAULT 0,
    CONSTRAINT fk_metrica_anuncio FOREIGN KEY (id_anuncio) REFERENCES CAD_ANUNCIO(id_anuncio)
);