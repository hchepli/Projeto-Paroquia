-- AlterTable
ALTER TABLE "missas" ADD COLUMN     "generated_from_template_id" INTEGER;

-- CreateTable
CREATE TABLE "missa_templates" (
    "id" SERIAL NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "time" VARCHAR(5) NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "local" VARCHAR(180) NOT NULL,
    "tipo" "missas_tipo" NOT NULL DEFAULT 'COMMON',
    "observacoes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missa_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "missas" ADD CONSTRAINT "missas_generated_from_template_id_fkey" FOREIGN KEY ("generated_from_template_id") REFERENCES "missa_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
