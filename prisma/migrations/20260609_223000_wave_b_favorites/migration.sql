-- =================================================================
-- Wave B.1 — favorites.id: TEXT (uuid) → INTEGER IDENTITY
-- Sem filhas. Operação atômica.
-- Pré-validação: favorites=5.
-- =================================================================

BEGIN;

-- 1) Sequence + coluna nova
CREATE SEQUENCE IF NOT EXISTS "favorites_id_new_seq";
ALTER TABLE "favorites" ADD COLUMN "id_new" INTEGER NOT NULL DEFAULT nextval('"favorites_id_new_seq"');

-- 2) Popula
UPDATE "favorites" SET "id_new" = sub.rn
FROM (SELECT ctid, ROW_NUMBER() OVER (ORDER BY ctid) AS rn FROM "favorites") sub
WHERE "favorites".ctid = sub.ctid;

-- 3) Dropa PK antiga
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_pkey";

-- 4) Dropa coluna id (text) antiga
ALTER TABLE "favorites" DROP COLUMN "id";

-- 5) Renomeia
ALTER TABLE "favorites" RENAME COLUMN "id_new" TO "id";

-- 6) Sequence + default
ALTER SEQUENCE "favorites_id_new_seq" OWNED BY "favorites"."id";
ALTER TABLE "favorites" ALTER COLUMN "id" SET DEFAULT nextval('"favorites_id_new_seq"');

-- 7) NOT NULL + recria PK
ALTER TABLE "favorites" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");

-- 8) UNIQUE composto (já existe, validamos)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'favorites_userId_movieId_key') THEN
    CREATE UNIQUE INDEX "favorites_userId_movieId_key" ON "favorites"("userId","movieId");
  END IF;
END $$;

-- 9) Sincroniza sequence
SELECT setval('"favorites_id_new_seq"',
              (SELECT COALESCE(MAX("id"), 0) FROM "favorites"),
              true);

-- 10) Validação
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM "favorites";
  RAISE NOTICE 'Wave B.1 OK — favorites=%', v_count;
END $$;

COMMIT;
