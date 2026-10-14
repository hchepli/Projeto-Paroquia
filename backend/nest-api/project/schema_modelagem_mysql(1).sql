-- ============================================================
-- MODELO DE DADOS - Sistema Paroquial
-- Uso: MySQL Workbench (EER Diagram) para modelagem/ajuste visual
-- IMPORTANTE: banco real do projeto = PostgreSQL (via Prisma).
-- Este script é apenas de referência para visualização/edição.
--
-- Alterações desta versão (vs. anterior):
--   - eventos: novo campo "status" (ATIVO/CANCELADO)
--   - comunicados: novo campo "status" (RASCUNHO/PUBLICADO)
--   - nova tabela "categorias" + FK categoria_id em eventos/comunicados
--     (coluna "categoria" texto livre mantida temporariamente para migração)
--   - fotos: constraint garantindo no máximo 1 capa por álbum
--   - Não alterado: permissoes, cargos.is_base
-- ============================================================
 
-- Convenção de ID:
--   CHAR(36) (UUID)  -> tabelas sensíveis / que exigem não-enumerabilidade
--   INT AUTO_INCREMENT -> tabelas de conteúdo simples
 
SET FOREIGN_KEY_CHECKS = 0;
 
-- ------------------------------------------------------------
-- CARGOS
-- ------------------------------------------------------------
CREATE TABLE cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL UNIQUE,
    descricao VARCHAR(255) NULL,
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
 
-- ------------------------------------------------------------
-- PERMISSOES (RBAC granular - RF005 / RN005)
-- ------------------------------------------------------------
CREATE TABLE permissoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cargo_id INT NOT NULL,
    recurso VARCHAR(60) NOT NULL, -- ex: 'missas', 'escalas', 'usuarios'
    pode_criar BOOLEAN NOT NULL DEFAULT FALSE,
    pode_editar BOOLEAN NOT NULL DEFAULT FALSE,
    pode_remover BOOLEAN NOT NULL DEFAULT FALSE,
    pode_visualizar BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_permissoes_cargo FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE CASCADE,
    UNIQUE KEY uq_cargo_recurso (cargo_id, recurso)
);
 
-- ------------------------------------------------------------
-- PASTORAIS
-- ------------------------------------------------------------
CREATE TABLE pastorais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT NULL,
    contato VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
 
-- ------------------------------------------------------------
-- USUARIOS (RF001/RF002 - apenas admins no MVP) - UUID
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL, -- bcrypt/argon2 (RNF005)
    cargo_id INT NOT NULL,
    pastoral_id INT NULL, -- preenchido apenas se cargo = Coordenador de Pastoral (RN006)
    status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_cargo FOREIGN KEY (cargo_id) REFERENCES cargos(id),
    CONSTRAINT fk_usuarios_pastoral FOREIGN KEY (pastoral_id) REFERENCES pastorais(id)
);
 
-- ------------------------------------------------------------
-- VOLUNTARIOS (RN009 - não são usuários, sem login)
-- ------------------------------------------------------------
CREATE TABLE voluntarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    email VARCHAR(180) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
 
-- ------------------------------------------------------------
-- MISSAS
-- ------------------------------------------------------------
CREATE TABLE missas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    data_hora DATETIME NOT NULL,
    tipo ENUM('COMUM', 'ESPECIAL') NOT NULL DEFAULT 'COMUM',
    local VARCHAR(180) NOT NULL,
    observacoes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
 
-- ------------------------------------------------------------
-- CATEGORIAS (nova - substitui os campos de texto livre em
-- eventos.categoria e comunicados.categoria)
-- ------------------------------------------------------------
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE,
    tipo ENUM('EVENTO', 'COMUNICADO') NOT NULL, -- indica em qual contexto a categoria é usada
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
 
-- ------------------------------------------------------------
-- EVENTOS (RN002 - correlação opcional e não-exclusiva com Missa)
-- ------------------------------------------------------------
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    descricao TEXT NULL,
    categoria VARCHAR(80) NULL, -- MANTIDO TEMPORARIAMENTE p/ migração dos dados -> categoria_id (remover após migrar)
    categoria_id INT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NULL,
    local VARCHAR(180) NOT NULL,
    status ENUM('ATIVO', 'CANCELADO') NOT NULL DEFAULT 'ATIVO',
    missa_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_eventos_missa FOREIGN KEY (missa_id) REFERENCES missas(id) ON DELETE SET NULL,
    CONSTRAINT fk_eventos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
 
