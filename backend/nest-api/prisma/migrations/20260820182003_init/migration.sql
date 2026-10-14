-- CreateEnum
CREATE TYPE "usuarios_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "missas_tipo" AS ENUM ('COMMON', 'SPECIAL');

-- CreateEnum
CREATE TYPE "eventos_status" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "comunicados_status" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "categorias_tipo" AS ENUM ('EVENT', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "logs_auditoria_acao" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "cargos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(255),
    "is_base" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes" (
    "id" SERIAL NOT NULL,
    "cargo_id" INTEGER NOT NULL,
    "recurso" VARCHAR(60) NOT NULL,
    "pode_criar" BOOLEAN NOT NULL DEFAULT false,
    "pode_editar" BOOLEAN NOT NULL DEFAULT false,
    "pode_remover" BOOLEAN NOT NULL DEFAULT false,
    "pode_visualizar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pastorais" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "contato" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pastorais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" CHAR(36) NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "cargo_id" INTEGER NOT NULL,
    "pastoral_id" INTEGER,
    "status" "usuarios_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voluntarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(180),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voluntarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missas" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "tipo" "missas_tipo" NOT NULL DEFAULT 'COMMON',
    "local" VARCHAR(180) NOT NULL,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "tipo" "categorias_tipo" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "descricao" TEXT,
    "categoria_id" INTEGER,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3),
    "local" VARCHAR(180) NOT NULL,
    "status" "eventos_status" NOT NULL DEFAULT 'ACTIVE',
    "missa_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalas" (
    "id" CHAR(36) NOT NULL,
    "missa_id" INTEGER,
    "evento_id" INTEGER,
    "pastoral_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escala_atribuicoes" (
    "id" SERIAL NOT NULL,
    "escala_id" CHAR(36) NOT NULL,
    "voluntario_id" INTEGER NOT NULL,
    "funcao" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escala_atribuicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(180) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "categoria_id" INTEGER,
    "status" "comunicados_status" NOT NULL DEFAULT 'PUBLISHED',
    "imagem_url" VARCHAR(255),
    "autor_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albuns" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "slug" VARCHAR(150) NOT NULL,
    "evento_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albuns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "album_id" INTEGER NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "is_capa" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sacramentos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "documentos_necessarios" TEXT,
    "faq" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sacramentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmacoes_presenca" (
    "id" CHAR(36) NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "contato" VARCHAR(150) NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confirmacoes_presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" CHAR(36) NOT NULL,
    "usuario_id" CHAR(36) NOT NULL,
    "acao" "logs_auditoria_acao" NOT NULL,
    "entidade" VARCHAR(80) NOT NULL,
    "entidade_id" VARCHAR(36) NOT NULL,
    "dados_anteriores" JSONB,
    "dados_novos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cargos_nome_key" ON "cargos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cargo_recurso" ON "permissoes"("cargo_id", "recurso");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_key" ON "eventos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_escala_voluntario_funcao" ON "escala_atribuicoes"("escala_id", "voluntario_id", "funcao");

-- CreateIndex
CREATE UNIQUE INDEX "comunicados_slug_key" ON "comunicados"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "albuns_slug_key" ON "albuns"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sacramentos_slug_key" ON "sacramentos"("slug");

-- AddForeignKey
ALTER TABLE "permissoes" ADD CONSTRAINT "permissoes_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_pastoral_id_fkey" FOREIGN KEY ("pastoral_id") REFERENCES "pastorais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_missa_id_fkey" FOREIGN KEY ("missa_id") REFERENCES "missas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalas" ADD CONSTRAINT "escalas_missa_id_fkey" FOREIGN KEY ("missa_id") REFERENCES "missas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalas" ADD CONSTRAINT "escalas_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalas" ADD CONSTRAINT "escalas_pastoral_id_fkey" FOREIGN KEY ("pastoral_id") REFERENCES "pastorais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escala_atribuicoes" ADD CONSTRAINT "escala_atribuicoes_escala_id_fkey" FOREIGN KEY ("escala_id") REFERENCES "escalas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escala_atribuicoes" ADD CONSTRAINT "escala_atribuicoes_voluntario_id_fkey" FOREIGN KEY ("voluntario_id") REFERENCES "voluntarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albuns" ADD CONSTRAINT "albuns_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albuns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacoes_presenca" ADD CONSTRAINT "confirmacoes_presenca_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
