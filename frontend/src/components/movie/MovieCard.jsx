import { Link } from 'react-router-dom'
import { Badge } from '../common'

export default function MovieCard({ movie }) {
  const {
    id,
    title,
    year,
    poster,
    synopsis,
    active = true,
    createdAt,
    genre,
    duration,
    genres = [],
  } = movie

  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const formatDuration = (minutes) => {
    if (!minutes) return null
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const displayGenres = genres.length > 0 ? genres : (genre ? [{ name: genre }] : [])

  return (
    <Link to={`/movie/${id}`} className="block">
      <div className="card h-full flex flex-col">
        {/* Poster */}
        <div className="relative aspect-[2/3] bg-dark-300 flex-shrink-0 overflow-hidden">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentNode.classList.add('flex', 'items-center', 'justify-center')
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🎬
            </div>
          )}

          {/* Status Badge */}
          {!active && (
            <Badge variant="default" className="absolute top-2 right-2">
              Inativo
            </Badge>
          )}

          {/* Duration Badge */}
          {duration && (
            <Badge variant="primary" className="absolute bottom-2 right-2 bg-black/70">
              {formatDuration(duration)}
            </Badge>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-dark-100 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-lg text-gray-100 truncate mb-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-gray-500 text-sm">{year}</p>
            {displayGenres.slice(0, 2).map((g, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-dark-300 rounded text-gray-400">
                {g.name}
              </span>
            ))}
            {displayGenres.length > 2 && (
              <span className="text-xs px-2 py-0.5 bg-dark-300 rounded text-gray-400">
                +{displayGenres.length - 2}
              </span>
            )}
          </div>

          {synopsis && (
            <p className="text-gray-400 text-sm line-clamp-2 flex-1">
              {synopsis}
            </p>
          )}

          <p className="text-gray-600 text-xs mt-3">
            Added {formattedDate}
          </p>
        </div>
      </div>
    </Link>
  )
}