-- ------------------------------------------------------------
-- ESCALAS (RN007 - vínculo exclusivo Missa XOR Evento) - UUID
-- ------------------------------------------------------------
CREATE TABLE escalas (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    missa_id INT NULL,
    evento_id INT NULL,
    pastoral_id INT NULL, -- usado para escopo/filtro de relatório (RN006/RN008)
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_escalas_missa FOREIGN KEY (missa_id) REFERENCES missas(id) ON DELETE CASCADE,
    CONSTRAINT fk_escalas_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_escalas_pastoral FOREIGN KEY (pastoral_id) REFERENCES pastorais(id),
    -- Requer MySQL 8.0.16+ para enforcement real de CHECK
    CONSTRAINT chk_escala_vinculo_exclusivo CHECK (
        (missa_id IS NOT NULL AND evento_id IS NULL)
        OR (missa_id IS NULL AND evento_id IS NOT NULL)
    )
);
 
-- ------------------------------------------------------------
-- ESCALA_ATRIBUICOES
-- ------------------------------------------------------------
CREATE TABLE escala_atribuicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    escala_id CHAR(36) NOT NULL,
    voluntario_id INT NOT NULL,
    funcao VARCHAR(80) NOT NULL, -- ex: leitor, ministro_eucaristia, coroinha
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_escala_atrib_escala FOREIGN KEY (escala_id) REFERENCES escalas(id) ON DELETE CASCADE,
    CONSTRAINT fk_escala_atrib_voluntario FOREIGN KEY (voluntario_id) REFERENCES voluntarios(id),
    UNIQUE KEY uq_escala_voluntario_funcao (escala_id, voluntario_id, funcao)
);
 
-- ------------------------------------------------------------
-- COMUNICADOS
-- ------------------------------------------------------------
CREATE TABLE comunicados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(180) NOT NULL,
    conteudo TEXT NOT NULL,
    categoria VARCHAR(80) NULL, -- MANTIDO TEMPORARIAMENTE p/ migração dos dados -> categoria_id (remover após migrar)
    categoria_id INT NULL,
    status ENUM('RASCUNHO', 'PUBLICADO') NOT NULL DEFAULT 'PUBLICADO',
    imagem_url VARCHAR(255) NULL,
    autor_id CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_comunicados_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id),
    CONSTRAINT fk_comunicados_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
 
-- ------------------------------------------------------------
-- ALBUNS (RN003 - vínculo opcional com Evento)
-- ------------------------------------------------------------
CREATE TABLE albuns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    evento_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_albuns_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
);
 
-- ------------------------------------------------------------
-- FOTOS (RN010 - 1 Foto pertence a exatamente 1 Álbum)
-- Alteração: garante no máximo 1 foto marcada como capa por álbum
-- ------------------------------------------------------------
CREATE TABLE fotos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    album_id INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    is_capa BOOLEAN NOT NULL DEFAULT FALSE,
    capa_unica INT GENERATED ALWAYS AS (IF(is_capa = TRUE, album_id, NULL)) STORED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fotos_album FOREIGN KEY (album_id) REFERENCES albuns(id) ON DELETE CASCADE,
    UNIQUE KEY uq_fotos_capa_por_album (capa_unica)
);
 
-- ------------------------------------------------------------
-- SACRAMENTOS
-- ------------------------------------------------------------
CREATE TABLE sacramentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT NOT NULL,
    documentos_necessarios TEXT NULL,
    faq JSON NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
 
-- ------------------------------------------------------------
-- CONFIRMACOES_PRESENCA (RF012/RN012 - sem login) - UUID
-- ------------------------------------------------------------
CREATE TABLE confirmacoes_presenca (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    evento_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    contato VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45) NULL, -- apoio ao rate limiting (RNF017)
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_confirmacoes_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
);
 
-- ------------------------------------------------------------
-- LOGS_AUDITORIA (RNF011) - UUID
-- ------------------------------------------------------------
CREATE TABLE logs_auditoria (
    id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    usuario_id CHAR(36) NOT NULL,
    acao ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    entidade VARCHAR(80) NOT NULL,
    entidade_id VARCHAR(36) NOT NULL,
    dados_anteriores JSON NULL,
    dados_novos JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
 
SET FOREIGN_KEY_CHECKS = 1;
 
-- ============================================================
-- NOTAS DE MIGRAÇÃO
-- - Após popular "categorias" e migrar os dados de
--   eventos.categoria / comunicados.categoria para categoria_id,
--   remover as colunas antigas de texto livre:
--     ALTER TABLE eventos DROP COLUMN categoria;
--     ALTER TABLE comunicados DROP COLUMN categoria;
-- ============================================================
 
-- ============================================================
-- FASE 2 / FASE 4 (fora do escopo do MVP - não incluídas acima)
-- - doacoes (RF020)
-- - campanhas_arrecadacao (RF021/RF022)
-- - area_fiel_paroquiano (RF024)
-- ============================================================
 