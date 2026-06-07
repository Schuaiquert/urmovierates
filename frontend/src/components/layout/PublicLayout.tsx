'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AddMovieModal } from '@/components/movie/AddMovieModal';
import { useAuth } from '@/contexts/AuthContext';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);

  const [showAdd, setShowAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (search === debounced) return;
    const t = setTimeout(() => setDebounced(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, debounced]);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set('search', debounced); else params.delete('search');
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setDebounced(search);
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) params.set('search', search); else params.delete('search');
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="min-h-screen flex flex-col bg-dark-200">
      <Navbar
        search={search}
        setSearch={setSearch}
        onSearchSubmit={onSearchKey}
        onAddMovie={isAdmin ? () => setShowAdd(true) : undefined}
      />
      <main className="flex-1" data-refresh-key={refreshKey}>{children}</main>
      <Footer />
      <AddMovieModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { setShowAdd(false); refresh(); }}
      />
    </div>
  );
}
