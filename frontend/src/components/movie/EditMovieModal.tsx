'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MovieFormFields, type MovieFormValues } from './MovieFormFields';
import { moviesAPI } from '@/services/api';
import { emitDataChanged } from '@/hooks/useDataChanged';
import type { AxiosError } from 'axios';
import type { Movie } from '@/types';

interface Props { open: boolean; movie: Movie; onClose: () => void; onUpdated: () => void; }

export function EditMovieModal({ open, movie, onClose, onUpdated }: Props) {
  const [values, setValues] = useState<MovieFormValues>({
    title: movie.title, year: String(movie.year), synopsis: movie.synopsis ?? '',
    poster: movie.poster ?? '', trailer: movie.trailer ?? '',
    genres: movie.genres.map((g) => g.name), duration: movie.duration ? String(movie.duration) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) setError(''); }, [open]);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await moviesAPI.update(movie.id, {
        title: values.title,
        year: parseInt(values.year) || undefined,
        duration: parseInt(values.duration) || undefined,
        synopsis: values.synopsis || undefined,
        poster: values.poster || undefined,
        trailer: values.trailer || undefined,
        genres: values.genres,
      });
      // Tell the rest of the app (Home, Favorites, MovieDetail itself) that
      // this movie's data is stale and should be re-fetched. MovieDetail
      // filters on movieId and refetches its own copy; Home listens via
      // PublicLayout's refreshKey and refetches the list.
      emitDataChanged({ kind: 'movie:updated', movieId: data.data.id });
      onUpdated();
      onClose();
    } catch (e) {
      const err = e as AxiosError<{ error?: string }>;
      setError(err.response?.data?.error ?? err.message ?? 'Erro ao atualizar filme');
    } finally { setLoading(false); }
  }, [movie.id, values, onUpdated, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Editar Filme" size="md">
      <form onSubmit={submit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <MovieFormFields values={values} onChange={setValues} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
