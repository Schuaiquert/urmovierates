const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const fmt = (rows) => JSON.stringify(rows, (_, v) => typeof v === 'bigint' ? Number(v) : v, 2);
(async () => {
  console.log('=== COUNTS ===');
  console.log('users:',           Number(await p.user.count()));
  console.log('movies:',          Number(await p.movie.count()));
  console.log('genres:',          Number(await p.genre.count()));
  console.log('reviews:',         Number(await p.review.count()));
  console.log('favorites:',       Number(await p.favorite.count()));
  console.log('password_reset_tokens:', Number(await p.passwordResetToken.count()));
  console.log('movie_genres (raw):', fmt(await p.$queryRawUnsafe('SELECT COUNT(*)::int AS c FROM "movie_genres"')));

  console.log('\n=== SAMPLE FK REMAP (Integer IDs) ===');
  const sample = await p.$queryRawUnsafe(`
    SELECT r."id" AS review_id, r."userId" AS user_id, r."movieId" AS movie_id,
           u."email", m."title"
    FROM "reviews" r
    JOIN "users" u ON u."id" = r."userId"
    JOIN "movies" m ON m."id" = r."movieId"
    LIMIT 3
  `);
  console.log(fmt(sample));

  console.log('\n=== ORPHAN CHECK (esperado: tudo 0) ===');
  const orph = await p.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*) FROM "reviews" r LEFT JOIN "users" u ON u."id"=r."userId" WHERE u."id" IS NULL) AS rev_user,
      (SELECT COUNT(*) FROM "reviews" r LEFT JOIN "movies" m ON m."id"=r."movieId" WHERE m."id" IS NULL) AS rev_movie,
      (SELECT COUNT(*) FROM "favorites" f LEFT JOIN "users" u ON u."id"=f."userId" WHERE u."id" IS NULL) AS fav_user,
      (SELECT COUNT(*) FROM "favorites" f LEFT JOIN "movies" m ON m."id"=f."movieId" WHERE m."id" IS NULL) AS fav_movie,
      (SELECT COUNT(*) FROM "password_reset_tokens" p LEFT JOIN "users" u ON u."id"=p."userId" WHERE u."id" IS NULL) AS pwt_user,
      (SELECT COUNT(*) FROM "movie_genres" mg LEFT JOIN "movies" m ON m."id"=mg."movieId" WHERE m."id" IS NULL) AS mg_movie,
      (SELECT COUNT(*) FROM "movie_genres" mg LEFT JOIN "genres" g ON g."id"=mg."genreId" WHERE g."id" IS NULL) AS mg_genre
  `);
  console.log(fmt(orph));

  console.log('\n=== SEQUENCES (cada PK deve ter a sua) ===');
  const seqs = await p.$queryRawUnsafe(`
    SELECT sequence_name FROM information_schema.sequences
    WHERE sequence_schema='public' AND sequence_name LIKE '%id_new_seq'
    ORDER BY sequence_name
  `);
  console.log(fmt(seqs));

  await p.$disconnect();
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
