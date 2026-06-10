// scripts/db/audit.js
// Lê scripts/db/migration-audit.sql mas com queries que retornam dados via Prisma.
// Imprime contagens + checks de órfãos.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const queries = {
  counts: `
    SELECT 'users' AS tabela, COUNT(*)::int AS total FROM "users"
    UNION ALL SELECT 'movies',                COUNT(*)::int FROM "movies"
    UNION ALL SELECT 'genres',                COUNT(*)::int FROM "genres"
    UNION ALL SELECT 'favorites',             COUNT(*)::int FROM "favorites"
    UNION ALL SELECT 'reviews',               COUNT(*)::int FROM "reviews"
    UNION ALL SELECT 'password_reset_tokens', COUNT(*)::int FROM "password_reset_tokens"
    UNION ALL SELECT 'movie_genres',          COUNT(*)::int FROM "movie_genres"
    ORDER BY 1;
  `,
  orphans: `
    SELECT 'orphan_reviews_user'  AS check_name, COUNT(*)::int AS orphans
      FROM "reviews" r LEFT JOIN "users"  u ON u."id" = r."userId"  WHERE u."id" IS NULL
    UNION ALL
    SELECT 'orphan_reviews_movie', COUNT(*)
      FROM "reviews" r LEFT JOIN "movies" m ON m."id" = r."movieId" WHERE m."id" IS NULL
    UNION ALL
    SELECT 'orphan_favorites_user', COUNT(*)
      FROM "favorites" f LEFT JOIN "users"  u ON u."id" = f."userId"  WHERE u."id" IS NULL
    UNION ALL
    SELECT 'orphan_favorites_movie', COUNT(*)
      FROM "favorites" f LEFT JOIN "movies" m ON m."id" = f."movieId" WHERE m."id" IS NULL
    UNION ALL
    SELECT 'orphan_pwt_user', COUNT(*)
      FROM "password_reset_tokens" p LEFT JOIN "users" u ON u."id" = p."userId" WHERE u."id" IS NULL
    UNION ALL
    SELECT 'orphan_mg_movie', COUNT(*)
      FROM "movie_genres" mg LEFT JOIN "movies" m ON m."id" = mg."movieId" WHERE m."id" IS NULL
    UNION ALL
    SELECT 'orphan_mg_genre', COUNT(*)
      FROM "movie_genres" mg LEFT JOIN "genres" g ON g."id" = mg."genreId" WHERE g."id" IS NULL
    ORDER BY 1;
  `,
};

(async () => {
  try {
    console.log('=== COUNTS ===');
    console.table(await prisma.$queryRawUnsafe(queries.counts));
    console.log('=== ORPHANS ===');
    console.table(await prisma.$queryRawUnsafe(queries.orphans));
  } catch (e) {
    console.error('ERRO:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
