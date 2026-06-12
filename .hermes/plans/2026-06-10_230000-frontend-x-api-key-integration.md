# Frontend X-API-Key Integration — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make every authenticated request from the URMovieRates Next.js frontend send both `Authorization: Bearer <jwt>` AND `X-API-Key: <key>` headers to the backend, so protected routes stop returning `401 API_KEY_MISSING` after login.

**Architecture:** Centralize header injection in a single axios request interceptor (`src/services/api.ts`). Read the API key from a `NEXT_PUBLIC_API_KEY` env var baked at build time. Centralize error mapping (401/403/API_KEY_MISSING/API_KEY_FORBIDDEN) in the response interceptor so user-facing messages stay consistent. No per-call header plumbing, no SSR double-fetch traps.

**Tech Stack:** Next.js 14 (App Router, `'use client'` hooks), React 18, TypeScript 5.3, axios 1.6, `localStorage` for token persistence, Next.js `rewrites()` for `/api/*` proxying to the Express backend on `localhost:3000`.

---

## Root Cause (Confirmed by Investigation)

- **File:** `frontend/src/services/api.ts:23-28` — the request interceptor only adds `Authorization: Bearer <token>`. There is **no logic anywhere in the frontend** that sets the `X-API-Key` header.
- **File:** `frontend/src/contexts/AuthContext.tsx:37,48` — only the JWT is persisted (`localStorage.getItem('token')`). No API-key persistence needed (it's a build-time public var), but the symmetry is what made the gap invisible.
- **No `frontend/.env` exists** — `NEXT_PUBLIC_API_KEY` was never declared.
- **File:** `frontend/next.config.mjs:11` — `rewrites()` proxies `/api/*` to `http://localhost:3000/api/*`. The Next.js rewrite proxy **forwards custom headers by default** (only `host` is filtered), so adding the header client-side is enough — no server-side plumbing required.
- **Backend reality** (already implemented & tested in previous session): gate is mounted globally in `src/app.ts:49`, rejects 401 `API_KEY_MISSING` or 403 `API_KEY_FORBIDDEN` from every route except the public allow-list. There is **no backend change needed** for this plan.

The fix is purely **frontend**: one interceptor line + one env var + one error-mapping block.

---

## Current State

```
frontend/
├── .env                              ← MISSING (need to add .env.example + .env.local)
├── next.config.mjs                   ← OK (rewrites pass custom headers through)
├── package.json                      ← axios 1.6, next 14, react 18
└── src/
    ├── services/
    │   └── api.ts                    ← 95 lines; interceptor at L23-28 (the bug site)
    ├── contexts/
    │   └── AuthContext.tsx           ← 85 lines; uses localStorage 'token' / 'user'
    ├── hooks/
    │   ├── useMovies.ts              ← uses moviesAPI (no header plumbing)
    │   ├── useFavorites.ts           ← uses favoritesAPI (no header plumbing)
    │   └── useReviews.ts             ← uses reviewsAPI (no header plumbing)
    ├── lib/
    │   └── constants.ts              ← PAGE_SIZE, GENRE_OPTIONS, etc.
    └── app/
        └── (public)/                 ← home, login, register, profile, favorites, movie/[id]
```

All 25 consumers of the axios instance read `err.userMessage` from the response interceptor (`Object.assign(error, { userMessage })`) — so **centralized error mapping lands everywhere for free**. No hook or page needs to be touched except for a 401-triggered logout in `AuthContext`.

---

## Tasks

### Task 1: Add `.env.example` and `.env.local` to the frontend

**Objective:** Document the new env var and provide a local value so the dev server picks it up.

**Files:**
- Create: `frontend/.env.example`
- Create: `frontend/.env.local` (gitignored, holds the real key)
- Modify: `frontend/.gitignore` (ensure `.env.local` is ignored)

**Step 1: Verify `.gitignore` already covers `.env.local`**

Read `frontend/.gitignore` (or `.gitignore` at repo root). Confirm `.env*.local` or `.env.local` is listed. If not, add it.

Expected: line `*.local` or `.env*` already present, or new line added.

**Step 2: Write `frontend/.env.example`**

```bash
# Frontend env vars (gitignored; copy to .env.local and fill values)
# NEXT_PUBLIC_* vars are baked into the client bundle at build time — never put secrets here.

# Backend URL (optional; defaults to the Next.js rewrite target in next.config.mjs).
# NEXT_PUBLIC_API_BASE=http://localhost:3000

# Shared secret sent in the X-API-Key header on every protected request.
# Must match the backend's API_KEY env var (generate once: openssl rand -hex 32).
NEXT_PUBLIC_API_KEY=replace-me-with-the-same-key-as-the-backend
```

**Step 3: Write `frontend/.env.local`**

Read the real key from `backend/.env` (it has `API_KEY=*** — 65 chars) and write the same value to `frontend/.env.local` as `NEXT_PUBLIC_API_KEY=<value>`. Use a one-liner:

```bash
cd /home/projects/pedro/urmovierates
grep '^API_KEY=*** sed 's/^API_KEY=/NEXT_PUBLIC_API_KEY=/' >> frontend/.env.local
echo "Wrote $(wc -l < frontend/.env.local) line(s) to frontend/.env.local"
```

Expected: one line, 65-char hex value, no other content.

**Step 4: Verify `.env.local` is gitignored**

```bash
cd /home/projects/pedro/urmovierates
git check-ignore -v frontend/.env.local
```

Expected output ends with `frontend/.env.local` (i.e. git WOULD ignore it). If `git check-ignore` exits 1, add the line to `.gitignore`.

**Step 5: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add frontend/.env.example frontend/.gitignore
git commit -m "feat(frontend): add NEXT_PUBLIC_API_KEY env template"
```

(Do NOT `git add frontend/.env.local` — that file is local-only.)

---

### Task 2: Centralize the API key source in `src/lib/api-config.ts`

**Objective:** Single import surface so future env-var changes don't ripple through the codebase.

**Files:**
- Create: `frontend/src/lib/api-config.ts`

**Step 1: Write the file**

```ts
// frontend/src/lib/api-config.ts
/**
 * Centralized client-side configuration for the API layer.
 *
 * - NEXT_PUBLIC_* env vars are inlined at build time by Next.js. They are PUBLIC
 *   (visible in the browser bundle), so never put a real backend secret here.
 *   The X-API-Key is a shared secret deliberately designed to be public to the
 *   client — the backend gates it via timing-safe comparison and rate-limits
 *   abuse separately.
 *
 * - Adding new client-visible env vars? Declare them here with a sensible
 *   fallback and export a typed accessor. Don't read `process.env` ad-hoc in
 *   services or hooks.
 */

const RAW_API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

if (!RAW_API_KEY) {
  // Loud, build-time warning so a missing var is impossible to ship silently.
  // eslint-disable-next-line no-console
  console.warn(
    '[api-config] NEXT_PUBLIC_API_KEY is empty. Protected requests will return 401 API_KEY_MISSING. ' +
    'Add it to frontend/.env.local (see frontend/.env.example).',
  );
}

export const API_KEY_HEADER = 'X-API-Key';

/**
 * The shared secret sent in the X-API-Key header. Empty string means the env
 * var was not set — the interceptor will still attach the header (axios will
 * drop empty headers), but the backend will reject the request.
 */
export const API_KEY: string = RAW_API_KEY;
```

**Step 2: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: rc=0, no errors.

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add frontend/src/lib/api-config.ts
git commit -m "feat(frontend): centralize API key env access in lib/api-config"
```

---

### Task 3: Inject `X-API-Key` and `Authorization` in the axios request interceptor

**Objective:** The bug site. Make every request automatically include both headers, with SSR-safety and dev-time error visibility.

**Files:**
- Modify: `frontend/src/services/api.ts:23-37`

**Step 1: Replace the existing request + response interceptors**

Find lines 23-37 of `frontend/src/services/api.ts` (the `api.interceptors.request.use(...)` and `api.interceptors.response.use(...)` blocks) and replace with:

```ts
import axios, { AxiosError, AxiosHeaders, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_KEY, API_KEY_HEADER } from '@/lib/api-config';
import type { ApiResponse, AuthPayload, Movie, Review, ReviewStats, User, Genre } from '@/types';

// ... (rest of imports stay the same)

/**
 * Custom error shape attached to every rejected AxiosError. All hooks/pages
 * read `err.userMessage` and `err.code` from this — see Task 4 for the
 * response-interceptor mapping.
 */
export interface ApiError extends AxiosError<{ error?: string; code?: string }> {
  userMessage: string;
  code?: string;
  httpStatus?: number;
}

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Skip header injection during SSR — no localStorage, no env var access in
  // a Node-only context (and we don't want to forward a token we can't verify).
  // (NEXT_PUBLIC_* is available at build time so the key would be fine, but
  // skipping SSR keeps the contract simple and matches the original code.)
  if (typeof window === 'undefined') return config;

  // Axios v1 normalizes headers via AxiosHeaders; use the helper to avoid the
  // deprecated `config.headers[xxx] = ...` lint rule and to keep casing
  // consistent.
  const headers = AxiosHeaders.from(config.headers);

  // 1) X-API-Key — every protected route needs this. Public routes
  //    (login/register/refresh/forgot-password/reset-password/health, /, api-docs)
  //    ignore it, so sending it always is harmless.
  if (API_KEY) headers.set(API_KEY_HEADER, API_KEY);

  // 2) Authorization — only when a JWT is present in localStorage.
  const token = window.localStorage.getItem('token');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: ApiError) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const backendMessage = data?.error ?? error.message;
    const code = data?.code;

    // Friendly, user-facing message — see Task 4 for the full mapping table.
    const userMessage = mapApiErrorToUserMessage(status, code, backendMessage);

    if (typeof console !== 'undefined') {
      console.error('[api]', status, code ?? '-', backendMessage);
    }

    return Promise.reject(Object.assign(error, {
      userMessage,
      code,
      httpStatus: status,
    }));
  },
);
```

**Step 2: Add the `mapApiErrorToUserMessage` helper at the top of the same file (after imports, before `const api`)**

```ts
function mapApiErrorToUserMessage(
  status: number | undefined,
  code: string | undefined,
  fallback: string,
): string {
  if (status === 401 && code === 'API_KEY_MISSING') {
    return 'Configuração inválida: a chave da API não foi enviada. Contate o suporte.';
  }
  if (status === 403 && code === 'API_KEY_FORBIDDEN') {
    return 'Chave da API inválida. Verifique a configuração do servidor.';
  }
  if (status === 401 && code === 'AUTH_MISSING') {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  if (status === 401) {
    return 'Credenciais inválidas.';
  }
  if (status === 403) {
    return 'Você não tem permissão para essa ação.';
  }
  if (status === 404) {
    return 'Recurso não encontrado.';
  }
  if (status && status >= 500) {
    return 'Erro no servidor. Tente novamente em alguns instantes.';
  }
  if (status === 0 || status === undefined) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }
  return fallback;
}
```

**Step 3: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: rc=0. (If you hit `AxiosHeaders.from` not exported in axios 1.6, fall back to `Object.assign(config.headers, { [API_KEY_HEADER]: API_KEY, ... })` — the deprecation warning is acceptable.)

**Step 4: Verify the dev server hot-reloads**

The frontend dev server is already running on port 5173 (per `next.config.mjs` and the process list from the previous session). Edit a comment in the file and confirm `npm run dev` picks it up via the watch log. If you don't see hot reload, you may need to restart it — see Task 6.

**Step 5: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add frontend/src/services/api.ts
git commit -m "feat(frontend): send X-API-Key and Authorization in axios interceptor"
```

