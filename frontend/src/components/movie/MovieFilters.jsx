import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../common'
import { moviesAPI } from '../../services/api'

export default function MovieFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search] = useState(searchParams.get('search') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')
  const [genre, setGenre] = useState(searchParams.get('genre') || '')
  const [activeOnly, setActiveOnly] = useState(searchParams.get('active') !== 'false')

  // Options loaded from API
  const [availableYears, setAvailableYears] = useState([])
  const [availableGenres, setAvailableGenres] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Track if this is the initial render
  const isInitialRender = useRef(true)
  // Track if we're clearing all filters
  const isClearing = useRef(false)

  // Fetch years and genres from API
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true)
      try {
        const [yearsRes, genresRes] = await Promise.all([
          moviesAPI.getYears().catch(() => ({ data: { data: [] } })),
          moviesAPI.getGenres().catch(() => ({ data: { data: [] } }))
        ])
        // Years come already distinct from the API
        setAvailableYears(yearsRes.data?.data || [])
        // Set genres from genres endpoint
        setAvailableGenres(genresRes.data?.data || [])
      } catch (e) {
        console.error('Failed to fetch filter options:', e)
      } finally {
        setLoadingOptions(false)
      }
    }
    fetchOptions()
  }, [])

  // Update URL params when filters change (but not on initial render or when clearing)
  useEffect(() => {
    // Skip initial render and clear operations
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }
    if (isClearing.current) {
      isClearing.current = false
      return
    }

    const params = new URLSearchParams()
    if (year) params.set('year', year)
    if (genre) params.set('genre', genre)
    if (!activeOnly) params.set('active', 'false')
    if (searchParams.toString() !== params.toString()) {
      setSearchParams(params)
    }
  }, [year, genre, activeOnly])

  const handleClear = () => {
    isClearing.current = true
    setYear('')
    setGenre('')
    setActiveOnly(true)
    setSearchParams({})
  }

  const hasFilters = year || genre || !activeOnly

  return (
    <div className="mb-8 space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Genre Select */}
        <div className="w-40">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Gênero
          </label>
          <div className="relative">
            <select
              value={genre}
              onChange={(e) => { setGenre(e.target.value); e.target.size = 1 }}
              onFocus={(e) => e.target.size = 6}
              onBlur={(e) => e.target.size = 1}
              className="input pr-8"
              disabled={loadingOptions}
              style={{ scrollbars: 'auto' }}
            >
              <option value="">Todos</option>
              {availableGenres.map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Year Select */}
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Ano
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="input"
            disabled={loadingOptions}
          >
            <option value="">Todos</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activeOnly"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-dark-100 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="activeOnly" className="text-sm text-gray-400 cursor-pointer">
            Apenas ativos
          </label>
        </div>

        {/* Clear Button */}
        {hasFilters && (
          <Button variant="outline" onClick={handleClear}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Active Filters Tags */}
      {(hasFilters || search) && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-dark-100 rounded-full text-sm text-gray-300">
              Busca: "{search}"
            </span>
          )}
          {genre && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-dark-100 rounded-full text-sm text-gray-300">
              Gênero: {genre}
            </span>
          )}
          {year && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-dark-100 rounded-full text-sm text-gray-300">
              Ano: {year}
            </span>
          )}
          {!activeOnly && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-dark-100 rounded-full text-sm text-gray-300">
              Incluindo inativos
            </span>
          )}
        </div>
      )}
    </div>
  )
}