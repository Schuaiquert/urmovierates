import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MovieCard, MovieFilters, FavoriteButton, AddMovieModal } from '../components/movie'
import { Spinner, EmptyState, ErrorState, MovieCardSkeleton, Pagination } from '../components/common'
import { moviesAPI, favoritesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [favoriteStatus, setFavoriteStatus] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)

  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // Extract params once
  const page = parseInt(searchParams.get('page') || '1') || 1
  const search = searchParams.get('search') || ''
  const year = searchParams.get('year') || ''
  const genre = searchParams.get('genre') || ''
  const active = searchParams.get('active') !== 'false' ? true : undefined

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = { page, limit: 12 }
    if (search) params.search = search
    if (year) params.year = year
    if (genre) params.genre = genre
    if (active !== undefined) params.active = active

    try {
      const { data } = await moviesAPI.getAll(params)
      setMovies(data.data)
      setPagination(data.pagination)

      // Fetch favorite status for all movies
      if (user && data.data.length > 0) {
        const movieIds = data.data.map(m => m.id)
        try {
          const { data: favData } = await favoritesAPI.getStatus(user.id, movieIds)
          setFavoriteStatus(favData.data)
        } catch (e) {
          // Silently fail favorites - not critical
        }
      }
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar filmes')
    } finally {
      setLoading(false)
    }
  }, [page, search, year, genre, active, user])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleFavorite = async (movieId) => {
    if (!user) {
      alert('Faça login para favoritar filmes')
      return
    }

    try {
      const { data } = await favoritesAPI.toggle(movieId, user.id)
      setFavoriteStatus(prev => ({ ...prev, [movieId]: data.data.favorited }))
      return data.data
    } catch (err) {
      alert(err.userMessage || 'Erro ao favoritar')
      throw err
    }
  }

  const totalResults = pagination.total

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Filmes</h1>
          <p className="text-gray-500">
            {totalResults > 0
              ? `${totalResults} filme${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`
              : 'Nenhum filme encontrado'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Novo
          </button>
        )}
      </div>

      {/* Filters */}
      <MovieFilters key={showAddModal ? 'adding' : 'normal'} />

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMovies} />
      ) : movies.length === 0 ? (
        <EmptyState
          icon="🎬"
          message={search || year ? 'Nenhum filme matches seus filtros' : 'Nenhum filme cadastrado'}
          action="Limpar filtros"
          onAction={() => setSearchParams({})}
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
                    isFavorite={favoriteStatus[movie.id] || false}
                    onToggle={handleToggleFavorite}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {showAddModal && (
        <AddMovieModal
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            fetchMovies()
            setRefreshKey(k => k + 1)
          }}
        />
      )}
    </div>
  )
}