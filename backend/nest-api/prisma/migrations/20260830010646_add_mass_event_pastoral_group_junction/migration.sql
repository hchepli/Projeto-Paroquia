-- CreateTable
CREATE TABLE "missa_pastorais" (
    "massId" INTEGER NOT NULL,
    "pastoralGroupId" INTEGER NOT NULL,

    CONSTRAINT "missa_pastorais_pkey" PRIMARY KEY ("massId","pastoralGroupId")
);

-- CreateTable
CREATE TABLE "evento_pastorais" (
    "eventId" INTEGER NOT NULL,
    "pastoralGroupId" INTEGER NOT NULL,

    CONSTRAINT "evento_pastorais_pkey" PRIMARY KEY ("eventId","pastoralGroupId")
);

-- AddForeignKey
ALTER TABLE "missa_pastorais" ADD CONSTRAINT "missa_pastorais_massId_fkey" FOREIGN KEY ("massId") REFERENCES "missas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missa_pastorais" ADD CONSTRAINT "missa_pastorais_pastoralGroupId_fkey" FOREIGN KEY ("pastoralGroupId") REFERENCES "pastorais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_pastorais" ADD CONSTRAINT "evento_pastorais_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_pastorais" ADD CONSTRAINT "evento_pastorais_pastoralGroupId_fkey" FOREIGN KEY ("pastoralGroupId") REFERENCES "pastorais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
