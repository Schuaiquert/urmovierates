import { HomeClient } from './home-client';
import { moviesAPI } from '@/services/api';
import { API_HEADERS } from '@/lib/api-config';
import type { Movie, Pagination } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filmes',
  description: 'Veja todos os filmes cadastrados, filtre por gênero, ano ou status e descubra novas avaliações.',
};

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

async function fetchInitialMovies(searchParams: Record<string, string>) {
  const params: Record<string, unknown> = { page: searchParams.page ?? '1', limit: 12 };
  for (const k of ['search', 'year', 'genre'] as const) {
    if (searchParams[k]) params[k] = searchParams[k];
  }
  if (searchParams.active) params.active = searchParams.active === 'true';
  try {
    const url = new URL('/api/movies', API_BASE);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const res = await fetch(url.toString(), { cache: 'no-store', headers: API_HEADERS });
    if (!res.ok) return { movies: [] as Movie[], pagination: undefined as Pagination | undefined };
    const json = (await res.json()) as { data: Movie[]; pagination?: Pagination };
    return { movies: json.data, pagination: json.pagination };
  } catch {
    return { movies: [] as Movie[], pagination: undefined as Pagination | undefined };
  }
}

export default async function Page({ searchParams }: { searchParams: Record<string, string> }) {
  const { movies, pagination } = await fetchInitialMovies(searchParams);
  return <HomeClient initialMovies={movies} initialPagination={pagination} initialParams={searchParams} />;
}
