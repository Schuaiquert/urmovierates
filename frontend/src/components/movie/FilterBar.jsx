import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import {
  Filter as FilterIcon,
  Film as FilmIcon,
  Calendar as CalendarIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  X as CloseIcon,
} from 'lucide-react'
import { moviesAPI } from '../../services/api'

function FilterField({ icon: Icon, label, value, options, onChange, disabled }) {
  const hasValue = value !== '' && value !== 'all'
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`appearance-none w-full h-9 pl-3 pr-8 rounded-lg text-sm font-medium cursor-pointer transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            hasValue
              ? 'bg-primary-500/10 border border-primary-500/30 text-primary-300 hover:bg-primary-500/15 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20'
              : 'bg-dark-200/60 border border-white/5 text-gray-300 hover:bg-dark-200 hover:border-white/10 hover:text-gray-100 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/10'
          }`}
        >
          <option value="">Todos</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
      </div>
    </div>
  )
}

export default function FilterBar() {
  const { search, setSearch } = useOutletContext() || {}
  const [searchParams, setSearchParams] = useSearchParams()
  const [year, setYear] = useState(searchParams.get('year') || '')
  const [genre, setGenre] = useState(searchParams.get('genre') || '')
  const [status, setStatus] = useState(
    searchParams.get('active') === 'false' ? 'inactive' : searchParams.get('active') === 'true' ? 'active' : 'all'
  )
  const [availableYears, setAvailableYears] = useState([])
  const [availableGenres, setAvailableGenres] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true)
      try {
        const [yearsRes, genresRes] = await Promise.all([
          moviesAPI.getYears().catch(() => ({ data: { data: [] } })),
          moviesAPI.getGenres().catch(() => ({ data: { data: [] } }))
        ])
        setAvailableYears(yearsRes.data?.data || [])
        const seen = new Set()
        const uniqueGenres = (genresRes.data?.data || []).filter((g) => {
          const key = g.name.trim().toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setAvailableGenres(uniqueGenres)
      } catch (e) {
        console.error('Failed to fetch filter options:', e)
      } finally {
        setLoadingOptions(false)
      }
    }
    fetchOptions()
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleApply = () => {
    const params = new URLSearchParams(searchParams)
    if (year) params.set('year', year)
    else params.delete('year')
    if (genre) params.set('genre', genre)
    else params.delete('genre')
    if (status === 'active') params.set('active', 'true')
    else if (status === 'inactive') params.set('active', 'false')
    else params.delete('active')
    params.delete('page')
    if (searchParams.toString() !== params.toString()) {
      setSearchParams(params)
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setYear('')
    setGenre('')
    setStatus('all')
    const params = new URLSearchParams(searchParams)
    params.delete('year')
    params.delete('genre')
    params.delete('active')
    params.delete('page')
    setSearchParams(params)
    setIsOpen(false)
  }

  const hasFilters = !!(year || genre || status !== 'all')
  const activeCount = (year ? 1 : 0) + (genre ? 1 : 0) + (status !== 'all' ? 1 : 0)

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`flex items-center gap-2 h-10 px-3.5 rounded-lg text-sm font-medium transition-colors ${
          hasFilters
            ? 'bg-primary-500/10 border border-primary-500/30 text-primary-300 hover:bg-primary-500/15 hover:border-primary-500/50'
            : 'bg-dark-200/60 border border-white/5 text-gray-300 hover:bg-dark-200 hover:border-white/10 hover:text-gray-100'
        }`}
      >
        <FilterIcon className="w-4 h-4" strokeWidth={1.75} />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-primary-500/30 text-primary-200 text-[10px] font-semibold">
            {activeCount}
          </span>
        )}
        <ChevronDownIcon
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-2 z-50 w-80 bg-dark-100 border border-white/5 rounded-xl shadow-2xl shadow-black/40 p-4 space-y-3 backdrop-blur-xl"
        >
          <FilterField
            icon={FilmIcon}
            label="Gênero"
            value={genre}
            options={availableGenres.map((g) => ({ value: g.name, label: g.name }))}
            onChange={setGenre}
            disabled={loadingOptions}
          />
          <FilterField
            icon={CalendarIcon}
            label="Ano"
            value={year}
            options={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
            onChange={setYear}
            disabled={loadingOptions}
          />
          <FilterField
            icon={CheckIcon}
            label="Status"
            value={status}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Inativos' },
            ]}
            onChange={setStatus}
          />

          <div className="pt-3 mt-1 border-t border-white/5 flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-white/5 transition-colors"
            >
              <CloseIcon className="w-3 h-3" strokeWidth={2.5} />
              <span>Limpar</span>
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white shadow-lg shadow-primary-900/20 transition-colors"
            >
              <CheckIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Aplicar filtros</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
