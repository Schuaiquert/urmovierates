import { useState, useEffect, useCallback } from 'react'
import { reviewsAPI } from '../services/api'

export function useMovieReviews(movieId) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReviews = useCallback(async () => {
    if (!movieId) return

    setLoading(true)
    setError(null)

    try {
      const [reviewsRes, statsRes] = await Promise.all([
        reviewsAPI.getByMovie(movieId),
        reviewsAPI.getMovieStats(movieId),
      ])
      setReviews(reviewsRes.data.data)
      setStats(statsRes.data.data)
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar reviews')
    } finally {
      setLoading(false)
    }
  }, [movieId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const createReview = async (reviewData) => {
    const { data } = await reviewsAPI.create({ ...reviewData, movieId })
    setReviews(prev => [data.data, ...prev])
    await fetchReviews()
    return data
  }

  const deleteReview = async (reviewId) => {
    await reviewsAPI.delete(reviewId)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
    await fetchReviews()
  }

  const updateReview = async (reviewId, reviewData) => {
    const { data } = await reviewsAPI.update(reviewId, reviewData)
    setReviews(prev => prev.map(r => r.id === reviewId ? data.data : r))
    await fetchReviews()
    return data
  }

  return {
    reviews,
    stats,
    loading,
    error,
    createReview,
    updateReview,
    deleteReview,
    refetch: fetchReviews,
  }
}