'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X, Clapperboard, Home, User, LogOut, LogIn, Heart, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/cn';

interface NavbarProps {
  search: string;
  setSearch: (v: string) => void;
  onSearchSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddMovie?: () => void;
}

export function Navbar({ search, setSearch, onSearchSubmit, onAddMovie }: NavbarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass = (active: boolean) => cn(
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    active ? 'bg-primary-500/10 text-primary-400'
           : 'text-gray-400 hover:text-gray-100 hover:bg-white/5',
  );

  return (
    <header className={cn(
      'sticky top-0 z-50 bg-dark-100/80 backdrop-blur-xl border-b border-white/5',
      scrolled ? 'shadow-lg shadow-black/30' : 'shadow-none',
      'transition-shadow duration-200',
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 md:gap-4 h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="Página inicial">
            <Clapperboard className="w-7 h-7 text-primary-500 transition-transform group-hover:scale-110" strokeWidth={1.75} />
            <span className="hidden md:inline text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              URMovieRates
            </span>
          </Link>

          <div className="relative flex-1 min-w-0 max-w-2xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
              <Search className="w-4 h-4" strokeWidth={2} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchSubmit}
              placeholder="Buscar filmes..."
              aria-label="Buscar filmes"
              className="w-full h-10 pl-10 pr-10 bg-dark-200/60 border border-white/5 rounded-xl text-sm text-gray-100 placeholder-gray-500 transition-all duration-200 hover:border-white/10 focus:outline-none focus:border-primary-500/50 focus:bg-dark-200 focus:ring-4 focus:ring-primary-500/10"
            />
            {search && (
              <button
                type="button" onClick={() => setSearch('')}
                aria-label="Limpar busca"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>

          <nav className="flex items-center gap-1.5 shrink-0">
            {onAddMovie && (
              <button type="button" onClick={onAddMovie}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-400 hover:text-gray-100 hover:bg-white/5 bg-transparent border-0"
                aria-label="Adicionar filmes"
              >
                <Plus className="w-4 h-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Adicionar filmes</span>
              </button>
            )}

            <Link href="/" className={linkClass(pathname === '/')}>
              <Home className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Início</span>
            </Link>

            <Link href="/favorites" className={linkClass(pathname === '/favorites')}>
              <Heart className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Favoritos</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/profile" className={linkClass(pathname === '/profile')}>
                  <User className="w-4 h-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Perfil'}</span>
                </Link>
                <button onClick={logout} className={cn(linkClass(false), 'bg-transparent border-0')} title="Sair" aria-label="Sair">
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <Link href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors"
              >
                <LogIn className="w-4 h-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
