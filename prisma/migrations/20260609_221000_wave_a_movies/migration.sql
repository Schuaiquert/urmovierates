-- =================================================================
-- Wave A.2 — movies.id: TEXT (uuid) → INTEGER IDENTITY
-- Filhas em movies: reviews, favorites, movie_genres.
-- Estratégia: cria sequence, id_new em movies, mapeia FKs em filhas,
-- dropa constraints, dropa colunas textuais, renomeia, recria.
-- Pré-validação: movies=43, reviews=7, favorites=5, movie_genres=78.
-- =================================================================

BEGIN;

-- 1) Sequence + coluna nova em movies
CREATE SEQUENCE IF NOT EXISTS "movies_id_new_seq";
ALTER TABLE "movies" ADD COLUMN "id_new" INTEGER NOT NULL DEFAULT nextval('"movies_id_new_seq"');

-- 2) Popula com row_number() determinístico
UPDATE "movies" SET "id_new" = sub.rn
FROM (SELECT ctid, ROW_NUMBER() OVER (ORDER BY ctid) AS rn FROM "movies") sub
WHERE "movies".ctid = sub.ctid;

-- 3) Colunas FK temporárias nas filhas
ALTER TABLE "reviews"      ADD COLUMN "movieId_new" INTEGER;
ALTER TABLE "favorites"    ADD COLUMN "movieId_new" INTEGER;
ALTER TABLE "movie_genres" ADD COLUMN "movieId_new" INTEGER;

-- 4) Popula FKs via JOIN
UPDATE "reviews"      r SET "movieId_new" = m."id_new" FROM "movies" m WHERE m."id" = r."movieId";
UPDATE "favorites"    f SET "movieId_new" = m."id_new" FROM "movies" m WHERE m."id" = f."movieId";
UPDATE "movie_genres" mg SET "movieId_new" = m."id_new" FROM "movies" m WHERE m."id" = mg."movieId";

-- 5) Sanidade
DO $$
DECLARE
  v_n_r INTEGER; v_n_f INTEGER; v_n_mg INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_n_r  FROM "reviews"      WHERE "movieId_new" IS NULL;
  SELECT COUNT(*) INTO v_n_f  FROM "favorites"    WHERE "movieId_new" IS NULL;
  SELECT COUNT(*) INTO v_n_mg FROM "movie_genres" WHERE "movieId_new" IS NULL;
  IF v_n_r > 0 OR v_n_f > 0 OR v_n_mg > 0 THEN
    RAISE EXCEPTION 'FK remap falhou: reviews=% favorites=% movie_genres=%', v_n_r, v_n_f, v_n_mg;
  END IF;
END $$;

-- 6) Dropa FKs antigas
ALTER TABLE "reviews"      DROP CONSTRAINT IF EXISTS "reviews_movieId_fkey";
ALTER TABLE "favorites"    DROP CONSTRAINT IF EXISTS "favorites_movieId_fkey";
ALTER TABLE "movie_genres" DROP CONSTRAINT IF EXISTS "movie_genres_movieId_fkey";

-- 7) Dropa PK de movies
ALTER TABLE "movies" DROP CONSTRAINT "movies_pkey";

-- 8) Dropa colunas textuais antigas
ALTER TABLE "movies"        DROP COLUMN "id";
ALTER TABLE "reviews"       DROP COLUMN "movieId";
ALTER TABLE "favorites"     DROP COLUMN "movieId";
ALTER TABLE "movie_genres"  DROP COLUMN "movieId";

-- 9) Renomeia novas
ALTER TABLE "movies"        RENAME COLUMN "id_new"       TO "id";
ALTER TABLE "reviews"       RENAME COLUMN "movieId_new"  TO "movieId";
ALTER TABLE "favorites"     RENAME COLUMN "movieId_new"  TO "movieId";
ALTER TABLE "movie_genres"  RENAME COLUMN "movieId_new"  TO "movieId";

-- 10) Atribui sequence e default em movies
ALTER SEQUENCE "movies_id_new_seq" OWNED BY "movies"."id";
ALTER TABLE "movies" ALTER COLUMN "id" SET DEFAULT nextval('"movies_id_new_seq"');

-- 11) NOT NULL + recria PK
ALTER TABLE "movies"        ALTER COLUMN "id"      SET NOT NULL;
ALTER TABLE "reviews"       ALTER COLUMN "movieId" SET NOT NULL;
ALTER TABLE "favorites"     ALTER COLUMN "movieId" SET NOT NULL;
ALTER TABLE "movie_genres"  ALTER COLUMN "movieId" SET NOT NULL;
ALTER TABLE "movies"        ADD CONSTRAINT "movies_pkey" PRIMARY KEY ("id");

-- 12) Recria FKs (com MESMAS regras de cascade do baseline)
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_movieId_fkey"
  FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_movieId_fkey"
  FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movieId_fkey"
  FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 13) Reaplica UNIQUE composto em reviews e favorites
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_userId_movieId_key') THEN
    CREATE UNIQUE INDEX "reviews_userId_movieId_key" ON "reviews"("userId","movieId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'favorites_userId_movieId_key') THEN
    CREATE UNIQUE INDEX "favorites_userId_movieId_key" ON "favorites"("userId","movieId");
  END IF;
END $$;

-- 14) Sincroniza sequence
SELECT setval('"movies_id_new_seq"',
              (SELECT COALESCE(MAX("id"), 0) FROM "movies"),
              true);

-- 15) Validação final
DO $$
DECLARE
  v_count_movies INTEGER;
  v_orphan_r INTEGER; v_orphan_f INTEGER; v_orphan_mg INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_movies FROM "movies";
  SELECT COUNT(*) INTO v_orphan_r
    FROM "reviews" r LEFT JOIN "movies" m ON m."id" = r."movieId" WHERE m."id" IS NULL;
  SELECT COUNT(*) INTO v_orphan_f
    FROM "favorites" f LEFT JOIN "movies" m ON m."id" = f."movieId" WHERE m."id" IS NULL;
  SELECT COUNT(*) INTO v_orphan_mg
    FROM "movie_genres" mg LEFT JOIN "movies" m ON m."id" = mg."movieId" WHERE m."id" IS NULL;
  IF v_orphan_r > 0 OR v_orphan_f > 0 OR v_orphan_mg > 0 THEN
    RAISE EXCEPTION 'INTEGRITY FAIL pós-Wave A.2: reviews=% favorites=% movie_genres=%',
      v_orphan_r, v_orphan_f, v_orphan_mg;
  END IF;
  RAISE NOTICE 'Wave A.2 OK — movies=%', v_count_movies;
END $$;

COMMIT;
