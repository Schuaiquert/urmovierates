import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { moviesAPI, reviewsAPI } from '@/services/api';
import { MovieSchema } from '@/components/seo/MovieSchema';
import { MovieDetail } from './movie-detail';
import type { Movie, Review, ReviewStats } from '@/types';

interface PageProps { params: { id: string }; }

async function fetchMovie(id: string): Promise<{ movie?: Movie; reviews: Review[]; stats: ReviewStats }> {
  try {
    const movieRes = await moviesAPI.getById(id);
    const [reviewsRes, statsRes] = await Promise.all([
      reviewsAPI.getByMovie(id).catch(() => ({ data: { data: [] as Review[] } })),
      reviewsAPI.getMovieStats(id).catch(() => ({ data: { data: { average: 0, count: 0 } as ReviewStats } })),
    ]);
    return {
      movie: movieRes.data.data,
      reviews: reviewsRes.data.data,
      stats: statsRes.data.data,
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
