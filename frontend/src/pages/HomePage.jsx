import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useOutletContext, Link } from 'react-router-dom'
import { Film } from 'lucide-react'
import { MovieCard, FilterBar, FavoriteButton } from '../components/movie'
import { Spinner, EmptyState, ErrorState, MovieCardSkeleton, Pagination } from '../components/common'
import { moviesAPI, favoritesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { refreshKey = 0 } = useOutletContext() || {}
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [favoriteStatus, setFavoriteStatus] = useState({})

  const { user } = useAuth()

  const page = parseInt(searchParams.get('page') || '1') || 1
  const search = searchParams.get('search') || ''
  const year = searchParams.get('year') || ''
  const genre = searchParams.get('genre') || ''
  const activeParam = searchParams.get('active')
  const active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined

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
  }, [fetchMovies, refreshKey])

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
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-100 text-left">Filmes</h1>

      {/* Filters */}
      <div className="mt-3 mb-4">
        <FilterBar />
      </div>

      {/* Count */}
      <p className="text-gray-500 text-left mb-6">
        {totalResults > 0
          ? `${totalResults} filme${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`
          : 'Nenhum filme encontrado'}
      </p>

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
          icon={Film}
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
    </div>
  )
}
