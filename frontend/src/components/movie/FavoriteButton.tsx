'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  movieId: string;
  isFavorite: boolean;
  onToggle: (id: string) => Promise<unknown>;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' } as const;

export function FavoriteButton({ movieId, isFavorite, onToggle, size = 'md' }: Props) {
  const [loading, setLoading] = useState(false);
  const handle = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setLoading(true);
    try { await onToggle(movieId); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  return (
    <button
      type="button" onClick={handle} disabled={loading} aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={cn(
        SIZES[size],
        'flex items-center justify-center rounded-full transition-all duration-200',
        isFavorite ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                   : 'bg-dark-100/80 text-gray-400 hover:text-red-400 hover:bg-dark-100',
        'disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm',
      )}
    >
      {loading
        ? <Loader2 className="w-1/2 h-1/2 animate-spin" strokeWidth={2} />
        : <Heart className="w-1/2 h-1/2" strokeWidth={1.75} fill={isFavorite ? 'currentColor' : 'none'} />}
    </button>
  );
}
