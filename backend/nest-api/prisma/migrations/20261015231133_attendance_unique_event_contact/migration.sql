-- Garantir Presença: UNIQUE (evento_id, contato) com contato normalizado.
-- 1) normaliza contatos já gravados (mesma regra do contact.util.ts)
UPDATE "confirmacoes_presenca"
   SET "contato" = lower(btrim("contato"))
 WHERE position('@' in "contato") > 0;

UPDATE "confirmacoes_presenca"
   SET "contato" = regexp_replace("contato", '\D', '', 'g')
 WHERE position('@' in "contato") = 0
   AND "contato" ~ '^[0-9[:space:]()+.\-]+$';

UPDATE "confirmacoes_presenca"
   SET "contato" = substr("contato", 3)
 WHERE position('@' in "contato") = 0
   AND length("contato") IN (12, 13)
   AND "contato" LIKE '55%';

-- 2) remove duplicados, mantendo o registro mais antigo
DELETE FROM "confirmacoes_presenca" a
      USING "confirmacoes_presenca" b
 WHERE a."evento_id" = b."evento_id"
   AND a."contato"   = b."contato"
   AND (a."created_at" > b."created_at"
        OR (a."created_at" = b."created_at" AND a."id" > b."id"));

-- 3) o UNIQUE composto também serve de índice para consultas por evento_id
CREATE UNIQUE INDEX "uq_confirmacao_evento_contato"
    ON "confirmacoes_presenca"("evento_id", "contato");