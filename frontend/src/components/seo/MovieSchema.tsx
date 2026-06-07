import type { Movie, ReviewStats } from '@/types';

export function MovieSchema({ movie, stats }: { movie: Movie; stats: ReviewStats }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    datePublished: String(movie.year),
    image: movie.poster ?? undefined,
    description: movie.synopsis ?? undefined,
    genre: movie.genres.map((g) => g.name),
    duration: movie.duration ? `PT${movie.duration}M` : undefined,
    aggregateRating: stats.count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: stats.average,
      bestRating: 5,
      ratingCount: stats.count,
    } : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
