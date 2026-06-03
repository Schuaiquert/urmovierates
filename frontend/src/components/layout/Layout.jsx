import { Outlet, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Film } from 'lucide-react'
import Navbar from './Navbar'
import { AddMovieModal } from '../movie'
import { useAuth } from '../../context/AuthContext'

const SEARCH_DEBOUNCE_MS = 300

export default function Layout() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const isInitialRender = useRef(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (search === debouncedSearch) return
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch) params.set('search', debouncedSearch)
    else params.delete('search')
    params.delete('page')
    if (searchParams.toString() !== params.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [debouncedSearch])

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(search)
      const params = new URLSearchParams(searchParams)
      if (search.trim()) params.set('search', search)
      else params.delete('search')
      params.delete('page')
      setSearchParams(params, { replace: true })
    }
  }

  const handleOpenAddMovie = () => setShowAddModal(true)
  const handleCloseAddMovie = () => setShowAddModal(false)
  const handleMovieAdded = () => {
    setRefreshKey((k) => k + 1)
    setShowAddModal(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-200">
      <Navbar
        search={search}
        setSearch={setSearch}
        onSearchSubmit={handleSearchSubmit}
        onAddMovie={isAdmin ? handleOpenAddMovie : undefined}
      />
      <main className="flex-1">
        <Outlet context={{ search, setSearch, refreshKey }} />
      </main>
      <footer className="bg-dark-100 border-t border-gray-800 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5" strokeWidth={1.5} />
              <span>URMovieRates</span>
            </div>
            <a
              href="https://github.com/Schuaiquert/urmovierates/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-200/60 border border-white/5 text-gray-300 hover:text-gray-100 hover:bg-dark-200 hover:border-white/10 transition-colors text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {showAddModal && (
        <AddMovieModal
          onClose={handleCloseAddMovie}
          onAdd={handleMovieAdded}
        />
      )}
    </div>
  )
}
