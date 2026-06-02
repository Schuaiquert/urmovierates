import { useState } from 'react'

export default function FavoriteButton({ movieId, isFavorite, onToggle, size = 'md' }) {
  const [loading, setLoading] = useState(false)

  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl',
  }

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    try {
      await onToggle(movieId)
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`
        ${sizes[size]}
        flex items-center justify-center rounded-full
        transition-all duration-200
        ${isFavorite
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-dark-100/80 text-gray-400 hover:text-red-400 hover:bg-dark-100'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {loading ? (
        <span className="animate-pulse">⏳</span>
      ) : (
        <span className={isFavorite ? 'scale-110' : ''}>
          {isFavorite ? '❤️' : '🤍'}
        </span>
      )}
    </button>
  )
}