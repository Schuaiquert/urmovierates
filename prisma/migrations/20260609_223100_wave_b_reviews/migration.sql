-- =================================================================
-- Wave B.2 — reviews.id: TEXT (uuid) → INTEGER IDENTITY
-- Sem filhas. Operação atômica.
-- Pré-validação: reviews=7.
-- =================================================================

BEGIN;

CREATE SEQUENCE IF NOT EXISTS "reviews_id_new_seq";
ALTER TABLE "reviews" ADD COLUMN "id_new" INTEGER NOT NULL DEFAULT nextval('"reviews_id_new_seq"');

UPDATE "reviews" SET "id_new" = sub.rn
FROM (SELECT ctid, ROW_NUMBER() OVER (ORDER BY ctid) AS rn FROM "reviews") sub
WHERE "reviews".ctid = sub.ctid;

ALTER TABLE "reviews" DROP CONSTRAINT "reviews_pkey";
ALTER TABLE "reviews" DROP COLUMN "id";
ALTER TABLE "reviews" RENAME COLUMN "id_new" TO "id";
ALTER SEQUENCE "reviews_id_new_seq" OWNED BY "reviews"."id";
ALTER TABLE "reviews" ALTER COLUMN "id" SET DEFAULT nextval('"reviews_id_new_seq"');
ALTER TABLE "reviews" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_userId_movieId_key') THEN
    CREATE UNIQUE INDEX "reviews_userId_movieId_key" ON "reviews"("userId","movieId");
  END IF;
END $$;

SELECT setval('"reviews_id_new_seq"',
              (SELECT COALESCE(MAX("id"), 0) FROM "reviews"),
              true);

DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM "reviews";
  RAISE NOTICE 'Wave B.2 OK — reviews=%', v_count;
END $$;

COMMIT;
