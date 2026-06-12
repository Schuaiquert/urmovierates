'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, ArrowLeft, Pencil, PlayCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useMovieReviews } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useDataChanged } from '@/hooks/useDataChanged';
import { moviesAPI } from '@/services/api';
import { ReviewForm, ReviewCard, EditReviewModal } from '@/components/review';
import { EditMovieModal } from '@/components/movie/EditMovieModal';
import { Spinner, Button, Rating } from '@/components/common';
import { formatDuration } from '@/lib/format';
import type { Movie, Review, ReviewStats } from '@/types';

interface Props { initialMovie: Movie; initialReviews: Review[]; initialStats: ReviewStats; }

export function MovieDetail({ initialMovie, initialReviews, initialStats }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { reviews, stats, loading, createReview, updateReview, deleteReview, refetch } =
    useMovieReviews(initialMovie.id);
  const [hydrated] = useState(() => ({ reviews: initialReviews, stats: initialStats }));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [movie, setMovie] = useState(initialMovie);

  // Auto-refresh the movie record whenever another surface (or this same modal
  // via window event) signals a movie:updated for THIS id. We also re-run on
  // mount so navigating from the Home into a freshly-edited movie shows the
  // latest server state.
  const refetchMovie = useCallback(async () => {
    try {
      const { data } = await moviesAPI.getById(initialMovie.id);
      if (data.data) setMovie(data.data);
    } catch {
      // Silent: MovieDetail is decorative; the parent layout already shows
      // 404s for missing movies via the server-rendered page.
    }
  }, [initialMovie.id]);

  useDataChanged(
    (detail) => {
      if (detail.kind === 'movie:updated' && String(detail.movieId) === String(initialMovie.id)) {
        refetchMovie();
      }
    },
    'movie:updated',
  );

  const handleCreate = async (data: { rating: number; text: string }) => {
    setSubmitting(true);
    try { await createReview(data); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    finally { setSubmitting(false); }
  };

  const handleSaveEdit = async (data: { rating: number; text: string }) => {
    if (!editingReview) return;
    setSavingEdit(true);
    try {
      await updateReview(editingReview.id, data);
      setEditingReview(null);
    } catch (e: unknown) {
      const err = e as { userMessage?: string };
      window.alert(err.userMessage ?? 'Erro ao salvar edição');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    const reason = window.prompt('Motivo da exclusão (obrigatório):');
    if (!reason || !reason.trim()) {
      window.alert('É necessário informar um motivo para excluir.');
      return;
    }
    try { await deleteReview(id, reason.trim()); }
    catch (e: unknown) {
      const err = e as { userMessage?: string };
      window.alert(err.userMessage ?? 'Erro ao excluir avaliação');
    }
  };

  const displayReviews = reviews.length > 0 ? reviews : hydrated.reviews;
  const displayStats = stats.count > 0 ? stats : hydrated.stats;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />Voltar para filmes
      </Link>

      <div className="grid lg:grid-cols-[300px_1fr] gap-8 mb-12">
        <div className="flex-shrink-0">
          <div className="sticky top-24 aspect-[2/3] bg-dark-300 rounded-xl overflow-hidden flex items-center justify-center">
            {movie.poster ? (
              <Image src={movie.poster} alt={movie.title} fill sizes="(max-width: 1024px) 100vw, 300px"
                className="object-cover" priority unoptimized />
            ) : (
              <Film className="w-24 h-24 text-gray-700" strokeWidth={1} />
            )}
          </div>
        </div>

        <div>
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">{movie.title}</h1>
            <p className="text-xl text-gray-400">
              {movie.year}{movie.duration ? ` · ${formatDuration(movie.duration)}` : ''}
            </p>
          </div>

          {displayStats.count > 0 && (
            <div className="flex items-center gap-6 p-6 bg-dark-100 rounded-xl mb-6 border border-white/5">
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-400">{displayStats.average}</div>
                <div className="text-yellow-400 text-sm mt-1">de 5</div>
              </div>
              <div className="flex-1">
                <Rating value={Math.round(displayStats.average)} size="lg" />
                <p className="text-gray-400 mt-2">
                  Baseado em <span className="text-gray-300">{displayStats.count}</span> avaliaç{displayStats.count !== 1 ? 'ões' : 'ão'}
                </p>
              </div>
            </div>
          )}

          {movie.genres.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span key={g.id} className="text-xs px-2 py-1 bg-dark-300 rounded text-gray-300 capitalize">{g.name}</span>
              ))}
            </div>
          )}

          {movie.synopsis && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-3">Sinopse</h2>
              <p className="text-gray-300 leading-relaxed">{movie.synopsis}</p>
            </div>
          )}

          {isAdmin && (
            <div className="mb-6">
              <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
                <Pencil className="w-4 h-4" strokeWidth={2} />Editar Filme
              </Button>
            </div>
          )}

          {movie.trailer && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-3">Trailer</h2>
              <a href={movie.trailer} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                <PlayCircle className="w-5 h-5" strokeWidth={1.75} />Assistir no YouTube
              </a>
            </div>
          )}

          {movie.active && (
            <div className="mt-8">
              <ReviewForm onSubmit={handleCreate} loading={submitting} />
              {success && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" strokeWidth={2} />
                  <p className="text-green-400 text-sm">Avaliação publicada com sucesso!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">
          Avaliações {displayStats.count > 0 && `(${displayStats.count})`}
        </h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : displayReviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-100 text-gray-500 mb-4">
              <MessageSquare className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <p className="text-gray-300 text-lg">Este filme ainda não tem avaliações.</p>
            <p className="text-gray-500 text-sm mt-1">Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayReviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                currentUserId={user?.id}
                isAdmin={isAdmin}
                onEdit={
                  user && r.userId === user.id && !r.isDeleted
                    ? () => setEditingReview(r)
                    : undefined
                }
                onDelete={
                  user && (r.userId === user.id || isAdmin) && !r.isDeleted
                    ? () => handleDelete(r.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditMovieModal open={editing} movie={movie} onClose={() => setEditing(false)}
          onUpdated={async () => { setEditing(false); await refetch(); }} />
      )}

      {editingReview && (
        <EditReviewModal
          open={!!editingReview}
          review={editingReview}
          loading={savingEdit}
          onClose={() => setEditingReview(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
