/*
  Warnings:

  - Made the column `pastoral_id` on table `voluntarios` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "voluntarios" DROP CONSTRAINT "voluntarios_pastoral_id_fkey";

-- AlterTable
ALTER TABLE "voluntarios" ALTER COLUMN "pastoral_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "voluntarios" ADD CONSTRAINT "voluntarios_pastoral_id_fkey" FOREIGN KEY ("pastoral_id") REFERENCES "pastorais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
