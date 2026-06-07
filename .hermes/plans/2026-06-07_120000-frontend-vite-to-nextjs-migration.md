# URMovieRates Frontend — Vite/React → Next.js (App Router) Migration Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Migrate the existing React + Vite SPA (in `frontend/`) to a Next.js 14+ App Router project preserving all current functionality, backend integration, and visual identity, while improving SEO, performance, code organization, and UX polish.

**Architecture:** Replace the Vite SPA with a Next.js App Router project colocated at `frontend/` (the existing folder). Pages become `app/*` route segments; client-only interactivity is preserved via `"use client"` boundaries on components that need state, effects, or browser APIs. API calls stay in `services/api.ts` (axios + interceptor) talking to the same Express backend. Tailwind is kept as the styling system, augmented with a small CSS-variables design token layer for the dark theme. Framer Motion is added for transitions. Authentication state stays in a client `AuthProvider` (same `localStorage` flow), wrapped in a top-level client boundary. Public pages (`/`, `/movie/[id]`) get SEO metadata, OpenGraph tags, and `next/image` for posters.

**Tech Stack:**
- Next.js 14 (App Router) + React 18
- TypeScript (the current project is `.jsx`; we migrate to `.tsx` for type safety)
- Tailwind CSS 3.3 (existing config + tokens)
- `lucide-react` (icons) — keep current version
- `axios` for HTTP — keep current version
- `framer-motion` (new) for page/card/modal transitions
- `next/image`, `next/link`, `next/navigation` (built-in)
- `next/font` for Inter

**Backend contract (unchanged):** Express API at `/api/*` (proxied in dev, direct in prod). Endpoints used: `/auth/*`, `/movies`, `/movies/:id`, `/movies/genres`, `/movies/years`, `/reviews/*`, `/favorites/*`, `/users/*`.

**Workspace:** All work happens under `/home/projects/pedro/urmovierates/frontend/`. The existing folder is renamed/replaced; old `vite.config.js`, `index.html`, `dist/`, and `src/` get removed only at the final cleanup task. Backend is NOT modified.

**Out of scope:** Backend changes, auth protocol changes (still JWT in `localStorage`), database changes, Docker changes, E2E tests.

---

## Current State (what exists today)

```
frontend/
├── index.html
├── package.json          # react 18, react-router-dom 6, axios, vite, tailwind
├── vite.config.js        # dev proxy /api -> :3001
├── tailwind.config.js    # primary/dark palette, preflight off
├── postcss.config.js
├── dist/                 # vite build output
└── src/
    ├── App.jsx           # Routes
    ├── main.jsx          # ReactDOM + BrowserRouter + AuthProvider
    ├── components/
    │   ├── common/index.jsx           # Spinner, Button, Input, Textarea, Card, Badge, Rating, EmptyState, ErrorState, Pagination, Skeleton, MovieCardSkeleton
    │   ├── layout/{Layout,Navbar}.jsx # Layout (Outlet + search/filter URL sync), Navbar
    │   ├── movie/{MovieCard,FilterBar,MovieFilters,FavoriteButton,AddMovieModal,EditMovieModal,index}.jsx
    │   └── review/{ReviewCard,ReviewForm,index}.jsx
    ├── context/AuthContext.jsx        # JWT in localStorage, login/register/logout/me
    ├── hooks/{useMovies,useReviews,useFavorites}.js
    ├── pages/{Home,Movie,Favorites,Login,Register,Profile,NotFound}Page.jsx
    ├── services/api.js                # axios instance + moviesAPI/reviewsAPI/usersAPI/favoritesAPI/authAPI
    └── styles/globals.css             # tailwind + .card .input .badge .btn components
```

Routing (React Router) → maps to Next.js App Router:
- `/` → `app/page.tsx` (HomePage)
- `/movie/:id` → `app/movie/[id]/page.tsx` (MoviePage)
- `/favorites` → `app/favorites/page.tsx`
- `/login` → `app/login/page.tsx`
- `/register` → `app/register/page.tsx`
- `/profile` → `app/profile/page.tsx`
- `*` → `app/not-found.tsx`

Shared UI (Layout/Navbar/Footer) → `app/(public)/layout.tsx` (route group with shared chrome).

---

## Design Tokens & Visual Goals

Keep the current dark theme. Add a CSS-variable layer in `globals.css` so the theme is portable. Final visual target:

- Dark base `#0f172a` (dark-200) with cards `#1e293b` (dark-100) and deepest `#0a0f1a` (dark-300).
- Primary `#0ea5e9` (sky-500) for CTAs and accents; gradient `from-primary-400 to-primary-600` on the wordmark.
- Generous spacing (`gap-4 md:gap-6`), rounded-2xl cards, subtle border `border-white/5`, hover `shadow-lg shadow-black/30` + `translateY(-2px)`.
- Page transitions: Framer Motion `AnimatePresence` fades (180ms) on `<main>` keyed by `usePathname()`.
- Modal: scale + fade (200ms) on the modal card; backdrop fade 150ms.
- Skeletons use the existing `Skeleton` primitive with a subtle shimmer keyframe (added in `globals.css`).
- `next/image` with `priority` on first 3 cards, `sizes` matching the 2/3/4/5/6-column grid.

---

## File Tree After Migration

```
frontend/
├── next.config.mjs            # image domains (TMDB/IMDB posters if known), rewrite /api -> :3001
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── package.json               # next, react, react-dom, framer-motion, etc.
├── .eslintrc.json             # next/core-web-vitals
├── .gitignore
├── public/
│   ├── favicon.ico
│   └── og-default.png
└── src/
    ├── app/
    │   ├── layout.tsx                   # root layout: <html lang="pt-BR">, fonts, providers
    │   ├── globals.css                  # tailwind + tokens + shimmer keyframe
    │   ├── providers.tsx                # "use client" wrapper: AuthProvider, AnimatePresence
    │   ├── page.tsx                     # HomePage (server, fetches initial data)
    │   ├── loading.tsx                  # global skeleton fallback
    │   ├── not-found.tsx
    │   ├── (public)/
    │   │   └── layout.tsx               # Navbar + Footer wrapper (client component)
    │   ├── movie/
    │   │   └── [id]/
    │   │       ├── page.tsx             # MoviePage (server, fetch movie + reviews)
    │   │       └── loading.tsx          # movie detail skeleton
    │   ├── favorites/page.tsx
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   └── profile/page.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   ├── Footer.tsx
    │   │   └── PublicLayout.tsx         # client: orchestrates search → URL, modal
    │   ├── movie/
    │   │   ├── MovieCard.tsx
    │   │   ├── MovieGrid.tsx            # client: renders grid + favorite overlay
    │   │   ├── FilterBar.tsx
    │   │   ├── FavoriteButton.tsx
    │   │   ├── AddMovieModal.tsx
    │   │   └── EditMovieModal.tsx
    │   ├── review/
    │   │   ├── ReviewCard.tsx
    │   │   └── ReviewForm.tsx
    │   ├── common/
    │   │   ├── Spinner.tsx
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Textarea.tsx
    │   │   ├── Card.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Rating.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── ErrorState.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── Skeleton.tsx
    │   │   ├── MovieCardSkeleton.tsx
    │   │   └── Modal.tsx                # generic modal w/ framer-motion
    │   └── seo/
    │       └── MovieSchema.tsx          # JSON-LD Movie schema for /movie/[id]
    ├── contexts/
    │   └── AuthContext.tsx
    ├── hooks/
    │   ├── useMovies.ts
    │   ├── useReviews.ts
    │   ├── useFavorites.ts
    │   └── useDebounce.ts
    ├── services/
    │   └── api.ts                       # axios + all *API namespaces
    ├── types/
    │   ├── movie.ts
    │   ├── review.ts
    │   ├── user.ts
    │   └── api.ts                       # ApiResponse<T>, Pagination
    ├── lib/
    │   ├── format.ts                    # formatDuration, formatDate
    │   ├── cn.ts                        # className merge helper
    │   └── constants.ts                 # GENRE_OPTIONS, PAGE_SIZE
    └── styles/
        └── (removed; merged into app/globals.css)
```

---

## Tasks

### Phase 1 — Foundation

#### Task 1: Install Next.js + TypeScript + supporting deps

**Objective:** Replace Vite tooling with Next.js 14 + TypeScript stack.

**Files:**
- Modify: `frontend/package.json`
- Delete (after install): `frontend/vite.config.js`, `frontend/index.html`, `frontend/dist/`
- Create: `frontend/tsconfig.json`, `frontend/next.config.mjs`, `frontend/next-env.d.ts`, `frontend/postcss.config.mjs`, `frontend/.eslintrc.json`, `frontend/.gitignore`

**Step 1: Stop the old dev server & back up**

```bash
cd /home/projects/pedro/urmovierates/frontend
git status  # ensure no surprise untracked files
git add -A && git commit -m "chore: snapshot before next.js migration"
```

**Step 2: Replace package.json**

Replace `frontend/package.json` with:

```json
{
  "name": "urmovierates-frontend",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev -p 5173",
    "build": "next build",
    "start": "next start -p 5173",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3"
  }
}
```

Notes: lucide-react bumped to `^0.400.0` (the project has a stuck `1.17.0` — old fork of a different lib). Same icon names, no code changes. Framer Motion is the only new runtime dep.

