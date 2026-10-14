-- ============================================================
-- MODELO DE DADOS - Sistema Paroquial
-- Uso: MySQL Workbench (EER Diagram) para modelagem/ajuste visual
-- IMPORTANTE: banco real do projeto = PostgreSQL (via Prisma).
-- Este script é apenas de referência para visualização/edição.
--
-- Alterações desta versão (vs. schema_modelagem_mysql(1).sql):
--   - SINCRONIA com o schema.prisma real:
--     - comunicados, albuns, sacramentos: adicionado campo "slug" (unique)
--     - eventos.categoria / comunicados.categoria (texto livre temporário):
--       REMOVIDOS — migração para categoria_id já foi concluída
--     - fotos: removida a coluna gerada "capa_unica" e a constraint
--       uq_fotos_capa_por_album — RN010 (capa única por álbum) passou a
--       ser validada na camada de SERVICE, não mais via constraint de banco
--     - escalas: removida a CHECK chk_escala_vinculo_exclusivo — RN007
--       (Missa XOR Evento) passou a ser validada na camada de SERVICE,
--       não mais via constraint de banco
--   - NOVO (RN017 - proposta): tabelas de junção "missa_pastorais" e
--     "evento_pastorais" (N:N) — uma Missa/Evento pode ter várias
--     Pastorais participantes; um Coordenador de Pastoral só pode
--     escalar (criar Schedule) para uma Missa/Evento se sua Pastoral
--     estiver entre as vinculadas a ela. Ainda NÃO está no schema.prisma
--     real — pendente de confirmação para ser incorporado lá.
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
-- CATEGORIAS
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
-- Migração de categoria (texto livre) -> categoria_id já concluída,
-- coluna antiga removida.
-- ------------------------------------------------------------
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    descricao TEXT NULL,
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
-- MISSA_PASTORAIS (NOVO - proposta RN017)
-- N:N — quais Pastorais participam de uma Missa. Usado para restringir
-- quais Coordenadores de Pastoral podem criar Escala para essa Missa.
-- AINDA NÃO INCORPORADO AO schema.prisma — pendente de confirmação.
-- ------------------------------------------------------------
CREATE TABLE missa_pastorais (
    missa_id INT NOT NULL,
    pastoral_id INT NOT NULL,
    PRIMARY KEY (missa_id, pastoral_id),
    CONSTRAINT fk_missa_pastorais_missa FOREIGN KEY (missa_id) REFERENCES missas(id) ON DELETE CASCADE,
    CONSTRAINT fk_missa_pastorais_pastoral FOREIGN KEY (pastoral_id) REFERENCES pastorais(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- EVENTO_PASTORAIS (NOVO - proposta RN017)
-- N:N — mesmo conceito de missa_pastorais, aplicado a Eventos.
-- AINDA NÃO INCORPORADO AO schema.prisma — pendente de confirmação.
-- ------------------------------------------------------------
CREATE TABLE evento_pastorais (
    evento_id INT NOT NULL,
    pastoral_id INT NOT NULL,
    PRIMARY KEY (evento_id, pastoral_id),
    CONSTRAINT fk_evento_pastorais_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT fk_evento_pastorais_pastoral FOREIGN KEY (pastoral_id) REFERENCES pastorais(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- ESCALAS (RN007 - vínculo exclusivo Missa XOR Evento) - UUID
-- RN007 validada em SERVICE (não há mais CHECK de banco — alinhado
-- com o schema.prisma real, que já não possui essa constraint).
-- pastoral_id (RN006/RN008) deve, na prática (RN017 proposta), estar
-- contido no conjunto de pastorais vinculadas à Missa/Evento da própria
-- Escala — essa consistência também fica a cargo do SERVICE.
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
    CONSTRAINT fk_escalas_pastoral FOREIGN KEY (pastoral_id) REFERENCES pastorais(id)
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
-- Migração de categoria (texto livre) -> categoria_id já concluída,
-- coluna antiga removida. Campo "slug" adicionado (sincronia c/ Prisma).
-- ------------------------------------------------------------
CREATE TABLE comunicados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(180) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    conteudo TEXT NOT NULL,
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
-- Campo "slug" adicionado (sincronia c/ Prisma).
-- ------------------------------------------------------------
CREATE TABLE albuns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    descricao TEXT NULL,
    evento_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_albuns_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- FOTOS (RN010 - 1 Foto pertence a exatamente 1 Álbum)
-- Capa única por álbum (RN010) validada em SERVICE — removida a coluna
-- gerada "capa_unica" e a unique key, alinhado com o schema.prisma real.
-- ------------------------------------------------------------
CREATE TABLE fotos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    album_id INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    is_capa BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fotos_album FOREIGN KEY (album_id) REFERENCES albuns(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- SACRAMENTOS
-- Campo "slug" adicionado (sincronia c/ Prisma).
-- ------------------------------------------------------------
CREATE TABLE sacramentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
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
-- PENDÊNCIAS DESTA VERSÃO
-- - missa_pastorais / evento_pastorais: ainda precisam ser incorporadas
--   ao schema.prisma real (models MassPastoralGroup / EventPastoralGroup
--   ou nome equivalente, com @@map para essas tabelas) — depende de
--   confirmação da RN017 proposta.
-- - Consistência escalas.pastoral_id ⊆ pastorais da Missa/Evento vinculada
--   (RN017) precisa ser implementada como validação de SERVICE no
--   SchedulesService (ver roadmap-schedule-aninhado.md, Dia 3).
-- ============================================================

-- ============================================================
-- FASE 2 / FASE 4 (fora do escopo do MVP - não incluídas acima)
-- - doacoes (RF020)
-- - campanhas_arrecadacao (RF021/RF022)
-- - area_fiel_paroquiano (RF024)
-- ============================================================
