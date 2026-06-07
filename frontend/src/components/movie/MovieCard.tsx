import Image from 'next/image';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { formatDate, formatDuration } from '@/lib/format';
import type { Movie } from '@/types';

export function MovieCard({ movie, priority = false }: { movie: Movie; priority?: boolean }) {
  const { id, title, year, poster, synopsis, active, createdAt, genres = [], duration } = movie;
  return (
    <Link href={`/movie/${id}`} className="block group">
      <article className="card-hover bg-dark-100 rounded-xl overflow-hidden border border-white/5 h-full flex flex-col">
        <div className="relative aspect-[2/3] bg-dark-300 flex-shrink-0 overflow-hidden">
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={priority}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700">
              <Film className="w-16 h-16" strokeWidth={1} />
            </div>
          )}
          {!active && (
            <Badge variant="default" className="absolute top-2 right-2">Inativo</Badge>
          )}
          {duration && (
            <Badge variant="primary" className="absolute bottom-2 right-2 bg-black/70 border-white/10">
              {formatDuration(duration)}
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-dark-100 to-transparent pointer-events-none" />
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-lg text-gray-100 truncate mb-1">{title}</h3>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <p className="text-gray-500 text-sm">{year}</p>
            {genres.slice(0, 2).map((g, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-dark-300 rounded text-gray-400 capitalize">{g.name}</span>
            ))}
            {genres.length > 2 && (
              <span className="text-xs px-2 py-0.5 bg-dark-300 rounded text-gray-400">+{genres.length - 2}</span>
            )}
          </div>
          {synopsis && <p className="text-gray-400 text-sm line-clamp-2 flex-1">{synopsis}</p>}
          <p className="text-gray-600 text-xs mt-3">Adicionado {formatDate(createdAt)}</p>
        </div>
      </article>
    </Link>
  );
}
