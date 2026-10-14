-- AlterTable
ALTER TABLE "pastorais" ADD COLUMN     "default_role" VARCHAR(80);

-- AlterTable
ALTER TABLE "voluntarios" ADD COLUMN     "pastoral_id" INTEGER;

-- AddForeignKey
ALTER TABLE "voluntarios" ADD CONSTRAINT "voluntarios_pastoral_id_fkey" FOREIGN KEY ("pastoral_id") REFERENCES "pastorais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
