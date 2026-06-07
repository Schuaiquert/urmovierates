'use client';

import { useEffect, useState } from 'react';
import { MovieCard } from './MovieCard';
import { FavoriteButton } from './FavoriteButton';
import { MovieCardSkeleton } from '@/components/common/MovieCardSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteStatus } from '@/hooks/useFavorites';
import type { Movie } from '@/types';

export function MovieGrid({ movies, loading }: { movies: Movie[]; loading: boolean }) {
  const { user } = useAuth();
  const ids = movies.map((m) => m.id);
  const { favorites, toggle } = useFavoriteStatus(user ? ids : []);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => { setPending({}); }, [ids.join(',')]);

  const onToggle = async (movieId: string) => {
    if (!user) { window.alert('Faça login para favoritar filmes'); return; }
    setPending((p) => ({ ...p, [movieId]: !favorites[movieId] }));
    try { await toggle(movieId); }
    catch (e) {
      const err = e as { userMessage?: string };
      setPending((p) => ({ ...p, [movieId]: favorites[movieId] }));
      window.alert(err.userMessage ?? 'Erro ao favoritar');
      throw e;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {Array.from({ length: 12 }, (_, i) => <MovieCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {movies.map((movie, i) => (
        <div key={movie.id} className="relative">
          <MovieCard movie={movie} priority={i < 3} />
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton
              movieId={movie.id}
              isFavorite={pending[movie.id] ?? favorites[movie.id] ?? false}
              onToggle={onToggle}
              size="sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
