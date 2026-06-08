'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Film } from 'lucide-react';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { FilterBar } from '@/components/movie/FilterBar';
import { Pagination, EmptyState, ErrorState } from '@/components/common';
import { moviesAPI } from '@/services/api';
import { useLayoutContext } from '@/contexts/LayoutContext';
import type { Movie, Pagination as PaginationT } from '@/types';

interface Props {
  initialMovies: Movie[];
  initialPagination?: PaginationT;
  initialParams: Record<string, string>;
}

export function HomeClient({ initialMovies, initialPagination, initialParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { refreshKey } = useLayoutContext();

  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [pagination, setPagination] = useState<PaginationT>(initialPagination ?? { page: 1, limit: 12, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the last params we already fetched for, so the effect only fires
  // when the URL (or refreshKey) actually changes. Without this, the App
  // Router returns a fresh searchParams ref on every render and would
  // re-fetch on every keystroke / re-render.
  const lastKey = useRef<string>('');

  const refetch = useCallback(async (paramsString: string) => {
    setLoading(true); setError(null);
    const url = new URLSearchParams(paramsString);
    const params: Record<string, unknown> = { page: url.get('page') ?? '1', limit: 12 };
    const search = url.get('search'); if (search) params.search = search;
    const year = url.get('year'); if (year) params.year = year;
    const genre = url.get('genre'); if (genre) params.genre = genre;
    const active = url.get('active');
    if (active === 'true') params.active = true;
    else if (active === 'false') params.active = false;
    try {
      const { data } = await moviesAPI.getAll(params);
      setMovies(data.data);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: unknown) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Erro ao carregar filmes');
    }
    finally { setLoading(false); }
  }, []);

  const paramsKey = searchParams?.toString() ?? '';

  useEffect(() => {
    const key = `${paramsKey}|${refreshKey}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    refetch(paramsKey);
  }, [paramsKey, refreshKey, refetch]);

  const onPage = (p: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('page', String(p));
    router.replace(`${pathname ?? '/'}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const total = pagination.total;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 text-left">Filmes</h1>
      <div className="mt-3 mb-4"><FilterBar /></div>
      <p className="text-gray-500 text-left mb-6">
        {total > 0 ? `${total} filme${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}` : 'Nenhum filme encontrado'}
      </p>
      {error ? (
        <ErrorState message={error} onRetry={() => refetch(paramsKey)} />
      ) : movies.length === 0 ? (
        <EmptyState
          icon={Film}
          message={initialParams.search || initialParams.year ? 'Nenhum filme matches seus filtros' : 'Nenhum filme cadastrado'}
          action="Limpar filtros"
          onAction={() => router.replace(pathname ?? '/')}
        />
      ) : (
        <>
          <MovieGrid movies={movies} loading={loading} />
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={onPage} />
        </>
      )}
    </div>
  );
}
