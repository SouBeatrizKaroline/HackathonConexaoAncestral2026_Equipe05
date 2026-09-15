-- schema.sql - Criar banco de dados e tabelas do Petronect

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS petronect;
USE petronect;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cnpj VARCHAR(14) UNIQUE NOT NULL,
  razao_social VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  inscricao_estadual VARCHAR(20),
  tributacao VARCHAR(50),
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'ativo',
  INDEX idx_cnpj (cnpj),
  INDEX idx_data_cadastro (data_cadastro)
);

-- Tabela de Segmentos/Interesses
CREATE TABLE IF NOT EXISTS segmentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  segmento VARCHAR(100),
  data_selecionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Tabela de Representantes Legais
CREATE TABLE IF NOT EXISTS representantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nome_completo VARCHAR(255),
  cpf VARCHAR(11),
  cargo VARCHAR(100),
  email VARCHAR(255),
  telefone VARCHAR(20),
  data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_cpf (cpf)
);

-- Tabela de Histórico de Logins
CREATE TABLE IF NOT EXISTS login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  data_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_data_login (data_login)
);

-- Tabela de Acessos (Páginas visitadas)
CREATE TABLE IF NOT EXISTS acessos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pagina VARCHAR(255),
  data_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duracao_segundos INT,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_pagina (pagina),
  INDEX idx_data_acesso (data_acesso)
);

-- Tabela de Cliques
CREATE TABLE IF NOT EXISTS cliques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  elemento VARCHAR(255),
  pagina VARCHAR(255),
  data_clique TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pos_x INT,
  pos_y INT,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_elemento (elemento),
  INDEX idx_data_clique (data_clique)
);

-- Tabela de Preferências/LGPD
CREATE TABLE IF NOT EXISTS preferencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  aceita_lgpd BOOLEAN DEFAULT FALSE,
  aceita_alertas BOOLEAN DEFAULT FALSE,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Índices para performance
CREATE INDEX idx_usuarios_data ON usuarios(data_cadastro);
CREATE INDEX idx_acessos_periodo ON acessos(data_acesso);
CREATE INDEX idx_cliques_periodo ON cliques(data_clique);
