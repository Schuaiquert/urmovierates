'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { moviesAPI } from '@/services/api';
import type { Movie, Pagination } from '@/types';

export function useMovies(params: Record<string, unknown> = {}) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const paramsKey = JSON.stringify(params);

  const fetchMovies = useCallback(async (extra: Record<string, unknown> = {}) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const { data } = await moviesAPI.getAll({ ...params, ...extra });
      setMovies(data.data);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: unknown) {
      const err = e as { name?: string; userMessage?: string };
      if (err.name !== 'CanceledError') {
        setError(err.userMessage ?? 'Erro ao carregar filmes');
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchMovies();
    return () => abortRef.current?.abort();
  }, [fetchMovies]);

  return { movies, pagination, loading, error, refetch: fetchMovies };
}

export function useMovie(id: string | undefined) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovie = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await moviesAPI.getById(id);
      setMovie(data.data);
    } catch (e: unknown) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Filme não encontrado');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMovie(); }, [fetchMovie]);

  return { movie, loading, error, refetch: fetchMovie };
}
