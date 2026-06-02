import { useState, useEffect, useCallback } from 'react'
import { favoritesAPI } from '../services/api'

export function useFavoriteStatus(userId, movieIds = []) {
  const [favorites, setFavorites] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStatus = useCallback(async () => {
    if (!userId || movieIds.length === 0) {
      setFavorites({})
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data } = await favoritesAPI.getStatus(userId, movieIds)
      setFavorites(data.data)
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar favoritos')
    } finally {
      setLoading(false)
    }
  }, [userId, movieIds.join(',')])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const toggle = async (movieId) => {
    if (!userId) return { favorited: false }

    try {
      const { data } = await favoritesAPI.toggle(movieId, userId)
      setFavorites(prev => ({ ...prev, [movieId]: data.data.favorited }))
      return data.data
    } catch (err) {
      throw err
    }
  }

  const isFavorite = (movieId) => favorites[movieId] || false

  return { favorites, loading, error, toggle, isFavorite, refetch: fetchStatus }
}

export function useUserFavorites(userId, params = {}) {
  const [movies, setMovies] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFavorites = useCallback(async (page = 1) => {
    if (!userId) {
      setMovies([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data } = await favoritesAPI.getUserFavorites(userId, { page, limit: 12, ...params })
      setMovies(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar favoritos')
    } finally {
      setLoading(false)
    }
  }, [userId, JSON.stringify(params)])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const remove = async (movieId) => {
    if (!userId) return

    await favoritesAPI.remove(movieId, userId)
    setMovies(prev => prev.filter(m => m.id !== movieId))
    setPagination(prev => ({ ...prev, total: prev.total - 1 }))
  }

  return { movies, pagination, loading, error, refetch: () => fetchFavorites(), remove }
}