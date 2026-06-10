-- =================================================================
-- Wave A.1 — genres.id: TEXT (uuid) → INTEGER IDENTITY
-- Filhas em genres: movie_genres (FK movie_genres_genreId_fkey).
-- Estratégia: in-place ALTER COLUMN ... TYPE INTEGER USING (ctid-hash não
-- serve); usamos o padrão "adiciona coluna nova + dropar antiga após
-- recriar FK". Para movie_genres.genreId: criar temp, popular, dropar
-- original, renomear.
-- =================================================================

BEGIN;

-- 1) Cria coluna nova em genres (INT, com sequence)
CREATE SEQUENCE IF NOT EXISTS "genres_id_new_seq";
ALTER TABLE "genres" ADD COLUMN "id_new" INTEGER NOT NULL DEFAULT nextval('"genres_id_new_seq"');

-- 2) Popula id_new com row_number() determinístico
UPDATE "genres" SET "id_new" = sub.rn
FROM (SELECT ctid, ROW_NUMBER() OVER (ORDER BY ctid) AS rn FROM "genres") sub
WHERE "genres".ctid = sub.ctid;

-- 3) Cria coluna temporária em movie_genres
ALTER TABLE "movie_genres" ADD COLUMN "genreId_new" INTEGER;

-- 4) Popula via JOIN
UPDATE "movie_genres" mg SET "genreId_new" = g."id_new"
FROM "genres" g WHERE g."id" = mg."genreId";

-- 5) Sanidade
DO $$
DECLARE v_null_mg INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_mg FROM "movie_genres" WHERE "genreId_new" IS NULL;
  IF v_null_mg > 0 THEN
    RAISE EXCEPTION 'FK remap falhou: % linhas movie_genres com genreId_new NULL', v_null_mg;
  END IF;
END $$;

-- 6) Dropa FK antiga e PK de genres
ALTER TABLE "movie_genres" DROP CONSTRAINT IF EXISTS "movie_genres_genreId_fkey";
ALTER TABLE "genres" DROP CONSTRAINT "genres_pkey";

-- 7) Dropa colunas antigas
ALTER TABLE "genres"       DROP COLUMN "id";
ALTER TABLE "movie_genres" DROP COLUMN "genreId";

-- 8) Renomeia as novas
ALTER TABLE "genres"       RENAME COLUMN "id_new"       TO "id";
ALTER TABLE "movie_genres" RENAME COLUMN "genreId_new" TO "genreId";

-- 9) Atribui a sequence à coluna id de genres (próximos INSERTs usam a sequence)
ALTER SEQUENCE "genres_id_new_seq" OWNED BY "genres"."id";
ALTER TABLE "genres" ALTER COLUMN "id" SET DEFAULT nextval('"genres_id_new_seq"');

-- 10) NOT NULL + recria PK
ALTER TABLE "genres" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "movie_genres" ALTER COLUMN "genreId" SET NOT NULL;
ALTER TABLE "genres" ADD CONSTRAINT "genres_pkey" PRIMARY KEY ("id");

-- 11) Recria FK
ALTER TABLE "movie_genres"
  ADD CONSTRAINT "movie_genres_genreId_fkey"
  FOREIGN KEY ("genreId") REFERENCES "genres"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 12) UNIQUE em name (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'genres_name_key') THEN
    CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");
  END IF;
END $$;

-- 13) Sincroniza sequence
SELECT setval('"genres_id_new_seq"',
              (SELECT COALESCE(MAX("id"), 0) FROM "genres"),
              true);

-- 14) Validação final
DO $$
DECLARE
  v_count_genres INTEGER;
  v_orphan_mg    INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_genres FROM "genres";
  SELECT COUNT(*) INTO v_orphan_mg
    FROM "movie_genres" mg LEFT JOIN "genres" g ON g."id" = mg."genreId" WHERE g."id" IS NULL;
  IF v_orphan_mg > 0 THEN
    RAISE EXCEPTION 'INTEGRITY FAIL pós-Wave A.1: movie_genres órfãos = %', v_orphan_mg;
  END IF;
  RAISE NOTICE 'Wave A.1 OK — genres=% linhas, movie_genres sem órfãos', v_count_genres;
END $$;

COMMIT;
