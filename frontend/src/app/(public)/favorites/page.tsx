'use client';

import { useState } from 'react';
import { Lock, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserFavorites } from '@/hooks/useFavorites';
import { useDataChanged } from '@/hooks/useDataChanged';
import { MovieCard } from '@/components/movie/MovieCard';
import { FavoriteButton } from '@/components/movie/FavoriteButton';
import { EmptyState, ErrorState, Pagination, MovieCardSkeleton } from '@/components/common';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { movies, pagination, loading, error, remove, refetch } = useUserFavorites();
  const [removing, setRemoving] = useState<string | null>(null);

  // Another tab/page (or a child component on the same page) added or
  // removed a favorite — re-fetch so this view stays in sync. The local
  // `remove` handler above already updates the list optimistically, but
  // re-fetching on the global event also covers add/remove from elsewhere.
  useDataChanged(
    () => { refetch(); },
    ['favorite:added', 'favorite:removed', 'favorite:toggled'],
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState icon={Lock} message="Você precisa estar logado para ver seus favoritos"
          action="Voltar para Home" onAction={() => (window.location.href = '/')} />
      </div>
    );
  }

  const handleRemove = async (movieId: string) => {
    setRemoving(movieId);
    try { await remove(movieId); }
    catch (e: unknown) {
      const err = e as { userMessage?: string };
      window.alert(err.userMessage ?? 'Erro ao remover favorito');
    }
    finally { setRemoving(null); }
  };

  const onPage = async () => {
    await refetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Meus Favoritos</h1>
        <p className="text-gray-500">
          {pagination.total > 0
            ? `${pagination.total} filme${pagination.total !== 1 ? 's' : ''} salvo${pagination.total !== 1 ? 's' : ''}`
            : 'Nenhum filme salvo'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 12 }, (_, i) => <MovieCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : movies.length === 0 ? (
        <EmptyState icon={Heart} message="Você ainda não tem filmes favoritos"
          action="Explorar filmes" onAction={() => (window.location.href = '/')} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="relative">
                <MovieCard movie={movie} />
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton
                    movieId={movie.id}
                    isFavorite={removing !== movie.id}
                    onToggle={handleRemove}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
          {pagination.pages > 1 && (
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={onPage} />
          )}
        </>
      )}
    </div>
  );
}