**Step 3: Install**

```bash
cd /home/projects/pedro/urmovierates/frontend
rm -rf node_modules package-lock.json dist
npm install
```

Expected: clean install, no peer warnings about React 18.

**Step 4: Verify the install**

```bash
npx next --version
```
Expected: `Next.js v14.2.x` or similar.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore(frontend): swap vite for next.js 14 + typescript"
```

---

#### Task 2: Create base config files

**Objective:** Get Next.js + Tailwind + ESLint wired up before writing any TS.

**Files:**
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.mjs`
- Create: `frontend/next-env.d.ts`
- Create: `frontend/postcss.config.mjs`
- Create: `frontend/.eslintrc.json`
- Create: `frontend/.gitignore`

**Step 1: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 2: `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // movie posters can come from any CDN
    ],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' },
    ];
  },
};

export default nextConfig;
```

**Step 3: `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

**Step 4: `postcss.config.mjs`**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

**Step 5: `.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals"
}
```

**Step 6: `.gitignore`**

```
node_modules
.next
out
dist
*.log
.env*.local
.DS_Store
```

**Step 7: Delete old Vite + Tailwind configs**

```bash
cd /home/projects/pedro/urmovierates/frontend
rm -f vite.config.js index.html tailwind.config.js postcss.config.js
```

**Step 8: Replace `tailwind.config.js` with `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          100: '#1e293b',
          200: '#0f172a',
          300: '#0a0f1a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 9: Type-check the empty project**

```bash
npx tsc --noEmit
```
Expected: no errors.

**Step 10: Commit**

```bash
git add -A
git commit -m "chore(frontend): add next.js + tailwind + eslint config"
```

---

#### Task 3: Establish types, services, and lib utilities

**Objective:** Port `services/api.js` → TS and add type definitions before any UI.

**Files:**
- Create: `frontend/src/types/api.ts`
- Create: `frontend/src/types/movie.ts`
- Create: `frontend/src/types/review.ts`
- Create: `frontend/src/types/user.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/lib/cn.ts`
- Create: `frontend/src/lib/format.ts`
- Create: `frontend/src/lib/constants.ts`

**Step 1: `src/types/api.ts`**

```ts
export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
```

**Step 2: `src/types/movie.ts`**

```ts
import type { Genre } from './review';

export interface Movie {
  id: string;
  title: string;
  year: number;
  synopsis?: string | null;
  poster?: string | null;
  trailer?: string | null;
  duration?: number | null;
  active: boolean;
  createdAt: string;
  genres: Genre[];
}
```

**Step 3: `src/types/review.ts`**

```ts
import type { User } from './user';

export interface Genre {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  rating: number;
  text?: string | null;
  movieId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface ReviewStats {
  average: number;
  count: number;
}
```

**Step 4: `src/types/user.ts`**

```ts
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthPayload {
  token: string;
  user: User;
}
```

**Step 5: `src/lib/cn.ts`**

```ts
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
```

**Step 6: `src/lib/format.ts`**

```ts
export function formatDuration(minutes?: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDate(iso: string, style: 'short' | 'long' = 'short'): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  });
}
```

**Step 7: `src/lib/constants.ts`**

```ts
export const PAGE_SIZE = 12;
export const GENRE_OPTIONS = [
  'Ação', 'Animação', 'Aventura', 'Comédia', 'Drama', 'Fantasia',
  'Ficção Científica', 'Horror', 'Romance', 'Suspense', 'Terror', 'Thriller',
] as const;
export const SEARCH_DEBOUNCE_MS = 300;
```

**Step 8: `src/services/api.ts`**

Port of `api.js` — typed, with axios `AxiosError` unwrapping for `userMessage`:

```ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiResponse, AuthPayload, Movie, Review, ReviewStats, User, Genre } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error ?? error.message;
    if (typeof console !== 'undefined') console.error('API Error:', message);
    return Promise.reject(Object.assign(error, { userMessage: message }));
  },
);

export const moviesAPI = {
  getAll: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<Movie[]>>('/movies', { params }),
  getById: (id: string) => api.get<ApiResponse<Movie>>(`/movies/${id}`),
  create: (data: Partial<Movie>) => api.post<ApiResponse<Movie>>('/movies', data),
  update: (id: string, data: Partial<Movie>) => api.put<ApiResponse<Movie>>(`/movies/${id}`, data),
  remove: (id: string) => api.delete(`/movies/${id}`),
  getGenres: () => api.get<ApiResponse<Genre[]>>('/movies/genres'),
  getYears: () => api.get<ApiResponse<number[]>>('/movies/years'),
};

export const reviewsAPI = {
  getAll: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<Review[]>>('/reviews', { params }),
  getByMovie: (movieId: string) =>
    api.get<ApiResponse<Review[]>>(`/reviews/movies/${movieId}`),
  getMovieStats: (movieId: string) =>
    api.get<ApiResponse<ReviewStats>>(`/reviews/movies/${movieId}/stats`),
  create: (data: Partial<Review>) => api.post<ApiResponse<Review>>('/reviews', data),
  update: (id: string, data: Partial<Review>) => api.put<ApiResponse<Review>>(`/reviews/${id}`, data),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};

export const usersAPI = {
  getAll: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<User[]>>('/users', { params }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
};

export const favoritesAPI = {
  getUserFavorites: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<Movie[]>>('/favorites', { params }),
  getStatus: (movieIds: string[]) =>
    api.get<ApiResponse<Record<string, boolean>>>('/favorites/status', {
      params: { movieIds: movieIds.join(',') },
    }),
  add: (movieId: string) => api.post(`/favorites/${movieId}`),
  remove: (movieId: string) => api.delete(`/favorites/${movieId}`),
  toggle: (movieId: string) =>
    api.post<ApiResponse<{ favorited: boolean }>>(`/favorites/${movieId}/toggle`),
};

export const authAPI = {
  register: (data: { name?: string; email: string; password: string }) =>
    api.post<ApiResponse<User>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthPayload>>('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  updateMe: (data: Partial<User>) => api.put<ApiResponse<User>>('/auth/me', data),
  deleteMe: () => api.delete('/auth/me'),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

export default api;
```

**Step 9: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
```
Expected: no errors.

**Step 10: Commit**

```bash
git add -A
git commit -m "feat(frontend): add types, services and lib utilities"
```

---

#### Task 4: Port AuthContext + hooks to TypeScript

**Objective:** Convert client state hooks to TS and preserve current behavior (JWT in localStorage, debounce, abortable fetches).

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/hooks/useMovies.ts`
- Create: `frontend/src/hooks/useReviews.ts`
- Create: `frontend/src/hooks/useFavorites.ts`
- Create: `frontend/src/hooks/useDebounce.ts`

**Step 1: `useDebounce.ts`**

```ts
'use client';

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

**Step 2: `useMovies.ts`**

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { moviesAPI } from '@/services/api';
import type { Movie, Pagination } from '@/types';

export function useMovies(params: Record<string, unknown> = {}) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const paramsKey = JSON.stringify(params);

  const fetchMovies = useCallback(async (extra: Record<string, unknown> = {}) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const { data } = await moviesAPI.getAll({ ...params, ...extra });
      setMovies(data.data);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: any) {
      if (e.name !== 'CanceledError') {
        setError(e.userMessage ?? 'Erro ao carregar filmes');
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchMovies();
    return () => abortRef.current?.abort();
  }, [fetchMovies]);

  return { movies, pagination, loading, error, refetch: fetchMovies };
}

export function useMovie(id: string | undefined) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovie = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await moviesAPI.getById(id);
      setMovie(data.data);
    } catch (e: any) {
      setError(e.userMessage ?? 'Filme não encontrado');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMovie(); }, [fetchMovie]);

  return { movie, loading, error, refetch: fetchMovie };
}
```

**Step 3: `useReviews.ts`**

```ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { reviewsAPI } from '@/services/api';
import type { Review, ReviewStats } from '@/types';

export function useMovieReviews(movieId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!movieId) return;
    setLoading(true);
    setError(null);
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        reviewsAPI.getByMovie(movieId),
        reviewsAPI.getMovieStats(movieId),
      ]);
      setReviews(reviewsRes.data.data);
      setStats(statsRes.data.data);
    } catch (e: any) {
      setError(e.userMessage ?? 'Erro ao carregar reviews');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const createReview = async (payload: { rating: number; text?: string }) => {
    const { data } = await reviewsAPI.create({ ...payload, movieId });
    setReviews((prev) => [data.data, ...prev]);
    await fetchReviews();
    return data.data;
  };

  const updateReview = async (id: string, payload: { rating: number; text?: string }) => {
    const { data } = await reviewsAPI.update(id, payload);
    setReviews((prev) => prev.map((r) => (r.id === id ? data.data : r)));
    await fetchReviews();
  };

  const deleteReview = async (id: string) => {
    await reviewsAPI.remove(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    await fetchReviews();
  };

  return { reviews, stats, loading, error, createReview, updateReview, deleteReview, refetch: fetchReviews };
}
```

**Step 4: `useFavorites.ts`**

```ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { favoritesAPI } from '@/services/api';
import type { Movie, Pagination } from '@/types';

export function useFavoriteStatus(movieIds: string[] = []) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = movieIds.join(',');

  const fetchStatus = useCallback(async () => {
    if (movieIds.length === 0) {
      setFavorites({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await favoritesAPI.getStatus(movieIds);
      setFavorites(data.data);
    } catch (e: any) {
      setError(e.userMessage ?? 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const toggle = async (movieId: string) => {
    const { data } = await favoritesAPI.toggle(movieId);
    setFavorites((prev) => ({ ...prev, [movieId]: data.data.favorited }));
    return data.data;
  };

  return { favorites, loading, error, toggle, isFavorite: (id: string) => !!favorites[id], refetch: fetchStatus };
}

export function useUserFavorites(initialPage = 1) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async (page = initialPage) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await favoritesAPI.getUserFavorites({ page, limit: 12 });
      setMovies(data.data);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: any) {
      setError(e.userMessage ?? 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  }, [initialPage]);

  useEffect(() => { fetchFavorites(1); }, [fetchFavorites]);

  const remove = async (movieId: string) => {
    await favoritesAPI.remove(movieId);
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
    setPagination((prev) => ({ ...prev, total: Math.max(prev.total - 1, 0) }));
  };

  return { movies, pagination, loading, error, refetch: () => fetchFavorites(pagination.page), remove };
}
```

**Step 5: `AuthContext.tsx`**

```tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/services/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<User>;
  forgotPassword: (email: string) => Promise<unknown>;
  resetPassword: (token: string, password: string) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await authAPI.register({ name, email, password });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const deleteAccount = useCallback(async () => {
    await authAPI.deleteMe();
    logout();
  }, [logout]);

  const updateUser = useCallback(async (data: Partial<User>) => {
    const { data: res } = await authAPI.updateMe(data);
    localStorage.setItem('user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  }, []);

  const forgotPassword = useCallback((email: string) => authAPI.forgotPassword({ email }), []);
  const resetPassword = useCallback((token: string, password: string) =>
    authAPI.resetPassword({ token, password }), []);

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: !!user,
      login, register, logout, deleteAccount, updateUser,
      forgotPassword, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

**Step 6: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
```
Expected: no errors.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(frontend): port auth context and data hooks to typescript"
```

---

### Phase 2 — Common UI primitives

#### Task 5: Port common components to TS

**Objective:** Convert all shared UI primitives to `.tsx` with proper typing. Add a `Modal` primitive used by both add/edit modals.

**Files:**
- Create: `frontend/src/components/common/{Spinner,Button,Input,Textarea,Card,Badge,Rating,EmptyState,ErrorState,Pagination,Skeleton,MovieCardSkeleton,Modal}.tsx`
- Delete later (after migration): `frontend/src/components/common/index.jsx`

**Step 1: `Spinner.tsx`**

```tsx
import { cn } from '@/lib/cn';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZES: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className }: { size?: SpinnerSize; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn(
        'rounded-full animate-spin border-gray-700 border-t-primary-500',
        SIZES[size],
        className,
      )}
    />
  );
}
```

**Step 2: `Button.tsx`**

```tsx
import { forwardRef } from 'react';
import { Spinner } from './Spinner';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white',
  outline: 'border border-gray-600 hover:bg-gray-800 active:bg-gray-700 text-gray-300',
  ghost: 'hover:bg-gray-800 active:bg-gray-700 text-gray-300',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'primary', size = 'md', loading, disabled, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
});
```

**Step 3: `Input.tsx`**

```tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, ...rest },
  ref,
) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500',
          'transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          error && 'border-red-500',
        )}
        {...rest}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
});
```

**Step 4: `Textarea.tsx`**

```tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, ...rest },
  ref,
) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 min-h-[100px] resize-none',
          'transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          error && 'border-red-500',
        )}
        {...rest}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
});
```

**Step 5: `Card.tsx`**

```tsx
import { cn } from '@/lib/cn';

