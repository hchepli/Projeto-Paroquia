/*
  Warnings:

  - A unique constraint covering the columns `[missa_id,pastoral_id]` on the table `escalas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[evento_id,pastoral_id]` on the table `escalas` will be added. If there are existing duplicate values, this will fail.
  - Made the column `pastoral_id` on table `escalas` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "escalas" DROP CONSTRAINT "escalas_pastoral_id_fkey";

-- AlterTable
ALTER TABLE "escalas" ALTER COLUMN "pastoral_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "uq_escala_missa_pastoral" ON "escalas"("missa_id", "pastoral_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_escala_evento_pastoral" ON "escalas"("evento_id", "pastoral_id");

-- AddForeignKey
ALTER TABLE "escalas" ADD CONSTRAINT "escalas_pastoral_id_fkey" FOREIGN KEY ("pastoral_id") REFERENCES "pastorais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
