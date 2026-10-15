/*
  Warnings:

  - A unique constraint covering the columns `[day_of_week,time,local]` on the table `missa_templates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[generated_from_template_id,template_occurrence_at]` on the table `missas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "missas" DROP CONSTRAINT "missas_generated_from_template_id_fkey";

-- AlterTable
ALTER TABLE "missas" ADD COLUMN     "template_occurrence_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "missa_template_skips" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "occurrence_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missa_template_skips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_template_skip" ON "missa_template_skips"("template_id", "occurrence_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_template_dia_hora_local" ON "missa_templates"("day_of_week", "time", "local");

-- CreateIndex
CREATE UNIQUE INDEX "uq_missa_ocorrencia_template" ON "missas"("generated_from_template_id", "template_occurrence_at");

-- AddForeignKey
ALTER TABLE "missas" ADD CONSTRAINT "missas_generated_from_template_id_fkey" FOREIGN KEY ("generated_from_template_id") REFERENCES "missa_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missa_template_skips" ADD CONSTRAINT "missa_template_skips_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "missa_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