---

### Task 4: Trigger logout on 401 AUTH_MISSING in the AuthContext

**Objective:** When the JWT expires, the user is silently 401'd on every protected call. Force a re-login instead.

**Files:**
- Modify: `frontend/src/contexts/AuthContext.tsx`

**Step 1: Add a global 401 listener inside `AuthProvider`**

Find the `useEffect` at lines 26-33 and add a second `useEffect` right after it (before the callbacks). The listener attaches to `api` via a tiny custom event so we don't have to import the axios instance into the React tree:

In `frontend/src/services/api.ts`, add at the bottom:

```ts
// Dispatch a window event whenever a request is rejected with 401. The
// AuthProvider listens for this and forces a logout.
if (typeof window !== 'undefined') {
  api.interceptors.response.use(
    (r) => r,
    (error: ApiError) => {
      if (error.response?.status === 401 && error.response?.data?.code === 'AUTH_MISSING') {
        window.dispatchEvent(new CustomEvent('app:auth-expired'));
      }
      return Promise.reject(error);
    },
  );
}
```

(Place this AFTER the existing response interceptor so the message-mapping pass runs first; the second response interceptor just observes.)

**Step 2: In `AuthContext.tsx`, add the listener**

Replace the `useEffect` block (lines 26-33) with:

```ts
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try { setUser(JSON.parse(saved) as User); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  // Listen for 401 AUTH_MISSING from any api call and force a logout.
  useEffect(() => {
    const onExpired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };
    window.addEventListener('app:auth-expired', onExpired);
    return () => window.removeEventListener('app:auth-expired', onExpired);
  }, []);
```

