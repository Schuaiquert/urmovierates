'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Film } from 'lucide-react';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { FilterBar } from '@/components/movie/FilterBar';
import { Pagination, EmptyState, ErrorState } from '@/components/common';
import { moviesAPI } from '@/services/api';
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
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [pagination, setPagination] = useState<PaginationT>(initialPagination ?? { page: 1, limit: 12, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshKey = typeof document !== 'undefined'
    ? document.querySelector('main')?.getAttribute('data-refresh-key') ?? '0'
    : '0';

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    const params: Record<string, unknown> = { page: searchParams?.get('page') ?? '1', limit: 12 };
    const search = searchParams?.get('search'); if (search) params.search = search;
    const year = searchParams?.get('year'); if (year) params.year = year;
    const genre = searchParams?.get('genre'); if (genre) params.genre = genre;
    const active = searchParams?.get('active');
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
  }, [searchParams]);

  useEffect(() => { refetch(); }, [refetch, refreshKey]);

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
        <ErrorState message={error} onRetry={refetch} />
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