export function Card({
  children, className, hoverable = true, ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return (
    <div
      className={cn(
        'bg-dark-100 rounded-xl overflow-hidden border border-white/5',
        hoverable && 'transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
```

**Step 6: `Badge.tsx`**

```tsx
import { cn } from '@/lib/cn';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-gray-700 text-gray-300',
  primary: 'bg-primary-600/20 text-primary-400',
  success: 'bg-green-600/20 text-green-400',
  warning: 'bg-yellow-600/20 text-yellow-400',
  error: 'bg-red-600/20 text-red-400',
};

export function Badge({
  children, variant = 'default', className,
}: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
```

**Step 7: `Rating.tsx`**

```tsx
import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';
const SIZES: Record<Size, string> = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-8 h-8' };

interface RatingProps {
  value?: number;
  max?: number;
  size?: Size;
  interactive?: boolean;
  onChange?: (v: number) => void;
}

export function Rating({ value = 0, max = 5, size = 'md', interactive, onChange }: RatingProps) {
  return (
    <div className={cn('flex gap-1', interactive && 'cursor-pointer')} role="img" aria-label={`${value} de ${max} estrelas`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            aria-label={`${i + 1} estrelas`}
            className={cn(
              'p-0 bg-transparent border-0 outline-none',
              SIZES[size],
              filled ? 'text-yellow-400' : 'text-gray-600',
              interactive && 'hover:scale-110 transition-transform',
            )}
          >
            <Star className="w-full h-full" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}
```

**Step 8: `EmptyState.tsx`, `ErrorState.tsx`, `Pagination.tsx`, `Skeleton.tsx`, `MovieCardSkeleton.tsx`**

```tsx
// EmptyState.tsx
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface Props {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  message?: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Inbox, message = 'Nenhum item encontrado', action, onAction }: Props) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-100 text-gray-500 mb-4">
        <Icon className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <p className="text-gray-400 text-lg mb-4">{message}</p>
      {action && onAction && <Button variant="outline" onClick={onAction}>{action}</Button>}
    </div>
  );
}
```

```tsx
// ErrorState.tsx
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({ message = 'Algo deu errado', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-400 mb-4">
        <AlertTriangle className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <p className="text-red-400 text-lg mb-4">{message}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  );
}
```

```tsx
// Pagination.tsx
import { Button } from './Button';

interface Props {
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
}

export function Pagination({ page, pages, onPageChange }: Props) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        ← Anterior
      </Button>
      <span className="px-4 py-2 text-gray-400">
        {page} <span className="text-gray-600">de</span> {pages}
      </span>
      <Button variant="outline" size="sm" disabled={page === pages} onClick={() => onPageChange(page + 1)}>
        Próxima →
      </Button>
    </nav>
  );
}
```

```tsx
// Skeleton.tsx
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gradient-to-r from-gray-700/60 via-gray-600/40 to-gray-700/60 bg-[length:200%_100%] animate-shimmer', className)} />;
}
```

```tsx
// MovieCardSkeleton.tsx
import { Skeleton } from './Skeleton';

export function MovieCardSkeleton() {
  return (
    <div className="bg-dark-100 rounded-xl overflow-hidden border border-white/5">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
```

**Step 9: `Modal.tsx` — new generic primitive**

```tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-dark-100 rounded-xl w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto border border-white/5 shadow-2xl shadow-black/40`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-gray-100">{title}</h2>
                <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 10: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
```
Expected: no errors.

**Step 11: Commit**

```bash
git add -A
git commit -m "feat(frontend): port common ui primitives to typescript + add Modal"
```

---

#### Task 6: Move globals.css to app/ with design tokens + shimmer keyframe

**Objective:** Move Tailwind base + custom utilities into `app/globals.css` and add the shimmer keyframe referenced by the new Skeleton.

**Files:**
- Create: `frontend/src/app/globals.css`
- Delete (later): `frontend/src/styles/globals.css`

**Step 1: `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #0ea5e9;
  --color-primary-foreground: #ffffff;
  --color-dark-100: #1e293b;
  --color-dark-200: #0f172a;
  --color-dark-300: #0a0f1a;
  --color-border: rgba(255, 255, 255, 0.05);
  --shadow-card: 0 10px 15px -3px rgb(0 0 0 / 0.2);
}

@layer base {
  html { color-scheme: dark; }
  body {
    @apply bg-dark-200 text-gray-100 antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  ::selection { background-color: rgba(14, 165, 233, 0.3); }
}

@layer components {
  .card-hover {
    @apply transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5;
  }
}

@layer utilities {
  .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
  .scrollbar-thin::-webkit-scrollbar-track { @apply bg-dark-100; }
  .scrollbar-thin::-webkit-scrollbar-thumb { @apply bg-gray-600 rounded-full; }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover { @apply bg-gray-500; }
  .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
}

/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.animate-shimmer { animation: shimmer 1.6s ease-in-out infinite; }

/* Page transitions */
@keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.animate-fade-in { animation: fade-in 0.18s ease-out both; }
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat(frontend): move globals.css into app/ with design tokens + shimmer"
```

---

### Phase 3 — Layout & navigation

#### Task 7: Build root layout, providers, and global loading

**Objective:** Set up the App Router shell, providers (Auth + AnimatePresence), Inter font, and metadata defaults.

**Files:**
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/providers.tsx`
- Create: `frontend/src/app/loading.tsx`
- Create: `frontend/src/app/not-found.tsx`
- Create: `public/favicon.ico` (placeholder — `cp /dev/null public/.gitkeep` is fine; copy any 1x1 .ico)

**Step 1: `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:5173'),
  title: { default: 'URMovieRates', template: '%s · URMovieRates' },
  description: 'Descubra, avalie e compartilhe suas opiniões sobre filmes.',
  openGraph: {
    type: 'website',
    siteName: 'URMovieRates',
    locale: 'pt_BR',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = { themeColor: '#0f172a' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 2: `app/providers.tsx`**

```tsx
'use client';

import { AnimatePresence, LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthProvider>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait" initial={false}>
            <div key={pathname} className="animate-fade-in">
              {children}
            </div>
          </AnimatePresence>
        </MotionConfig>
      </LazyMotion>
    </AuthProvider>
  );
}
```

**Step 3: `app/loading.tsx`**

```tsx
import { Spinner } from '@/components/common/Spinner';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
```

**Step 4: `app/not-found.tsx`**

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-bold text-primary-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-100 mb-4">Página não encontrada</h2>
      <p className="text-gray-400 mb-8">A página que você procura não existe.</p>
      <Link href="/" className="btn btn-primary">Voltar para Home</Link>
    </div>
  );
}
```

**Step 5: Verify build**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(frontend): add root layout, providers and global loading/not-found"
```

---

#### Task 8: Build Navbar, Footer, and public layout

**Objective:** Replicate the current Navbar/Footer chrome as TypeScript components used by a route-group layout.

**Files:**
- Create: `frontend/src/components/layout/Navbar.tsx`
- Create: `frontend/src/components/layout/Footer.tsx`
- Create: `frontend/src/components/layout/PublicLayout.tsx`
- Create: `frontend/src/app/(public)/layout.tsx`

**Step 1: `components/layout/Navbar.tsx`**

```tsx
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
```

**Step 2: `components/layout/Footer.tsx`**

```tsx
import { Film } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-100 border-t border-gray-800 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5" strokeWidth={1.5} />
            <span>URMovieRates</span>
          </div>
          <a href="https://github.com/Schuaiquert/urmovierates/blob/main/README.md"
             target="_blank" rel="noopener noreferrer"
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
  );
}
```

**Step 3: `components/layout/PublicLayout.tsx`**

Mirrors the current Layout's behavior (search → URL sync, debounce, AddMovieModal orchestration). Uses `useRouter`/`useSearchParams` from `next/navigation` instead of react-router.

```tsx
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
```

**Step 4: `app/(public)/layout.tsx`**

```tsx
import { PublicLayout } from '@/components/layout/PublicLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
```

**Step 5: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
```
Expected: a few errors will appear because `AddMovieModal` doesn't exist yet — that's fine, fixed in Task 9.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(frontend): add navbar, footer, public layout with search/modal orchestration"
```

---

### Phase 4 — Movie + review components and pages

#### Task 9: Movie components (Card, Grid, FilterBar, FavoriteButton, Add/Edit modals)

**Objective:** Port all movie-related components to TSX, using `next/image`, `next/link`, and the new `Modal` primitive.

**Files:**
- Create: `frontend/src/components/movie/MovieCard.tsx`
- Create: `frontend/src/components/movie/MovieGrid.tsx`
- Create: `frontend/src/components/movie/FilterBar.tsx`
- Create: `frontend/src/components/movie/FavoriteButton.tsx`
- Create: `frontend/src/components/movie/AddMovieModal.tsx`
- Create: `frontend/src/components/movie/EditMovieModal.tsx`
- Create: `frontend/src/components/movie/MovieFormFields.tsx` (shared between Add/Edit)

**Step 1: `MovieCard.tsx`**

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { formatDate, formatDuration } from '@/lib/format';
import type { Movie } from '@/types';

export function MovieCard({ movie, priority = false }: { movie: Movie; priority?: boolean }) {
  const { id, title, year, poster, synopsis, active, createdAt, genres = [], duration } = movie;
  return (
    <Link href={`/movie/${id}`} className="block group">
      <article className="card-hover bg-dark-100 rounded-xl overflow-hidden border border-white/5 h-full flex flex-col">
        <div className="relative aspect-[2/3] bg-dark-300 flex-shrink-0 overflow-hidden">
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={priority}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700">
              <Film className="w-16 h-16" strokeWidth={1} />
            </div>
          )}
          {!active && (
            <Badge variant="default" className="absolute top-2 right-2">Inativo</Badge>
          )}
          {duration && (
            <Badge variant="primary" className="absolute bottom-2 right-2 bg-black/70 border-white/10">
              {formatDuration(duration)}
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-dark-100 to-transparent pointer-events-none" />
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-lg text-gray-100 truncate mb-1">{title}</h3>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <p className="text-gray-500 text-sm">{year}</p>
            {genres.slice(0, 2).map((g, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-dark-300 rounded text-gray-400 capitalize">{g.name}</span>
            ))}
            {genres.length > 2 && (
              <span className="text-xs px-2 py-0.5 bg-dark-300 rounded text-gray-400">+{genres.length - 2}</span>
            )}
          </div>
          {synopsis && <p className="text-gray-400 text-sm line-clamp-2 flex-1">{synopsis}</p>}
          <p className="text-gray-600 text-xs mt-3">Adicionado {formatDate(createdAt)}</p>
        </div>
      </article>
    </Link>
  );
}
```

**Step 2: `FavoriteButton.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  movieId: string;
  isFavorite: boolean;
  onToggle: (id: string) => Promise<unknown>;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' } as const;

export function FavoriteButton({ movieId, isFavorite, onToggle, size = 'md' }: Props) {
  const [loading, setLoading] = useState(false);
  const handle = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setLoading(true);
    try { await onToggle(movieId); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  return (
    <button
      type="button" onClick={handle} disabled={loading} aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={cn(
        SIZES[size],
        'flex items-center justify-center rounded-full transition-all duration-200',
        isFavorite ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                   : 'bg-dark-100/80 text-gray-400 hover:text-red-400 hover:bg-dark-100',
        'disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm',
      )}
    >
      {loading
        ? <Loader2 className="w-1/2 h-1/2 animate-spin" strokeWidth={2} />
        : <Heart className="w-1/2 h-1/2" strokeWidth={1.75} fill={isFavorite ? 'currentColor' : 'none'} />}
    </button>
  );
}
```

**Step 3: `MovieFormFields.tsx` (shared form body for Add/Edit modals)**

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { GENRE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/cn';

export interface MovieFormValues {
  title: string;
  year: string;
  synopsis: string;
  poster: string;
  trailer: string;
  genres: string[];
  duration: string;
}

interface Props {
  values: MovieFormValues;
  onChange: (next: MovieFormValues) => void;
}

export function MovieFormFields({ values, onChange }: Props) {
  const set = <K extends keyof MovieFormValues>(k: K, v: MovieFormValues[K]) =>
    onChange({ ...values, [k]: v });

  const [genreOpen, setGenreOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Input label="Título" name="title" value={values.title}
        onChange={(e) => set('title', e.target.value)} required />
      <Input label="Ano" name="year" type="number" value={values.year}
        onChange={(e) => set('year', e.target.value)} required />

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Gêneros</label>
        <button type="button" onClick={() => setGenreOpen((o) => !o)}
          className="w-full bg-dark-300 text-left text-gray-100 rounded-lg px-3 py-2 border border-gray-600 hover:border-primary-500 focus:border-primary-500 focus:outline-none min-h-[42px] transition-colors"
        >
          {values.genres.length > 0 ? values.genres.join(', ') : 'Selecione os gêneros'}
        </button>
        {genreOpen && (
          <div className="mt-2 grid grid-cols-2 gap-1 p-2 bg-dark-300 border border-gray-600 rounded-lg max-h-56 overflow-y-auto scrollbar-thin">
            {GENRE_OPTIONS.map((g) => {
              const active = values.genres.includes(g);
              return (
                <button type="button" key={g} onClick={() =>
                  set('genres', active ? values.genres.filter((x) => x !== g) : [...values.genres, g])}
                  className={cn(
                    'text-left text-sm px-2 py-1.5 rounded transition-colors',
                    active ? 'bg-primary-600/20 text-primary-300' : 'text-gray-300 hover:bg-white/5',
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Input label="Duração (minutos)" name="duration" type="number" value={values.duration}
        onChange={(e) => set('duration', e.target.value)} />
      <Input label="Poster (URL)" name="poster" value={values.poster}
        onChange={(e) => set('poster', e.target.value)} />
      <Input label="Trailer (URL)" name="trailer" value={values.trailer}
        onChange={(e) => set('trailer', e.target.value)} />
      <Textarea label="Sinopse" name="synopsis" value={values.synopsis}
        onChange={(e) => set('synopsis', e.target.value)} rows={4} />
    </div>
  );
}
```

**Step 4: `AddMovieModal.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MovieFormFields, type MovieFormValues } from './MovieFormFields';
import { moviesAPI } from '@/services/api';
import type { AxiosError } from 'axios';

interface Props { open: boolean; onClose: () => void; onAdded: () => void; }

const EMPTY: MovieFormValues = { title: '', year: '', synopsis: '', poster: '', trailer: '', genres: [], duration: '' };

export function AddMovieModal({ open, onClose, onAdded }: Props) {
  const [values, setValues] = useState<MovieFormValues>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await moviesAPI.create({
        ...values,
        year: parseInt(values.year) || null,
        duration: parseInt(values.duration) || null,
      });
      setValues(EMPTY);
      onAdded();
    } catch (e) {
      const err = e as AxiosError<{ error?: string }>;
      setError(err.response?.data?.error ?? err.message ?? 'Erro ao adicionar filme');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Novo Filme" size="md">
      <form onSubmit={submit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <MovieFormFields values={values} onChange={setValues} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Adicionar</Button>
        </div>
      </form>
    </Modal>
  );
}
```

**Step 5: `EditMovieModal.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MovieFormFields, type MovieFormValues } from './MovieFormFields';
import { moviesAPI } from '@/services/api';
import type { AxiosError } from 'axios';
import type { Movie } from '@/types';

interface Props { open: boolean; movie: Movie; onClose: () => void; onUpdated: () => void; }

export function EditMovieModal({ open, movie, onClose, onUpdated }: Props) {
  const [values, setValues] = useState<MovieFormValues>({
    title: movie.title, year: String(movie.year), synopsis: movie.synopsis ?? '',
    poster: movie.poster ?? '', trailer: movie.trailer ?? '',
    genres: movie.genres.map((g) => g.name), duration: movie.duration ? String(movie.duration) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) setError(''); }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await moviesAPI.update(movie.id, {
        ...values,
        year: parseInt(values.year) || null,
        duration: parseInt(values.duration) || null,
      });
      onUpdated();
      onClose();
    } catch (e) {
      const err = e as AxiosError<{ error?: string }>;
      setError(err.response?.data?.error ?? err.message ?? 'Erro ao atualizar filme');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar Filme" size="md">
      <form onSubmit={submit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <MovieFormFields values={values} onChange={setValues} />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
```

**Step 6: `FilterBar.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Filter, Film as FilmIcon, Calendar, Check, ChevronDown, X } from 'lucide-react';
import { moviesAPI } from '@/services/api';

function FilterField({ icon: Icon, label, value, options, onChange, disabled }:
{ icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string;
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
  const [year, setYear] = useState(searchParams.get('year') ?? '');
  const [genre, setGenre] = useState(searchParams.get('genre') ?? '');
  const [status, setStatus] = useState(
    searchParams.get('active') === 'false' ? 'inactive'
      : searchParams.get('active') === 'true' ? 'active' : 'all');
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
    const params = new URLSearchParams(searchParams.toString());
    if (year) params.set('year', year); else params.delete('year');
    if (genre) params.set('genre', genre); else params.delete('genre');
    if (status === 'active') params.set('active', 'true');
    else if (status === 'inactive') params.set('active', 'false');
    else params.delete('active');
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  const clear = () => {
    setYear(''); setGenre(''); setStatus('all');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('year'); params.delete('genre'); params.delete('active'); params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
```

**Step 7: `MovieGrid.tsx` — composes card + favorite button + optimistic state**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { MovieCard } from './MovieCard';
import { FavoriteButton } from './FavoriteButton';
import { MovieCardSkeleton } from '@/components/common/MovieCardSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteStatus } from '@/hooks/useFavorites';
import { favoritesAPI } from '@/services/api';
import type { Movie } from '@/types';

export function MovieGrid({ movies, loading }: { movies: Movie[]; loading: boolean }) {
  const { user } = useAuth();
  const ids = movies.map((m) => m.id);
  const { favorites, toggle } = useFavoriteStatus(user ? ids : []);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => { setPending({}); }, [ids.join(',')]);

  const onToggle = async (movieId: string) => {
    if (!user) { window.alert('Faça login para favoritar filmes'); return; }
    setPending((p) => ({ ...p, [movieId]: !favorites[movieId] }));
    try { await toggle(movieId); }
    catch (e: any) {
      setPending((p) => ({ ...p, [movieId]: favorites[movieId] }));
      window.alert(e.userMessage ?? 'Erro ao favoritar');
      throw e;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {Array.from({ length: 12 }, (_, i) => <MovieCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {movies.map((movie, i) => (
        <div key={movie.id} className="relative">
          <MovieCard movie={movie} priority={i < 3} />
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton
              movieId={movie.id}
              isFavorite={pending[movie.id] ?? favorites[movie.id] ?? false}
              onToggle={onToggle}
              size="sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

Note: `MovieGrid` doesn't import `favoritesAPI` directly; the optimistic UI lives in this component to keep `useFavoriteStatus` simple. If you prefer centralizing, you can pass `favoritesAPI.toggle` via `onToggle` instead — either is fine.

**Step 8: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
```

**Step 9: Commit**

```bash
git add -A
git commit -m "feat(frontend): port movie components to tsx with next/image and Modal"
```

---

#### Task 10: Review components

**Objective:** Port `ReviewCard` and `ReviewForm` to TSX.

**Files:**
- Create: `frontend/src/components/review/ReviewCard.tsx`
- Create: `frontend/src/components/review/ReviewForm.tsx`

**Step 1: `ReviewCard.tsx`**

```tsx
import { Rating } from '@/components/common/Rating';
import { formatDate } from '@/lib/format';
import type { Review } from '@/types';

export function ReviewCard({ review, onDelete }: { review: Review; onDelete?: (id: string) => void }) {
  const { id, rating, text, user, createdAt } = review;
  return (
    <article className="bg-dark-100 rounded-xl p-5 transition-colors hover:bg-dark-100/80 border border-white/5">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-semibold">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium text-gray-100">
                {user?.name || 'Anônimo'}{user?.role === 'ADMIN' && ' (ADM)'}
              </p>
              <Rating value={rating} size="sm" />
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-gray-500 text-sm mb-2">{formatDate(createdAt, 'long')}</p>
          {onDelete && (
            <button onClick={() => onDelete(id)} className="text-gray-600 hover:text-red-400 text-sm transition-colors">
              Excluir
            </button>
          )}
        </div>
      </div>
      {text && <p className="text-gray-300 mt-3 leading-relaxed">{text}</p>}
    </article>
  );
}
```

**Step 2: `ReviewForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Rating } from '@/components/common/Rating';

const MAX_CHARS = 1000;
const RATING_LABEL: Record<number, string> = { 1: 'Não gostou', 2: 'Regular', 3: 'Bom', 4: 'Ótimo', 5: 'Excelente!' };

export function ReviewForm({ onSubmit, loading }: { onSubmit: (data: { rating: number; text: string }) => Promise<void>; loading?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="bg-dark-100 rounded-xl p-6 text-center border border-white/5">
        <p className="text-gray-300 mb-4">Faça login para avaliar este filme</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">Entrar</Link>
          <Link href="/register" className="px-6 py-2 bg-dark-300 hover:bg-dark-100 text-gray-200 rounded-lg transition-colors">Cadastrar</Link>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Selecione uma nota de 1 a 5'); return; }
    setError('');
    try { await onSubmit({ rating, text }); setRating(0); setText(''); }
    catch (e: any) { setError(e.userMessage ?? 'Erro ao publicar avaliação'); }
  };

  return (
    <form onSubmit={submit} className="bg-dark-100 rounded-xl p-6 border border-white/5">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Avalie este filme</h3>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-3">Sua nota</label>
        <Rating value={rating} size="lg" interactive onChange={setRating} />
        {rating > 0 && <p className="text-sm text-gray-500 mt-1">{RATING_LABEL[rating]}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">Seu comentário <span className="text-gray-600">(opcional)</span></label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="O que você achou do filme? Conte sua experiência..."
          className="w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 min-h-[120px] resize-none transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          rows={4}
        />
        <p className="text-gray-600 text-xs mt-1 text-right">{text.length}/{MAX_CHARS}</p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <Button type="submit" loading={loading} disabled={rating === 0} className="w-full">Publicar Avaliação</Button>
    </form>
  );
}
```

**Step 3: Type-check & commit**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
git add -A
git commit -m "feat(frontend): port review components to typescript"
```

---

#### Task 11: Home page (`app/page.tsx`)

**Objective:** Replace `pages/HomePage.jsx` with the App Router home page. Server-rendered initial fetch + client filter/grid.

**Files:**
- Create: `frontend/src/app/page.tsx`

**Step 1: `app/page.tsx`**

```tsx
import { HomeClient } from './home-client';
import { moviesAPI } from '@/services/api';
import type { Movie, ApiResponse } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filmes',
  description: 'Veja todos os filmes cadastrados, filtre por gênero, ano ou status e descubra novas avaliações.',
};

async function fetchInitialMovies(searchParams: Record<string, string>) {
  const params: Record<string, unknown> = { page: searchParams.page ?? '1', limit: 12 };
  for (const k of ['search', 'year', 'genre'] as const) {
    if (searchParams[k]) params[k] = searchParams[k];
  }
  if (searchParams.active) params.active = searchParams.active === 'true';
  try {
    const { data } = await moviesAPI.getAll(params);
    return { movies: data.data, pagination: data.pagination };
  } catch {
    return { movies: [] as Movie[], pagination: undefined };
  }
}

export default async function Page({ searchParams }: { searchParams: Record<string, string> }) {
  const { movies, pagination } = await fetchInitialMovies(searchParams);
  return <HomeClient initialMovies={movies} initialPagination={pagination} initialParams={searchParams} />;
}
```

**Step 2: `app/home-client.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Film } from 'lucide-react';
import { MovieGrid } from '@/components/movie/MovieGrid';
import { FilterBar } from '@/components/movie/FilterBar';
import { Pagination, EmptyState, ErrorState } from '@/components/common';
import { moviesAPI } from '@/services/api';
import type { Movie, Pagination } from '@/types';

interface Props {
  initialMovies: Movie[];
  initialPagination?: Pagination;
  initialParams: Record<string, string>;
}

export function HomeClient({ initialMovies, initialPagination, initialParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [pagination, setPagination] = useState<Pagination>(initialPagination ?? { page: 1, limit: 12, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshKey = typeof document !== 'undefined'
    ? document.querySelector('main')?.getAttribute('data-refresh-key') ?? '0'
    : '0';

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    const params: Record<string, unknown> = { page: searchParams.get('page') ?? '1', limit: 12 };
    const search = searchParams.get('search'); if (search) params.search = search;
    const year = searchParams.get('year'); if (year) params.year = year;
    const genre = searchParams.get('genre'); if (genre) params.genre = genre;
    const active = searchParams.get('active');
    if (active === 'true') params.active = true;
    else if (active === 'false') params.active = false;
    try {
      const { data } = await moviesAPI.getAll(params);
      setMovies(data.data);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: any) { setError(e.userMessage ?? 'Erro ao carregar filmes'); }
    finally { setLoading(false); }
  }, [searchParams]);

  useEffect(() => { refetch(); }, [refetch, refreshKey]);

  const onPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const total = pagination.total;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 text-left">Filmes</h1>
      <div className="mt-3 mb-4"><FilterBar /></div>
      <p className="text-gray-500 text-left mb-6">
        {total > 0 ? `${total} filme${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}` : 'Nenhum filme encontrado'}
      </p>
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : movies.length === 0 ? (
        <EmptyState
          icon={Film}
          message={initialParams.search || initialParams.year ? 'Nenhum filme matches seus filtros' : 'Nenhum filme cadastrado'}
          action="Limpar filtros"
          onAction={() => router.replace(pathname)}
        />
      ) : (
        <>
          <MovieGrid movies={movies} loading={loading} />
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={onPage} />
        </>
      )}
    </div>
  );
}
```

**Step 3: Create common barrel `src/components/common/index.ts`**

```ts
export { Spinner } from './Spinner';
export { Button } from './Button';
export { Input } from './Input';
export { Textarea } from './Textarea';
export { Card } from './Card';
export { Badge } from './Badge';
export { Rating } from './Rating';
export { EmptyState } from './EmptyState';
export { ErrorState } from './ErrorState';
export { Pagination } from './Pagination';
export { Skeleton } from './Skeleton';
export { MovieCardSkeleton } from './MovieCardSkeleton';
export { Modal } from './Modal';
```

**Step 4: Type-check & commit**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
git add -A
git commit -m "feat(frontend): home page with server initial fetch + client filters/grid"
```

---

#### Task 12: Movie detail page (`app/movie/[id]/page.tsx`)

**Objective:** Server-render movie + reviews for SEO, with a client island for the review form / edit modal.

**Files:**
- Create: `frontend/src/app/movie/[id]/page.tsx`
- Create: `frontend/src/app/movie/[id]/loading.tsx`
- Create: `frontend/src/app/movie/[id]/movie-detail.tsx` (client island)
- Create: `frontend/src/components/seo/MovieSchema.tsx`

**Step 1: `app/movie/[id]/loading.tsx`**

```tsx
import { Spinner } from '@/components/common/Spinner';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[300px_1fr] gap-8">
        <div className="aspect-[2/3] bg-dark-300 rounded-xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-2/3 bg-dark-300 rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-dark-300 rounded animate-pulse" />
          <div className="h-24 bg-dark-300 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: `components/seo/MovieSchema.tsx`**

```tsx
import type { Movie, ReviewStats } from '@/types';

export function MovieSchema({ movie, stats }: { movie: Movie; stats: ReviewStats }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    datePublished: String(movie.year),
    image: movie.poster ?? undefined,
    description: movie.synopsis ?? undefined,
    genre: movie.genres.map((g) => g.name),
    duration: movie.duration ? `PT${movie.duration}M` : undefined,
    aggregateRating: stats.count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: stats.average,
      bestRating: 5,
      ratingCount: stats.count,
    } : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
```

**Step 3: `app/movie/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { moviesAPI, reviewsAPI } from '@/services/api';
import { MovieSchema } from '@/components/seo/MovieSchema';
import { MovieDetail } from './movie-detail';
import type { ApiResponse, Movie, Review, ReviewStats } from '@/types';

interface PageProps { params: { id: string }; }

async function fetchMovie(id: string): Promise<{ movie?: Movie; reviews: Review[]; stats: ReviewStats }> {
  try {
    const movieRes = await moviesAPI.getById(id);
    const [reviewsRes, statsRes] = await Promise.all([
      reviewsAPI.getByMovie(id).catch(() => ({ data: { data: [] } as ApiResponse<Review[]> })),
      reviewsAPI.getMovieStats(id).catch(() => ({ data: { data: { average: 0, count: 0 } } as ApiResponse<ReviewStats> })),
    ]);
    return {
      movie: movieRes.data.data,
      reviews: reviewsRes.data.data,
      stats: statsRes.data.data,
    };
  } catch {
    return { reviews: [], stats: { average: 0, count: 0 } };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { movie } = await fetchMovie(params.id);
  if (!movie) return { title: 'Filme não encontrado' };
  return {
    title: movie.title,
    description: movie.synopsis ?? `Avaliações e informações sobre ${movie.title} (${movie.year}).`,
    openGraph: {
      title: `${movie.title} (${movie.year})`,
      description: movie.synopsis ?? undefined,
      images: movie.poster ? [{ url: movie.poster }] : undefined,
      type: 'video.movie',
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { movie, reviews, stats } = await fetchMovie(params.id);
  if (!movie) notFound();
  return (
    <>
      <MovieSchema movie={movie} stats={stats} />
      <MovieDetail initialMovie={movie} initialReviews={reviews} initialStats={stats} />
    </>
  );
}
```

**Step 4: `app/movie/[id]/movie-detail.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film, ArrowLeft, Pencil, PlayCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useMovieReviews } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewForm, ReviewCard } from '@/components/review';
import { EditMovieModal } from '@/components/movie/EditMovieModal';
import { Spinner, Button, Rating, ErrorState } from '@/components/common';
import { formatDuration } from '@/lib/format';
import type { Movie, Review, ReviewStats } from '@/types';

interface Props { initialMovie: Movie; initialReviews: Review[]; initialStats: ReviewStats; }

export function MovieDetail({ initialMovie, initialReviews, initialStats }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { reviews, stats, loading, createReview, deleteReview, refetch } =
    useMovieReviews(initialMovie.id);
  // Initialize from server-provided data on first render
  const [hydrated] = useState(() => ({ reviews: initialReviews, stats: initialStats }));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [movie, setMovie] = useState(initialMovie);

  const handleCreate = async (data: { rating: number; text: string }) => {
    setSubmitting(true);
    try { await createReview(data); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    try { await deleteReview(id); }
    catch (e: any) { window.alert(e.userMessage ?? 'Erro ao excluir avaliação'); }
  };

  const displayReviews = reviews.length > 0 ? reviews : hydrated.reviews;
  const displayStats = stats.count > 0 ? stats : hydrated.stats;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />Voltar para filmes
      </Link>

      <div className="grid lg:grid-cols-[300px_1fr] gap-8 mb-12">
        <div className="flex-shrink-0">
          <div className="sticky top-24 aspect-[2/3] bg-dark-300 rounded-xl overflow-hidden flex items-center justify-center">
            {movie.poster ? (
              <Image src={movie.poster} alt={movie.title} fill sizes="(max-width: 1024px) 100vw, 300px"
                className="object-cover" priority unoptimized />
            ) : (
              <Film className="w-24 h-24 text-gray-700" strokeWidth={1} />
            )}
          </div>
        </div>

        <div>
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">{movie.title}</h1>
            <p className="text-xl text-gray-400">
              {movie.year}{movie.duration ? ` · ${formatDuration(movie.duration)}` : ''}
            </p>
          </div>

          {displayStats.count > 0 && (
            <div className="flex items-center gap-6 p-6 bg-dark-100 rounded-xl mb-6 border border-white/5">
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-400">{displayStats.average}</div>
                <div className="text-yellow-400 text-sm mt-1">de 5</div>
              </div>
              <div className="flex-1">
                <Rating value={Math.round(displayStats.average)} size="lg" />
                <p className="text-gray-400 mt-2">
                  Baseado em <span className="text-gray-300">{displayStats.count}</span> avaliaç{displayStats.count !== 1 ? 'ões' : 'ão'}
                </p>
              </div>
            </div>
          )}

          {movie.genres.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span key={g.id} className="text-xs px-2 py-1 bg-dark-300 rounded text-gray-300 capitalize">{g.name}</span>
              ))}
            </div>
          )}

          {movie.synopsis && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-3">Sinopse</h2>
              <p className="text-gray-300 leading-relaxed">{movie.synopsis}</p>
            </div>
          )}

          {isAdmin && (
            <div className="mb-6">
              <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
                <Pencil className="w-4 h-4" strokeWidth={2} />Editar Filme
              </Button>
            </div>
          )}

          {movie.trailer && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-3">Trailer</h2>
              <a href={movie.trailer} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                <PlayCircle className="w-5 h-5" strokeWidth={1.75} />Assistir no YouTube
              </a>
            </div>
          )}

          {movie.active && (
            <div className="mt-8">
              <ReviewForm onSubmit={handleCreate} loading={submitting} />
              {success && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" strokeWidth={2} />
                  <p className="text-green-400 text-sm">Avaliação publicada com sucesso!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">
          Avaliações {displayStats.count > 0 && `(${displayStats.count})`}
        </h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : displayReviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-100 text-gray-500 mb-4">
              <MessageSquare className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <p className="text-gray-300 text-lg">Este filme ainda não tem avaliações.</p>
            <p className="text-gray-500 text-sm mt-1">Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayReviews.map((r) => (
              <ReviewCard key={r.id} review={r}
                onDelete={user && r.userId === user.id ? () => handleDelete(r.id) : undefined} />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditMovieModal open={editing} movie={movie} onClose={() => setEditing(false)}
          onUpdated={async () => { setEditing(false); await refetch(); }} />
      )}
    </div>
  );
}
```

Note: `useMovieReviews` re-fetches on mount, which will replace the hydrated server data. That is acceptable here. If you want strict SSR reuse without the double fetch, drop `useMovieReviews` and use plain state + the server data + a `mutate` callback. The current approach is simpler.

**Step 5: Type-check & commit**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
git add -A
git commit -m "feat(frontend): movie detail page with ssr + json-ld + client review island"
```

---

#### Task 13: Auth pages — login, register, profile

**Objective:** Port Login/Register/Profile to Next.js with `useRouter` from `next/navigation`.

**Files:**
- Create: `frontend/src/app/login/page.tsx`
- Create: `frontend/src/app/register/page.tsx`
- Create: `frontend/src/app/profile/page.tsx`

**Step 1: `app/login/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/common';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); router.push('/'); }
    catch (e: any) { setError(e.userMessage ?? 'Erro ao fazer login'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Entrar</h1>
          <p className="text-gray-400">Faça login para avaliar filmes</p>
        </div>
        <form onSubmit={submit} className="bg-dark-100 rounded-xl p-8 border border-white/5">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="mb-6 space-y-2">
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className="mb-6 space-y-2">
            <label className="block text-sm font-medium text-gray-400">Senha</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" loading={loading} className="w-full">Entrar</Button>
          <p className="text-center text-gray-400 mt-6">
            Não tem conta?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: `app/register/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/common';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('As senhas não coincidem'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return; }
    setLoading(true);
    try { await register(name, email, password); router.push('/'); }
    catch (e: any) { setError(e.userMessage ?? 'Erro ao fazer cadastro'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Cadastre-se</h1>
          <p className="text-gray-400">Crie sua conta para avaliar filmes</p>
        </div>
        <form onSubmit={submit} className="bg-dark-100 rounded-xl p-8 border border-white/5">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {([
            { label: 'Nome', v: name, set: setName, type: 'text', placeholder: 'Seu nome' },
            { label: 'Email', v: email, set: setEmail, type: 'email', placeholder: 'seu@email.com' },
            { label: 'Senha', v: password, set: setPassword, type: 'password', placeholder: '••••••••' },
            { label: 'Confirmar Senha', v: confirm, set: setConfirm, type: 'password', placeholder: '••••••••' },
          ] as const).map((f) => (
            <div key={f.label} className="mb-6 space-y-2">
              <label className="block text-sm font-medium text-gray-400">{f.label}</label>
              <Input type={f.type} value={f.v} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} required />
            </div>
          ))}
          <Button type="submit" loading={loading} className="w-full">Cadastrar</Button>
          <p className="text-center text-gray-400 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: `app/profile/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/common';
import { Modal } from '@/components/common/Modal';

export default function ProfilePage() {
  const { user, logout, deleteAccount, updateUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Acesso Negado</h1>
        <p className="text-gray-400 mb-6">Você precisa estar logado para ver seu perfil.</p>
        <Button onClick={() => router.push('/login')}>Entrar</Button>
      </div>
    );
  }

  const saveName = async () => {
    if (!newName.trim() || newName === user.name) { setEditing(false); return; }
    setSaving(true);
    try { await updateUser({ name: newName.trim() }); setEditing(false); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try { await deleteAccount(); router.push('/login'); }
    catch (e) { console.error(e); setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Minha Conta</h1>
      <div className="max-w-2xl">
        <div className="bg-dark-100 rounded-xl p-6 mb-6 border border-white/5">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Informações do Perfil</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-2xl font-bold text-white">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                    <Button onClick={saveName} loading={saving}>Salvar</Button>
                    <Button variant="outline" onClick={() => { setEditing(false); setNewName(user.name); }}>Cancelar</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium text-gray-100">
                      {user.name || 'Usuário'}{user.role === 'ADMIN' && ' (ADM)'}
                    </p>
                    <button onClick={() => { setEditing(true); setNewName(user.name || ''); }}
                      className="p-1 text-gray-400 hover:text-primary-400 transition-colors" title="Editar nome" aria-label="Editar nome">
                      <Pencil className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                )}
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Tipo de conta</p>
              <p className="text-gray-200 font-medium">{user.role === 'ADMIN' ? 'Administrador' : 'Usuário comum'}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl p-6 mb-6 border border-white/5">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Ações</h2>
          <div className="space-y-3">
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left">
              <LogOut className="w-5 h-5 text-gray-400" strokeWidth={1.75} />
              <div>
                <p className="text-gray-100 font-medium">Sair da conta</p>
                <p className="text-gray-400 text-sm">Faça logout para sair</p>
              </div>
            </button>
            <h2 className="text-lg font-semibold text-red-400 mb-2 pt-4">Zona de Perigo</h2>
            <p className="text-gray-400 text-sm mb-2">
              A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados,
              incluindo avaliações e favoritos, serão removidos.
            </p>
            <button onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-left border border-red-500/30">
              <Trash2 className="w-5 h-5 text-red-400" strokeWidth={1.75} />
              <div>
                <p className="text-red-400 font-medium">Excluir conta</p>
                <p className="text-gray-400 text-sm">Remover sua conta permanentemente</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Confirmar Exclusão">
        <div className="p-6">
          <p className="text-gray-400 mb-6">Tem certeza que deseja excluir sua conta? Esta ação é irreversível.</p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)} className="flex-1">Cancelar</Button>
            <Button onClick={doDelete} loading={deleting} className="flex-1 !bg-red-600 hover:!bg-red-700">Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

**Step 4: Type-check & commit**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
git add -A
git commit -m "feat(frontend): login, register, profile pages"
```

---

#### Task 14: Favorites page

**Objective:** Port the favorites page using `useUserFavorites` and the `MovieGrid`-like layout (without the toggle, since favorites page removes instead of toggling).

**Files:**
- Create: `frontend/src/app/favorites/page.tsx`

**Step 1: `app/favorites/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserFavorites } from '@/hooks/useFavorites';
import { MovieCard } from '@/components/movie/MovieCard';
import { FavoriteButton } from '@/components/movie/FavoriteButton';
import { EmptyState, ErrorState, Pagination, Spinner, MovieCardSkeleton } from '@/components/common';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { movies, pagination, loading, error, remove, refetch } = useUserFavorites();
  const [removing, setRemoving] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState icon={Lock} message="Você precisa estar logado para ver seus favoritos"
          action="Voltar para Home" onAction={() => (window.location.href = '/')} />
      </div>
    );
  }

  const handleRemove = async (movieId: string) => {
    setRemoving(movieId);
    try { await remove(movieId); }
    catch (e: any) { window.alert(e.userMessage ?? 'Erro ao remover favorito'); }
    finally { setRemoving(null); }
  };

  const onPage = async (p: number) => {
    await refetch();
    // pagination handler could be added to useUserFavorites hook
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Meus Favoritos</h1>
        <p className="text-gray-500">
          {pagination.total > 0
            ? `${pagination.total} filme${pagination.total !== 1 ? 's' : ''} salvo${pagination.total !== 1 ? 's' : ''}`
            : 'Nenhum filme salvo'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 12 }, (_, i) => <MovieCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : movies.length === 0 ? (
        <EmptyState icon={Heart} message="Você ainda não tem filmes favoritos"
          action="Explorar filmes" onAction={() => (window.location.href = '/')} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="relative">
                <MovieCard movie={movie} />
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton
                    movieId={movie.id}
                    isFavorite={removing !== movie.id}
                    onToggle={handleRemove}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
          {pagination.pages > 1 && (
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={onPage} />
          )}
        </>
      )}
    </div>
  );
}
```

Note: The favorites page only removes; the existing `useUserFavorites` hook re-fetches page 1 on mount, so multi-page navigation needs the hook to accept a page arg. Update the hook in Task 4 if you want true pagination — the current version is a faithful port.

**Step 2: Type-check & commit**

```bash
cd /home/projects/pedro/urmovierates/frontend && npx tsc --noEmit
git add -A
git commit -m "feat(frontend): favorites page"
```

---

### Phase 5 — Verification, polish, cleanup

#### Task 15: Build and runtime smoke test

**Objective:** Confirm `next build` succeeds, dev server boots, and the home page renders a real movie from the API.

**Files:** none (verification only)

**Step 1: Ensure backend is running**

```bash
cd /home/projects/pedro/urmovierates
cd infra/docker/dev && docker-compose ps
```

If not running:
```bash
cd /home/projects/pedro/urmovierates/infra/docker/dev && docker-compose up -d
cd /home/projects/pedro/urmovierates && npx prisma migrate deploy && npx prisma db seed
npm run dev &
```

**Step 2: Production build**

```bash
cd /home/projects/pedro/urmovierates/frontend
npm run build
```

Expected: green build, routes listed for `/`, `/movie/[id]`, `/favorites`, `/login`, `/register`, `/profile`, `/_not-found`.

If you see errors about missing `Viewport` export, ensure `app/layout.tsx` has `export const viewport: Viewport = ...` (we do).

**Step 3: Start dev server and curl the home page**

```bash
npm run dev &
sleep 4
curl -s http://localhost:5173/ | head -c 500
```

Expected: HTML containing `URMovieRates` in the title and the navbar markup. The page text is initially the SSR shell, then client hydrates and fetches movies.

**Step 4: Hit the API via the rewrite**

```bash
curl -s 'http://localhost:5173/api/movies?limit=2' | head -c 500
```

Expected: JSON from the backend (rewritten to `localhost:3001`).

**Step 5: Visual check with a quick browser tour**

Open `http://localhost:5173/` and verify:
- Home page lists movie cards with posters and titles.
- Click a card → `/movie/[id]` shows poster, stats, reviews.
- Click `Favoritos` → `/favorites` shows empty state when not logged in.
- Click `Entrar` → `/login` form renders.
- Open `Adicionar filmes` button (after login as admin) → modal opens with smooth animation.

**Step 6: Kill the dev server**

```bash
kill %1 2>/dev/null || true
```

**Step 7: Commit any config tweaks**

```bash
git add -A
git diff --cached --quiet || git commit -m "chore(frontend): post-build polish"
```

---

#### Task 16: Remove legacy Vite files and old `.jsx` sources

**Objective:** Delete files superseded by the Next.js migration. Keep the commit small and reversible via git.

**Files (delete):**
- `frontend/dist/`
- `frontend/src/App.jsx`
- `frontend/src/main.jsx`
- `frontend/src/styles/`
- `frontend/src/components/common/index.jsx`
- `frontend/src/components/layout/Layout.jsx`
- `frontend/src/components/layout/Navbar.jsx`
- `frontend/src/components/movie/{MovieCard,FilterBar,MovieFilters,FavoriteButton,AddMovieModal,EditMovieModal,index}.{js,jsx}`
- `frontend/src/components/review/{ReviewCard,ReviewForm,index}.{js,jsx}`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/hooks/{useFavorites,useMovies,useReviews}.js`
- `frontend/src/pages/*.jsx`
- `frontend/src/services/api.js`

**Step 1: Delete**

```bash
cd /home/projects/pedro/urmovierates/frontend
rm -rf dist src/App.jsx src/main.jsx src/styles
rm -f src/components/common/index.jsx
rm -f src/components/layout/Layout.jsx src/components/layout/Navbar.jsx
rm -f src/components/movie/MovieCard.jsx src/components/movie/FilterBar.jsx \
      src/components/movie/MovieFilters.jsx src/components/movie/FavoriteButton.jsx \
      src/components/movie/AddMovieModal.jsx src/components/movie/EditMovieModal.jsx \
      src/components/movie/index.js
rm -f src/components/review/ReviewCard.jsx src/components/review/ReviewForm.jsx \
      src/components/review/index.js
rm -f src/context/AuthContext.jsx
rm -f src/hooks/useFavorites.js src/hooks/useMovies.js src/hooks/useReviews.js
rm -f src/pages/HomePage.jsx src/pages/MoviePage.jsx src/pages/FavoritesPage.jsx \
      src/pages/LoginPage.jsx src/pages/RegisterPage.jsx src/pages/ProfilePage.jsx \
      src/pages/NotFoundPage.jsx
rm -f src/services/api.js
```

**Step 2: Verify nothing imports the old paths**

```bash
grep -RIn "from '\\.\\./.*\\.jsx" src 2>/dev/null || true
grep -RIn "from '\\.\\./.*\\.js" src 2>/dev/null || true
```

Expected: no results inside `src/` (any matches would be in `node_modules` only).

**Step 3: Type-check + build**

```bash
npx tsc --noEmit && npm run build
```
Expected: clean.

**Step 4: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add -A
git commit -m "chore(frontend): remove legacy vite/jsx sources after next.js migration"
```

---

#### Task 17: Update root README with new frontend instructions

**Objective:** Point contributors at the new dev script.

**Files:**
- Modify: `README.md` (lines ~100-115)

**Step 1: Patch the frontend section**

Replace the existing `## Frontend` block in `README.md` with:

```markdown
## Frontend

O frontend Next.js está em `frontend/`. Para iniciá-lo:

```bash
# 1. Entrar no diretório do frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Iniciar em desenvolvimento
npm run dev
```

O frontend estará disponível em **http://localhost:5173**. Em dev, requisições para `/api/*` são reescritas para o backend em `http://localhost:3001` via `next.config.mjs` (`rewrites()`).

### Stack do Frontend
- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS 3
- Framer Motion (transições)
- `lucide-react` (ícones)
- `axios` (HTTP)

### Variáveis do Frontend

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NEXT_PUBLIC_API_BASE` | (opcional) override da URL `/api` | usa o rewrite do `next.config.mjs` |
```

**Step 2: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add README.md
git commit -m "docs: update frontend section for next.js migration"
```

---

## Tests / Validation Summary

- **Type check:** `cd frontend && npx tsc --noEmit` (run after every task).
- **Lint:** `cd frontend && npm run lint` (run after every task).
- **Production build:** `cd frontend && npm run build` (Task 15).
- **Dev smoke test:** `cd frontend && npm run dev` + curl `/` and `/api/movies` (Task 15).
- **Manual browser check:** Home → click movie → reviews render; admin login → Add modal; Favorites empty state; Profile page; 404 (Task 15).

This project has no existing test suite (`tests/` in the repo root is for the backend), so we're not adding unit tests in this migration. If the user later wants Vitest/RTL coverage for the new components, the structure in `src/components/common` is already designed for it.

## Risks, Tradeoffs, Open Questions

1. **lucide-react version jump.** Current pin is `^1.17.0` (an old fork of a different lib). We bump to `^0.400.0` (the real lucide-react). All icon names used (`Film`, `Search`, `X`, `Clapperboard`, `Home`, `User`, `LogOut`, `LogIn`, `Heart`, `Plus`, `Filter`, `Calendar`, `Check`, `ChevronDown`, `Pencil`, `PlayCircle`, `CheckCircle2`, `MessageSquare`, `Star`, `ArrowLeft`, `Loader2`, `AlertTriangle`, `Inbox`, `LogOut`, `Trash2`) exist in the new version. If the bump is undesirable, the alternative is to keep `1.17.0` and live with the API mismatch — not recommended.
2. **Favorites pagination.** The current `useUserFavorites` only refetches page 1. If the favorites list ever spans multiple pages, the hook needs a `page` arg (or use the URL search param). Tracked in Task 14 as a follow-up.
3. **`/profile` page is client-rendered.** Acceptable — it requires the user object from `localStorage`. SEO for `/profile` is N/A.
4. **API rewrite vs. CORS.** We use Next's `rewrites()` to proxy `/api/*` to `:3001`. This avoids CORS in dev and keeps the same `axios baseURL = '/api'`. In production, the deployment topology will determine if the rewrite stays or we switch to a real `NEXT_PUBLIC_API_BASE`.
5. **Image domains.** Posters can come from any CDN (TMDB, IMDB, etc.). We set `images.remotePatterns: [{ protocol: 'https', hostname: '**' }]` for simplicity. For a production deployment, narrow this to the actual hosts.
6. **Hydration of dynamic UI.** `useFavoriteStatus` triggers a second fetch on the home page even when we already SSR'd movies. To keep things simple we accept the double round-trip; the SSR list shows immediately and updates once favorites resolve. If we want zero flicker, pass initial favorites down from the server (requires a `/favorites/status` call during SSR — only feasible when user is authed server-side, which we don't have).
7. **Route group `(public)`.** Used purely for layout grouping; it doesn't affect URLs. If you want auth pages (`/login`, `/register`, `/profile`) to skip the Navbar/Footer, move them outside `(public)` and add their own minimal layout.

## Out of scope

- Backend changes.
- New endpoints, auth scheme changes, passwordless, OAuth, etc.
- Database schema changes.
- Docker / CI changes.
- Internationalization (the app stays pt-BR only).
- Unit/E2E test suite setup.

---

**Plan complete and saved at `/home/projects/pedro/urmovierates/.hermes/plans/2026-06-07_120000-frontend-vite-to-nextjs-migration.md`.**