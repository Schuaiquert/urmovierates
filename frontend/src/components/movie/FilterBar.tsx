'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Filter, Film as FilmIcon, Calendar, Check, ChevronDown, X, type LucideIcon } from 'lucide-react';
import { moviesAPI } from '@/services/api';

function FilterField({ icon: Icon, label, value, options, onChange, disabled }:
{ icon: LucideIcon; label: string;
  value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; disabled?: boolean }) {
  const has = value && value !== 'all';
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />{label}
      </label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
          className={`appearance-none w-full h-9 pl-3 pr-8 rounded-lg text-sm font-medium cursor-pointer transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            has ? 'bg-primary-500/10 border border-primary-500/30 text-primary-300 hover:bg-primary-500/15 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20'
                : 'bg-dark-200/60 border border-white/5 text-gray-300 hover:bg-dark-200 hover:border-white/10 hover:text-gray-100 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/10'
          }`}
        >
          <option value="">Todos</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [year, setYear] = useState(searchParams?.get('year') ?? '');
  const [genre, setGenre] = useState(searchParams?.get('genre') ?? '');
  const [status, setStatus] = useState(
    searchParams?.get('active') === 'false' ? 'inactive'
      : searchParams?.get('active') === 'true' ? 'active' : 'all');
  const [years, setYears] = useState<number[]>([]);
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [y, g] = await Promise.all([
          moviesAPI.getYears().catch(() => ({ data: { data: [] as number[] } })),
          moviesAPI.getGenres().catch(() => ({ data: { data: [] as { id: string; name: string }[] } })),
        ]);
        setYears(y.data.data);
        const seen = new Set<string>();
        setGenres((g.data.data as { id: string; name: string }[]).filter((x) => {
          const k = x.name.trim().toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k); return true;
        }));
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const apply = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (year) params.set('year', year); else params.delete('year');
    if (genre) params.set('genre', genre); else params.delete('genre');
    if (status === 'active') params.set('active', 'true');
    else if (status === 'inactive') params.set('active', 'false');
    else params.delete('active');
    params.delete('page');
    router.replace(`${pathname ?? '/'}?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  const clear = () => {
    setYear(''); setGenre(''); setStatus('all');
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('year'); params.delete('genre'); params.delete('active'); params.delete('page');
    router.replace(`${pathname ?? '/'}?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  const activeCount = (year ? 1 : 0) + (genre ? 1 : 0) + (status !== 'all' ? 1 : 0);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true"
        className={`flex items-center gap-2 h-10 px-3.5 rounded-lg text-sm font-medium transition-colors ${
          activeCount > 0
            ? 'bg-primary-500/10 border border-primary-500/30 text-primary-300 hover:bg-primary-500/15 hover:border-primary-500/50'
            : 'bg-dark-200/60 border border-white/5 text-gray-300 hover:bg-dark-200 hover:border-white/10 hover:text-gray-100'
        }`}
      >
        <Filter className="w-4 h-4" strokeWidth={1.75} />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-primary-500/30 text-primary-200 text-[10px] font-semibold">{activeCount}</span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>

      {open && (
        <div role="menu"
          className="absolute top-full left-0 mt-2 z-50 w-80 bg-dark-100 border border-white/5 rounded-xl shadow-2xl shadow-black/40 p-4 space-y-3 backdrop-blur-xl"
        >
          <FilterField icon={FilmIcon} label="Gênero" value={genre}
            options={genres.map((g) => ({ value: g.name, label: g.name }))}
            onChange={setGenre} disabled={loading} />
          <FilterField icon={Calendar} label="Ano" value={year}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
            onChange={setYear} disabled={loading} />
          <FilterField icon={Check} label="Status" value={status}
            options={[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Ativos' }, { value: 'inactive', label: 'Inativos' }]}
            onChange={setStatus} />
          <div className="pt-3 mt-1 border-t border-white/5 flex gap-2">
            <button type="button" onClick={clear}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-white/5 transition-colors">
              <X className="w-3 h-3" strokeWidth={2.5} /><span>Limpar</span>
            </button>
            <button type="button" onClick={apply}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white shadow-lg shadow-primary-900/20 transition-colors">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} /><span>Aplicar filtros</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
