-- CreateIndex
CREATE INDEX "idx_logs_created_at_id" ON "logs_auditoria"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "idx_logs_entidade" ON "logs_auditoria"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "idx_logs_usuario" ON "logs_auditoria"("usuario_id");