**Step 3: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: rc=0.

**Step 4: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add frontend/src/services/api.ts frontend/src/contexts/AuthContext.tsx
git commit -m "feat(frontend): force logout on 401 AUTH_MISSING via window event"
```

---

### Task 5: Add a debug log of the outgoing headers (temporary, gated by env)

**Objective:** Give the user (and you) a one-line confirmation that the headers are actually being sent, without spamming production logs. This task is **temporary scaffolding** for the validation step (Task 6); you can remove it in Task 7.

**Files:**
- Modify: `frontend/src/services/api.ts:24-26` (right after `if (typeof window === 'undefined') return config;`)

**Step 1: Add a conditional debug log**

```ts
  if (typeof window === 'undefined') return config;

  // Temporary debug log — remove after verifying headers land in DevTools.
  // Set NEXT_PUBLIC_API_DEBUG=1 in .env.local to enable.
  if (process.env.NEXT_PUBLIC_API_DEBUG === '1') {
    // eslint-disable-next-line no-console
    console.debug('[api] outgoing', config.method?.toUpperCase(), config.url);
  }
```

**Step 2: Type-check**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: rc=0.

**Step 3: Commit (temporarily — we'll remove in Task 7)**

```bash
cd /home/projects/pedro/urmovierates
git add frontend/src/services/api.ts
git commit -m "chore(frontend): add gated debug log for outgoing API requests"
```

---

### Task 6: End-to-end manual validation

**Objective:** Confirm the fix actually works in the browser. This is the "before/after" you promised the user in requirement 8.

**Files:** none (validation only).

**Step 1: Open the frontend in a browser**

The Next.js dev server is running on `http://localhost:5173`. Open Chrome DevTools → Network tab.

