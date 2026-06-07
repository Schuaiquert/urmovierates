import { HomeClient } from './home-client';
import { moviesAPI } from '@/services/api';
import type { Movie, Pagination } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filmes',
  description: 'Veja todos os filmes cadastrados, filtre por gênero, ano ou status e descubra novas avaliações.',
};

async function fetchInitialMovies(searchParams: Record<string, string>) {
  const params: Record<string, unknown> = { page: searchParams.page ?? '1', limit: 12 };
  for (const k of ['search', 'year', 'genre'] as const) {
    if (searchParams[k]) params[k] = searchParams[k];
  }
  if (searchParams.active) params.active = searchParams.active === 'true';
  try {
    const { data } = await moviesAPI.getAll(params);
    return { movies: data.data as Movie[], pagination: data.pagination as Pagination | undefined };
  } catch {
    return { movies: [] as Movie[], pagination: undefined as Pagination | undefined };
  }
}

export default async function Page({ searchParams }: { searchParams: Record<string, string> }) {
  const { movies, pagination } = await fetchInitialMovies(searchParams);
  return <HomeClient initialMovies={movies} initialPagination={pagination} initialParams={searchParams} />;
}
