'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Rating } from '@/components/common/Rating';

const MAX_CHARS = 1000;
const RATING_LABEL: Record<number, string> = {
  1: 'Não gostou', 2: 'Regular', 3: 'Bom', 4: 'Ótimo', 5: 'Excelente!',
};

interface ReviewFormProps {
  /** Se informado, o formulário entra em modo "edição". */
  initialValues?: { rating: number; text: string };
  onSubmit: (data: { rating: number; text: string }) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export function ReviewForm({
  initialValues,
  onSubmit,
  loading,
  submitLabel = 'Publicar Avaliação',
}: ReviewFormProps) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(initialValues?.rating ?? 0);
  const [text, setText] = useState(initialValues?.text ?? '');
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="bg-dark-100 rounded-xl p-6 text-center border border-white/5">
        <p className="text-gray-300 mb-4">Faça login para avaliar este filme</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">Entrar</Link>
          <Link href="/register" className="px-6 py-2 bg-dark-300 hover:bg-dark-100 text-gray-200 rounded-lg transition-colors">Cadastrar</Link>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Selecione uma nota de 1 a 5'); return; }
    setError('');
    try {
      await onSubmit({ rating, text });
      if (!initialValues) {
        setRating(0);
        setText('');
      }
    } catch (e) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Erro ao salvar avaliação');
    }
  };

  return (
    <form onSubmit={submit} className="bg-dark-100 rounded-xl p-6 border border-white/5">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        {initialValues ? 'Editar avaliação' : 'Avalie este filme'}
      </h3>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-3">Sua nota</label>
        <Rating value={rating} size="lg" interactive onChange={setRating} />
        {rating > 0 && <p className="text-sm text-gray-500 mt-1">{RATING_LABEL[rating]}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Seu comentário <span className="text-gray-600">(opcional)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="O que você achou do filme? Conte sua experiência..."
          className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 min-h-[120px] resize-none transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          rows={4}
        />
        <p className="text-gray-600 text-xs mt-1 text-right">{text.length}/{MAX_CHARS}</p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <Button type="submit" loading={loading} disabled={rating === 0} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
