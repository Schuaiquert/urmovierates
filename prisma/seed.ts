import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@urmovierates.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@urmovierates.com',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // admin123 (bcrypt hash placeholder)
      role: 'ADMIN',
    },
  });

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@urmovierates.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'user@urmovierates.com',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // user123 (bcrypt hash placeholder)
      role: 'USER',
    },
  });

  // Create genres
  const genreNames = ['Ação', 'Comédia', 'Drama', 'Ficção Científica', 'Terror', 'Romance', 'Animação'];
  const createdGenres: Record<string, string> = {};

  for (const name of genreNames) {
    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    createdGenres[name] = genre.id;
  }

  // Create sample movies with genres
  const movies = [
    {
      id: 'the-shawshank-redemption',
      title: 'The Shawshank Redemption',
      synopsis: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      year: 1994,
      poster: 'https://example.com/shawshank.jpg',
      trailer: 'https://youtube.com/watch?v=6hB3S9bIaco',
      genres: ['Drama'],
    },
    {
      id: 'the-godfather',
      title: 'The Godfather',
      synopsis: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
      year: 1972,
      poster: 'https://example.com/godfather.jpg',
      trailer: 'https://youtube.com/watch?v=sY1S34973zA',
      genres: ['Drama', 'Ação'],
    },
    {
      id: 'the-dark-knight',
      title: 'The Dark Knight',
      synopsis: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      year: 2008,
      poster: 'https://example.com/darkknight.jpg',
      trailer: 'https://youtube.com/watch?v=EXeTwQWrcwY',
      genres: ['Ação', 'Drama', 'Ficção Científica'],
    },
    {
      id: 'pulp-fiction',
      title: 'Pulp Fiction',
      synopsis: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      year: 1994,
      poster: 'https://example.com/pulp.jpg',
      trailer: 'https://youtube.com/watch?v=s7ewQ7bp4y0',
      genres: ['Drama', 'Comédia'],
    },
    {
      id: 'forrest-gump',
      title: 'Forrest Gump',
      synopsis: 'The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.',
      year: 1994,
      poster: 'https://example.com/forrestgump.jpg',
      trailer: 'https://youtube.com/watch?v=bLvqoHBptjg',
      genres: ['Drama', 'Romance'],
    },
  ];

  for (const movie of movies) {
    const { genres, ...movieData } = movie;
    const created = await prisma.movie.upsert({
      where: { id: movie.id },
      update: {},
      create: movieData,
    });

    // Connect genres using upsert for each relation
    for (const genreName of genres) {
      const genreId = createdGenres[genreName];
      if (genreId) {
        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: {
              movieId: created.id,
              genreId: genreId
            }
          },
          update: {},
          create: { movieId: created.id, genreId },
        });
      }
    }
  }

  console.log('✅ Seeding completed');
  console.log(`   Admin user: ${admin.email}`);
  console.log(`   Regular user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });