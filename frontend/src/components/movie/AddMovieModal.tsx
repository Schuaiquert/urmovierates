'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MovieFormFields, type MovieFormValues } from './MovieFormFields';
import { moviesAPI } from '@/services/api';
import { emitDataChanged } from '@/hooks/useDataChanged';
import type { AxiosError } from 'axios';

interface Props { open: boolean; onClose: () => void; onAdded: () => void; }

const EMPTY: MovieFormValues = { title: '', year: '', synopsis: '', poster: '', trailer: '', genres: [], duration: '' };

export function AddMovieModal({ open, onClose, onAdded }: Props) {
  const [values, setValues] = useState<MovieFormValues>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await moviesAPI.create({
        title: values.title,
        year: parseInt(values.year) || undefined,
        duration: parseInt(values.duration) || undefined,
        synopsis: values.synopsis || undefined,
        poster: values.poster || undefined,
        trailer: values.trailer || undefined,
        genres: values.genres,
      });
      emitDataChanged({ kind: 'movie:created', movieId: data.data.id });
      setValues(EMPTY);
      onAdded();
    } catch (e) {
      const err = e as AxiosError<{ error?: string }>;
      setError(err.response?.data?.error ?? err.message ?? 'Erro ao adicionar filme');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Novo Filme" size="md">
      <form onSubmit={submit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <MovieFormFields values={values} onChange={setValues} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Adicionar</Button>
        </div>
      </form>
    </Modal>
  );
}
