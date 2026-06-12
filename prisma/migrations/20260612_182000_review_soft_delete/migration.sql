-- =============================================================
-- Review soft delete + auditoria de moderação por admin/autor.
-- Pré-validação: nenhuma coluna de auditoria existe em reviews.
-- =============================================================

BEGIN;

ALTER TABLE "reviews"
  ADD COLUMN "isDeleted"     BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN "deletedAt"     TIMESTAMP(3),
  ADD COLUMN "deletionReason" TEXT,
  ADD COLUMN "deletedById"   INTEGER;

-- FK para users (sem cascade: se o moderador for removido, mantemos
-- o registro histórico e limpamos deletedById via SET NULL).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_deletedById_fkey'
  ) THEN
    ALTER TABLE "reviews"
      ADD CONSTRAINT "reviews_deletedById_fkey"
      FOREIGN KEY ("deletedById") REFERENCES "users"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- Índice auxiliar: "listar reviews removidas pelo admin X" em casos
-- de auditoria/discovery.
CREATE INDEX IF NOT EXISTS "reviews_isDeleted_deletedById_idx"
  ON "reviews"("isDeleted","deletedById");

-- Sanity-check
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM "reviews" WHERE "isDeleted" = TRUE;
  RAISE NOTICE 'Migration OK — existing soft-deleted rows=%', v_count;
END $$;

COMMIT;
