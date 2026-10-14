/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `pastorais` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pastorais_nome_key" ON "pastorais"("nome");
