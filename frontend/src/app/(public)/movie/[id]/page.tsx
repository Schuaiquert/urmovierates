import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MovieSchema } from '@/components/seo/MovieSchema';
import { MovieDetail } from './movie-detail';
import type { Movie, Review, ReviewStats } from '@/types';

interface PageProps { params: { id: string }; }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

async function fetchMovie(id: string): Promise<{ movie?: Movie; reviews: Review[]; stats: ReviewStats }> {
  try {
    const movieRes = await fetch(`${API_BASE}/api/movies/${id}`, { cache: 'no-store' });
    if (!movieRes.ok) return { reviews: [], stats: { average: 0, count: 0 } };
    const movieJson = (await movieRes.json()) as { data: Movie };
    const [reviewsRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/api/reviews/movies/${id}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() as Promise<{ data: Review[] }> : { data: [] as Review[] }))
        .catch(() => ({ data: [] as Review[] })),
      fetch(`${API_BASE}/api/reviews/movies/${id}/stats`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() as Promise<{ data: ReviewStats }> : { data: { average: 0, count: 0 } as ReviewStats }))
        .catch(() => ({ data: { average: 0, count: 0 } as ReviewStats })),
    ]);
    return {
      movie: movieJson.data,
      reviews: reviewsRes.data,
      stats: statsRes.data,
    };
  } catch {
    return { reviews: [], stats: { average: 0, count: 0 } };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { movie } = await fetchMovie(params.id);
  if (!movie) return { title: 'Filme não encontrado' };
  return {
    title: movie.title,
    description: movie.synopsis ?? `Avaliações e informações sobre ${movie.title} (${movie.year}).`,
    openGraph: {
      title: `${movie.title} (${movie.year})`,
      description: movie.synopsis ?? undefined,
      images: movie.poster ? [{ url: movie.poster }] : undefined,
      type: 'video.movie',
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { movie, reviews, stats } = await fetchMovie(params.id);
  if (!movie) notFound();
  return (
    <>
      <MovieSchema movie={movie} stats={stats} />
      <MovieDetail initialMovie={movie} initialReviews={reviews} initialStats={stats} />
    </>
  );
}
