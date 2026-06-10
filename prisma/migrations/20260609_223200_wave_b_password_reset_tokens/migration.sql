-- =================================================================
-- Wave B.3 — password_reset_tokens.id: TEXT (uuid) → INTEGER IDENTITY
-- Sem filhas. Operação atômica.
-- Pré-validação: pwt=0.
-- =================================================================

BEGIN;

CREATE SEQUENCE IF NOT EXISTS "password_reset_tokens_id_new_seq";
ALTER TABLE "password_reset_tokens" ADD COLUMN "id_new" INTEGER NOT NULL DEFAULT nextval('"password_reset_tokens_id_new_seq"');

-- Como pwt pode estar vazia, row_number sobre tabela vazia é OK
UPDATE "password_reset_tokens" SET "id_new" = sub.rn
FROM (SELECT ctid, ROW_NUMBER() OVER (ORDER BY ctid) AS rn FROM "password_reset_tokens") sub
WHERE "password_reset_tokens".ctid = sub.ctid;

ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_pkey";
ALTER TABLE "password_reset_tokens" DROP COLUMN "id";
ALTER TABLE "password_reset_tokens" RENAME COLUMN "id_new" TO "id";
ALTER SEQUENCE "password_reset_tokens_id_new_seq" OWNED BY "password_reset_tokens"."id";
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" SET DEFAULT nextval('"password_reset_tokens_id_new_seq"');
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'password_reset_tokens_token_key') THEN
    CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
  END IF;
END $$;

-- Sincroniza sequence — PostgreSQL não aceita setval(..., 0) (mínimo é 1).
-- Para tabela vazia: deixa a sequence no padrão (próximo nextval = 1).
-- Para tabela populada: setval(max, true) → próximo nextval = max+1.
DO $$
DECLARE
  v_max INTEGER;
BEGIN
  SELECT MAX("id") INTO v_max FROM "password_reset_tokens";
  IF v_max IS NOT NULL THEN
    PERFORM setval('"password_reset_tokens_id_new_seq"', v_max, true);
  END IF;
  -- se pwt está vazia, MAX retorna NULL → nada a fazer; sequence começa em 1
END $$;

DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM "password_reset_tokens";
  RAISE NOTICE 'Wave B.3 OK — password_reset_tokens=%', v_count;
END $$;

COMMIT;
