import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Layout() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isAuthenticated, logout } = useAuth()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-100/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-500 hover:text-primary-400 transition-colors">
              <span className="text-2xl">🎬</span>
              <span>URMovieRates</span>
            </Link>

            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Buscar filmes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                Início
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === '/profile'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <span>👤</span>
                    <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Perfil'}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors"
                    title="Sair"
                  >
                    <span>🚪</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                >
                  <span>🔑</span>
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              )}

              <Link
                to="/favorites"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/favorites'
                    ? 'bg-red-500/20 text-red-400'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <span>❤️</span>
                <span className="hidden sm:inline">Favoritos</span>
              </Link>
            </nav>
          </div>

          {/* Search - Mobile */}
          <form onSubmit={handleSearch} className="md:hidden pb-4">
            <input
              type="text"
              placeholder="Buscar filmes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-100 border-t border-gray-800 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎬</span>
              <span>URMovieRates</span>
            </div>
            <p>© 2026 - Backend: Node.js + Prisma + PostgreSQL</p>
          </div>
        </div>
      </footer>
    </div>
  )
}