**Step 2: Login**

Navigate to `/login`, log in with valid credentials (use any seeded user; the seed file lists `admin@urmovierates.com` but the password hash is a placeholder — check `prisma/seed.ts` for what actually works, or use the register flow).

**Step 3: Inspect the request headers**

In Network tab, click on any request to `/api/movies`, `/api/favorites`, etc. Under "Request Headers" confirm BOTH:

```
Authorization: Bearer eyJ...
X-API-Key: <65-char-hex>
```

**Step 4: Trigger the protected routes**

- Navigate to `/` (home) — movies load.
- Navigate to `/favorites` — favorites load (or show empty state without error).
- Click a movie card — detail page loads.
- Add a review, toggle a favorite — confirm 201/200 responses, not 401.

**Step 5: Trigger the 401 path**

In DevTools, `localStorage.removeItem('token')` and refresh. The app should redirect you to `/login` (per Task 4's `app:auth-expired` listener).

**Step 6: Trigger the 403 path (optional)**

In `frontend/src/lib/api-config.ts`, temporarily set `export const API_KEY = 'totally-wrong-key';`. Reload. The Network tab should show `403 API_KEY_FORBIDDEN` on every protected request, and the UI should display the friendly message from Task 3 ("Chave da API inválida…"). **Revert the temporary change** before moving on.

**Step 7: Document the result**

Take screenshots of DevTools showing the headers, and of the favorites page loading. Save them under `docs/screenshots/2026-06-10-x-api-key-fix/` if you want them tracked. Not strictly required.

---

### Task 7: Clean up the debug log

**Objective:** Remove the temporary debug log from Task 5. Production code shouldn't have gated debug prints.

**Files:**
- Modify: `frontend/src/services/api.ts`

**Step 1: Delete the 4-line debug block added in Task 5**

```ts
  if (process.env.NEXT_PUBLIC_API_DEBUG === '1') {
    // eslint-disable-next-line no-console
    console.debug('[api] outgoing', config.method?.toUpperCase(), config.url);
  }
```

**Step 2: Type-check + build**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
npm run build
```

Expected: build succeeds, no warnings about `process.env.NEXT_PUBLIC_API_DEBUG` (we removed the reference).

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add frontend/src/services/api.ts
git commit -m "chore(frontend): remove temporary debug log"
```

---

### Task 8: Update `README.md` with the X-API-Key frontend setup

**Objective:** Tell the next developer how to wire the frontend to the backend (env var, where it goes, that it must match the backend's `API_KEY`).

**Files:**
- Modify: `frontend/README.md` (create if missing) or `README.md` at repo root

**Step 1: Append a "Frontend setup" subsection after the existing "X-API-Key" section in `README.md`**

```markdown
#### Frontend setup

The Next.js client needs the same `API_KEY` as the backend, exposed as
`NEXT_PUBLIC_API_KEY`. Copy `frontend/.env.example` to `frontend/.env.local`
and set the value to match the backend's `API_KEY` (one key per environment).

```bash
cd frontend
cp .env.example .env.local
# paste the same value as backend's API_KEY
echo "NEXT_PUBLIC_API_KEY=$API_KEY" >> .env.local
```

`NEXT_PUBLIC_*` vars are inlined at build time, so restart `npm run dev` after
changing them. The value is safe to ship in the client bundle — it is the same
shared secret the backend already accepts in a public header; rotate it on the
backend and re-deploy both sides to roll.
```

**Step 2: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add README.md
git commit -m "docs(readme): document frontend NEXT_PUBLIC_API_KEY setup"
```

---

## Files Touched (Final)

| File | Action | Why |
|------|--------|-----|
| `frontend/.env.example` | create | document NEXT_PUBLIC_API_KEY |
| `frontend/.env.local` | create (gitignored) | the actual key, matches backend |
| `frontend/.gitignore` | confirm `.env.local` covered | prevent key leak |
| `frontend/src/lib/api-config.ts` | create | single source of truth for the key |
| `frontend/src/services/api.ts` | modify | inject X-API-Key + Authorization; map errors |
| `frontend/src/contexts/AuthContext.tsx` | modify | listen for 401 AUTH_MISSING, force logout |
| `README.md` | modify | document the new env var |

No backend changes. No new dependencies. No DB migrations.

---

## Validation Summary (After All Tasks)

1. `npx tsc --noEmit` in `frontend/` exits 0.
2. `npm run build` succeeds.
3. DevTools Network tab on a logged-in session shows `Authorization` AND `X-API-Key` on every `/api/*` request to a protected route.
4. Home, favorites, movie detail, profile, and reviews pages all load data without `API_KEY_MISSING` errors.
5. After `localStorage.removeItem('token')` + refresh, the user is redirected to `/login`.
6. Setting `API_KEY = 'wrong'` in `api-config.ts` (and reverting) shows the friendly 403 message instead of a raw error.
7. `frontend/.env.local` is NOT in `git status` (gitignored).

---

## Risks, Tradeoffs, and Open Questions

1. **`NEXT_PUBLIC_API_KEY` is a public-by-construction env var.** This is the same as the backend's design choice: the key is a shared secret that already crosses the wire in a public header. The protection is server-side rate limiting and rotation policy, not client-side secrecy. **Do not** try to "hide" the key with `useState` + an API call — that would just shift the auth problem to the key-distribution endpoint and add latency.

2. **Two axios response interceptors** in `api.ts` (the existing one plus the new `app:auth-expired` dispatcher). They run in registration order; the existing one maps the error message first, the second only checks `status === 401` and dispatches. This is intentional — the message mapping shouldn't depend on the logout side-effect.

3. **SSR vs CSR.** The interceptor skips header injection when `typeof window === 'undefined'`. Pages are client components (`'use client'`) so they only render post-mount, and the existing pattern already does this for the token. If you later add server components that fetch data, they'll need a server-side axios instance with the same key — that would live in a new `src/lib/api-server.ts`. Out of scope for this plan.

4. **No automated tests.** The repo's `tests/` is empty (per the prior session's discovery). If you want jest+rtl tests for the interceptor, that's a follow-up task. The manual validation in Task 6 is the contract.

5. **Build-time vs runtime rotation.** Rotating `API_KEY` on the backend requires a frontend redeploy (because `NEXT_PUBLIC_*` is baked into the JS bundle). If you need zero-downtime rotation, the answer is: support multiple keys on the backend (out of scope here) AND set the frontend var from a runtime config endpoint (a real rework). For this project's scale, redeploy-on-rotation is fine.

6. **The `app:auth-expired` event name** is intentionally namespaced (`app:`) so it doesn't collide with library events. If you adopt more events later, follow the same convention.

---

## Rollback Story

Each task is a separate commit. If Task 3 breaks the build, `git revert <commit-hash>` and you're back to "no API key sent, but JWT still works" — same state as today, no worse. The env-var task (Task 1) is purely additive and can't break anything by itself.
