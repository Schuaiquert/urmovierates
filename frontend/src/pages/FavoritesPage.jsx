import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MovieCard, FavoriteButton } from '../components/movie'
import { EmptyState, Pagination, Spinner } from '../components/common'
import { useAuth } from '../context/AuthContext'
import { favoritesAPI } from '../services/api'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [movies, setMovies] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFavorites = async (page = 1) => {
    if (!user) {
      setMovies([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data } = await favoritesAPI.getUserFavorites(user.id, { page, limit: 12 })
      setMovies(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar favoritos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [user])

  const handlePageChange = (newPage) => {
    fetchFavorites(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRemoveFavorite = async (movieId) => {
    if (!user) return

    try {
      await favoritesAPI.remove(movieId, user.id)
      setMovies(prev => prev.filter(m => m.id !== movieId))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
    } catch (err) {
      alert(err.userMessage || 'Erro ao remover favorito')
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon="🔐"
          message="Você precisa estar logado para ver seus favoritos"
          action="Voltar para Home"
          onAction={() => window.location.href = '/'}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Meus Favoritos</h1>
        <p className="text-gray-500">
          {pagination.total > 0
            ? `${pagination.total} filme${pagination.total !== 1 ? 's' : ''} salvo${pagination.total !== 1 ? 's' : ''}`
            : 'Nenhum filme salvo'}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">{error}</div>
      ) : movies.length === 0 ? (
        <EmptyState
          icon="❤️"
          message="Você ainda não tem filmes favoritos"
          action="Explorar filmes"
          onAction={() => window.location.href = '/'}
        />
      ) : (
        <>
          {/* Movies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movies.map(movie => (
              <div key={movie.id} className="relative">
                <MovieCard movie={movie} />
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton
                    movieId={movie.id}
                    isFavorite={true}
                    onToggle={handleRemoveFavorite}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  )
}