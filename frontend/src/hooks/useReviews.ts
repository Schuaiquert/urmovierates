'use client';

import { useCallback, useEffect, useState } from 'react';
import { reviewsAPI } from '@/services/api';
import { emitDataChanged } from '@/hooks/useDataChanged';
import type { Review, ReviewStats } from '@/types';

export function useMovieReviews(movieId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!movieId) return;
    setLoading(true);
    setError(null);
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        reviewsAPI.getByMovie(movieId),
        reviewsAPI.getMovieStats(movieId),
      ]);
      setReviews(reviewsRes.data.data);
      setStats(statsRes.data.data);
    } catch (e: unknown) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Erro ao carregar reviews');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const createReview = async (payload: { rating: number; text?: string }) => {
    const { data } = await reviewsAPI.create({ ...payload, movieId });
    setReviews((prev) => [data.data, ...prev]);
    emitDataChanged({ kind: 'review:created', movieId });
    await fetchReviews();
    return data.data;
  };

  const updateReview = async (id: string, payload: { rating: number; text?: string }) => {
    const { data } = await reviewsAPI.update(id, payload);
    setReviews((prev) => prev.map((r) => (r.id === id ? data.data : r)));
    emitDataChanged({ kind: 'review:updated', movieId });
    await fetchReviews();
  };

  const deleteReview = async (id: string, reason: string) => {
    if (!reason || !reason.trim()) {
      throw new Error('Motivo da exclusão é obrigatório');
    }
    await reviewsAPI.remove(id, reason.trim());
    setReviews((prev) => prev.filter((r) => r.id !== id));
    emitDataChanged({ kind: 'review:deleted', movieId });
    await fetchReviews();
  };

  return { reviews, stats, loading, error, createReview, updateReview, deleteReview, refetch: fetchReviews };
}
