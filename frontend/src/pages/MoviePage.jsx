import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Film,
  ArrowLeft,
  Pencil,
  PlayCircle,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'
import { useMovie } from '../hooks/useMovies'
import { useMovieReviews } from '../hooks/useReviews'
import { useAuth } from '../context/AuthContext'
import { ReviewForm, ReviewCard } from '../components/review'
import { EditMovieModal } from '../components/movie/EditMovieModal'
import { Spinner, Button, Rating, EmptyState, ErrorState } from '../components/common'

export default function MoviePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { movie, loading: movieLoading, error: movieError, refetch: refetchMovie } = useMovie(id)
  const { reviews, stats, loading: reviewsLoading, createReview, deleteReview } = useMovieReviews(id)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  const handleCreateReview = async (reviewData) => {
    if (!user) return
    setSubmitting(true)
    try {
      await createReview({ ...reviewData, userId: user.id })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      try {
        await deleteReview(reviewId)
      } catch (err) {
        alert(err.userMessage || 'Erro ao excluir avaliação')
      }
    }
  }

  if (movieLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (movieError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState message={movieError} onRetry={refetchMovie} />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState icon={Film} message="Filme não encontrado" />
      </div>
    )
  }

  const {
    title,
    year,
    poster,
    synopsis,
    trailer,
    active = true,
  } = movie

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        Voltar para filmes
      </Link>

      {/* Movie Content */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-8 mb-12">
        {/* Poster */}
        <div className="flex-shrink-0">
          <div className="sticky top-24 aspect-[2/3] bg-dark-300 rounded-xl overflow-hidden flex items-center justify-center">
            {poster ? (
              <img
                src={poster}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Film className="w-24 h-24 text-gray-700" strokeWidth={1} />
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
              {title}
            </h1>
            <p className="text-xl text-gray-400">{year}</p>
          </div>

          {/* Stats Card */}
          {stats.count > 0 && (
            <div className="flex items-center gap-6 p-6 bg-dark-100 rounded-xl mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-400">{stats.average}</div>
                <div className="text-yellow-400 text-sm mt-1">de 5</div>
              </div>
              <div className="flex-1">
                <Rating value={Math.round(stats.average)} size="lg" />
                <p className="text-gray-400 mt-2">
                  Baseado em <span className="text-gray-300">{stats.count}</span> avaliação{stats.count !== 1 ? 'ões' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Synopsis */}
          {synopsis && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-3">Sinopse</h2>
              <p className="text-gray-300 leading-relaxed">{synopsis}</p>
            </div>
          )}

          {/* Admin Edit Button */}
          {isAdmin && (
            <div className="mb-6">
              <Button onClick={() => setShowEditModal(true)} className="flex items-center gap-2">
                <Pencil className="w-4 h-4" strokeWidth={2} />
                Editar Filme
              </Button>
            </div>
          )}

          {/* Trailer */}
          {trailer && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-3">Trailer</h2>
              <a
                href={trailer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <PlayCircle className="w-5 h-5" strokeWidth={1.75} />
                Assistir no YouTube
              </a>
            </div>
          )}

          {/* Review Form */}
          {active && (
            <div className="mt-8">
              <ReviewForm onSubmit={handleCreateReview} loading={submitting} />
              {showSuccess && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" strokeWidth={2} />
                  <p className="text-green-400 text-sm">Avaliação publicada com sucesso!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-gray-800 pt-8">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">
          Avaliações {stats.count > 0 && `(${stats.count})`}
        </h2>

        {reviewsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-100 text-gray-500 mb-4">
              <MessageSquare className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <p className="text-gray-300 text-lg">Este filme ainda não tem avaliações.</p>
            <p className="text-gray-500 text-sm mt-1">Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onDelete={user && review.userId === user.id ? () => handleDeleteReview(review.id) : null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditMovieModal
          movie={movie}
          onClose={() => setShowEditModal(false)}
          onUpdate={refetchMovie}
        />
      )}
    </div>
  )
}
