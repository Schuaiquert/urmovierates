'use client';

import { useState } from 'react';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { GENRE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/cn';

export interface MovieFormValues {
  title: string;
  year: string;
  synopsis: string;
  poster: string;
  trailer: string;
  genres: string[];
  duration: string;
}

interface Props {
  values: MovieFormValues;
  onChange: (next: MovieFormValues) => void;
}

export function MovieFormFields({ values, onChange }: Props) {
  const set = <K extends keyof MovieFormValues>(k: K, v: MovieFormValues[K]) =>
    onChange({ ...values, [k]: v });

  const [genreOpen, setGenreOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Input label="Título" name="title" value={values.title}
        onChange={(e) => set('title', e.target.value)} required />
      <Input label="Ano" name="year" type="number" value={values.year}
        onChange={(e) => set('year', e.target.value)} required />

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Gêneros</label>
        <button type="button" onClick={() => setGenreOpen((o) => !o)}
          className="w-full bg-dark-300 text-left text-gray-100 rounded-lg px-3 py-2 border border-gray-600 hover:border-primary-500 focus:border-primary-500 focus:outline-none min-h-[42px] transition-colors"
        >
          {values.genres.length > 0 ? values.genres.join(', ') : 'Selecione os gêneros'}
        </button>
        {genreOpen && (
          <div className="mt-2 grid grid-cols-2 gap-1 p-2 bg-dark-300 border border-gray-600 rounded-lg max-h-56 overflow-y-auto scrollbar-thin">
            {GENRE_OPTIONS.map((g) => {
              const active = values.genres.includes(g);
              return (
                <button type="button" key={g} onClick={() =>
                  set('genres', active ? values.genres.filter((x) => x !== g) : [...values.genres, g])}
                  className={cn(
                    'text-left text-sm px-2 py-1.5 rounded transition-colors',
                    active ? 'bg-primary-600/20 text-primary-300' : 'text-gray-300 hover:bg-white/5',
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Input label="Duração (minutos)" name="duration" type="number" value={values.duration}
        onChange={(e) => set('duration', e.target.value)} />
      <Input label="Poster (URL)" name="poster" value={values.poster}
        onChange={(e) => set('poster', e.target.value)} />
      <Input label="Trailer (URL)" name="trailer" value={values.trailer}
        onChange={(e) => set('trailer', e.target.value)} />
      <Textarea label="Sinopse" name="synopsis" value={values.synopsis}
        onChange={(e) => set('synopsis', e.target.value)} rows={4} />
    </div>
  );
}
