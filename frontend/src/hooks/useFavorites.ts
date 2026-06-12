'use client';

import { useCallback, useEffect, useState } from 'react';
import { favoritesAPI } from '@/services/api';
import { emitDataChanged } from '@/hooks/useDataChanged';
import type { Movie, Pagination } from '@/types';

export function useFavoriteStatus(movieIds: string[] = []) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = movieIds.join(',');

  const fetchStatus = useCallback(async () => {
    if (movieIds.length === 0) {
      setFavorites({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await favoritesAPI.getStatus(movieIds);
      setFavorites(data.data);
    } catch (e: unknown) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const toggle = async (movieId: string) => {
    const { data } = await favoritesAPI.toggle(movieId);
    setFavorites((prev) => ({ ...prev, [movieId]: data.data.favorited }));
    emitDataChanged({
      kind: data.data.favorited ? 'favorite:added' : 'favorite:removed',
      movieId,
    });
    return data.data;
  };

  return { favorites, loading, error, toggle, isFavorite: (id: string) => !!favorites[id], refetch: fetchStatus };
}

export function useUserFavorites(initialPage = 1) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async (page = initialPage) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await favoritesAPI.getUserFavorites({ page, limit: 12 });
      setMovies(data.data);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: unknown) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  }, [initialPage]);

  useEffect(() => { fetchFavorites(1); }, [fetchFavorites]);

  const remove = async (movieId: string) => {
    await favoritesAPI.remove(movieId);
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
    setPagination((prev) => ({ ...prev, total: Math.max(prev.total - 1, 0) }));
    emitDataChanged({ kind: 'favorite:removed', movieId });
  };

  return { movies, pagination, loading, error, refetch: () => fetchFavorites(pagination.page), remove };
}
