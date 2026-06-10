-- =================================================================
-- Wave A.3 — users.id: TEXT (uuid) → INTEGER IDENTITY
-- Filhas em users: reviews, favorites, password_reset_tokens.
-- Pré-validação: users=9, reviews=7, favorites=5, pwt=0.
-- =================================================================

BEGIN;

-- 1) Sequence + coluna nova em users
CREATE SEQUENCE IF NOT EXISTS "users_id_new_seq";
ALTER TABLE "users" ADD COLUMN "id_new" INTEGER NOT NULL DEFAULT nextval('"users_id_new_seq"');

-- 2) Popula
UPDATE "users" SET "id_new" = sub.rn
FROM (SELECT ctid, ROW_NUMBER() OVER (ORDER BY ctid) AS rn FROM "users") sub
WHERE "users".ctid = sub.ctid;

-- 3) Colunas FK temporárias nas filhas
ALTER TABLE "reviews"              ADD COLUMN "userId_new" INTEGER;
ALTER TABLE "favorites"            ADD COLUMN "userId_new" INTEGER;
ALTER TABLE "password_reset_tokens" ADD COLUMN "userId_new" INTEGER;

-- 4) Popula FKs
UPDATE "reviews"              r SET "userId_new" = u."id_new" FROM "users" u WHERE u."id" = r."userId";
UPDATE "favorites"            f SET "userId_new" = u."id_new" FROM "users" u WHERE u."id" = f."userId";
UPDATE "password_reset_tokens" p SET "userId_new" = u."id_new" FROM "users" u WHERE u."id" = p."userId";

-- 5) Sanidade
DO $$
DECLARE
  v_n_r INTEGER; v_n_f INTEGER; v_n_p INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_n_r FROM "reviews"              WHERE "userId_new" IS NULL;
  SELECT COUNT(*) INTO v_n_f FROM "favorites"            WHERE "userId_new" IS NULL;
  SELECT COUNT(*) INTO v_n_p FROM "password_reset_tokens" WHERE "userId_new" IS NULL;
  IF v_n_r > 0 OR v_n_f > 0 OR v_n_p > 0 THEN
    RAISE EXCEPTION 'FK remap users falhou: reviews=% favorites=% pwt=%', v_n_r, v_n_f, v_n_p;
  END IF;
END $$;

-- 6) Dropa FKs antigas
ALTER TABLE "reviews"              DROP CONSTRAINT IF EXISTS "reviews_userId_fkey";
ALTER TABLE "favorites"            DROP CONSTRAINT IF EXISTS "favorites_userId_fkey";
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT IF EXISTS "password_reset_tokens_userId_fkey";

-- 7) Dropa PK de users
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";

-- 8) Dropa colunas textuais
ALTER TABLE "users"                 DROP COLUMN "id";
ALTER TABLE "reviews"              DROP COLUMN "userId";
ALTER TABLE "favorites"            DROP COLUMN "userId";
ALTER TABLE "password_reset_tokens" DROP COLUMN "userId";

-- 9) Renomeia novas
ALTER TABLE "users"                 RENAME COLUMN "id_new"     TO "id";
ALTER TABLE "reviews"              RENAME COLUMN "userId_new"  TO "userId";
ALTER TABLE "favorites"            RENAME COLUMN "userId_new"  TO "userId";
ALTER TABLE "password_reset_tokens" RENAME COLUMN "userId_new"  TO "userId";

-- 10) Sequence + default
ALTER SEQUENCE "users_id_new_seq" OWNED BY "users"."id";
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT nextval('"users_id_new_seq"');

-- 11) NOT NULL + recria PK
ALTER TABLE "users"                 ALTER COLUMN "id"     SET NOT NULL;
ALTER TABLE "reviews"              ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "favorites"            ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "password_reset_tokens" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "users"                ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- 12) Recria FKs (CASCADE em todas)
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 13) UNIQUE em email
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_email_key') THEN
    CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
  END IF;
END $$;

-- 14) Sincroniza sequence
SELECT setval('"users_id_new_seq"',
              (SELECT COALESCE(MAX("id"), 0) FROM "users"),
              true);

-- 15) Validação final
DO $$
DECLARE
  v_count_users INTEGER;
  v_orphan_r INTEGER; v_orphan_f INTEGER; v_orphan_p INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_users FROM "users";
  SELECT COUNT(*) INTO v_orphan_r FROM "reviews"              r LEFT JOIN "users" u ON u."id" = r."userId" WHERE u."id" IS NULL;
  SELECT COUNT(*) INTO v_orphan_f FROM "favorites"            f LEFT JOIN "users" u ON u."id" = f."userId" WHERE u."id" IS NULL;
  SELECT COUNT(*) INTO v_orphan_p FROM "password_reset_tokens" p LEFT JOIN "users" u ON u."id" = p."userId" WHERE u."id" IS NULL;
  IF v_orphan_r > 0 OR v_orphan_f > 0 OR v_orphan_p > 0 THEN
    RAISE EXCEPTION 'INTEGRITY FAIL pós-Wave A.3: reviews=% favorites=% pwt=%', v_orphan_r, v_orphan_f, v_orphan_p;
  END IF;
  RAISE NOTICE 'Wave A.3 OK — users=%', v_count_users;
END $$;

COMMIT;
