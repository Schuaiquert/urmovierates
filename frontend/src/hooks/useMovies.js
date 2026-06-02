import { useState, useEffect, useCallback, useRef } from 'react'
import { moviesAPI } from '../services/api'

export function useMovies(searchParams = {}) {
  const [movies, setMovies] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const fetchMovies = useCallback(async (params = {}) => {
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.cancel()
    }
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const { data } = await moviesAPI.getAll({ ...searchParams, ...params })
      setMovies(data.data)
      setPagination(data.pagination)
    } catch (err) {
      if (!err.cancelled) {
        setError(err.userMessage || 'Erro ao carregar filmes')
      }
    } finally {
      if (!err.cancelled) {
        setLoading(false)
      }
    }
  }, [JSON.stringify(searchParams)])

  useEffect(() => {
    fetchMovies()
    return () => {
      if (abortRef.current) {
        abortRef.current.cancel()
      }
    }
  }, [fetchMovies])

  return { movies, pagination, loading, error, refetch: fetchMovies }
}

export function useMovie(id) {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMovie = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const { data } = await moviesAPI.getById(id)
      setMovie(data.data)
    } catch (err) {
      setError(err.userMessage || 'Filme não encontrado')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMovie()
  }, [fetchMovie])

  return { movie, loading, error, refetch: fetchMovie }
}

// Utility hook for debouncing
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}