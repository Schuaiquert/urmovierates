# Sessão: Loop de refetch no home-client + Suspense no PublicLayout — 2026-06-08

**Data:** 2026-06-08
**Sessão:** continuação da migração Vite → Next.js 14 (App Router)
**Contexto da entrada:** processo da sessão anterior perdeu o contexto por timeout durante o diagnóstico do loop. Esta sessão retomou do zero o estado em disco, sem reiniciar a migração.

---

## Resumo

Sintoma: a página `/` (Home) entrava em loop de re-render no client, disparando GETs repetidos em `/api/movies` no backend e flicker visível no grid.

Causa raiz: `home-client.tsx` lia o `refreshKey` via `document.querySelector('main').getAttribute('data-refresh-key')` (DOM scraping) e dependia de um `useCallback(refetch, [searchParams])` cujo `searchParams` muda de referência a cada render no `next/navigation` App Router.

Fix: novo `LayoutContext` expondo `refreshKey` como valor React real; `home-client` dedupe via `lastKey` ref e usa `paramsKey = searchParams?.toString()` (string estável) como dep do `useEffect`. Bônus: Suspense no `PublicLayout` destrava `next build` para 4 rotas que usavam `useSearchParams` sem boundary.

**Commits:** `3f538fb fix(frontend): kill home-client refetch loop, add Suspense to PublicLayout`

---

## Sintomas observados

Antes do fix:

1. Grid da home piscava / re-renderizava várias vezes após qualquer interação.
2. Backend log mostrava clusters de GETs idênticos em `/api/movies?page=1&limit=12` dentro da mesma janela de 1s.
3. Em dev mode, com `reactStrictMode: true` (já ativo no `next.config.mjs`), o loop era amplificado (efeitos disparam 2x).

---

## Diagnóstico passo a passo

### 1. Verificação do estado real do projeto

```
git log --oneline -5
  3f538fb (HEAD) — já comitado nesta sessão
  d830b2d fix(frontend): move all routes under (public) so PublicLayout chrome renders
  4891c89 fix(frontend): point rewrite at backend port 3000 + use absolute URL for SSR fetch
  ...
```

Estado: 18 commits ahead de `origin/main`, working tree com 3 modificações pendentes (`export const dynamic = 'force-dynamic'` em `page.tsx` e `movie/[id]/page.tsx`, e deleção de `loading.tsx`). Backend parado.

### 2. Subir o stack

```bash
cd infra/docker/dev
docker-compose up -d    # legacy v1; `docker compose` não funcionou no host
```

Containers: `dev_app_1` (3000), `dev_postgres_1` (5432), `dev_redis_1` (6379). Backend responde em ~1s.

```bash
cd frontend
npm run dev > /tmp/next-dev.log 2>&1
# ready em 1421ms, compila / em 1344ms
```

### 3. Análise do `home-client.tsx`

```tsx
// ANTES (problemático)
const refreshKey = typeof document !== 'undefined'
  ? document.querySelector('main')?.getAttribute('data-refresh-key') ?? '0'
  : '0';

const refetch = useCallback(async () => {
  // ... usa searchParams.get(...)
}, [searchParams]);

useEffect(() => { refetch(); }, [refetch, refreshKey]);
```

Três problemas combinados:

1. **Leitura de DOM no meio do render.** `document.querySelector('main')` é executado em todo render do componente. Como `PublicLayout` define `data-refresh-key={refreshKey}` no `<main>`, o `refreshKey` lido fica sincronizado **no momento do render**, mas só é atualizado quando o `setRefreshKey(k+1)` do layout dispara. Em condições normais isso fica `"0"` indefinidamente, e o `useEffect` deveria disparar só uma vez. Não era o caso.

2. **`searchParams` muda de referência a cada render.** `useSearchParams()` do `next/navigation` App Router retorna um objeto novo (mesmo para URLs equivalentes) após cada render que envolva qualquer navegação ou re-render do `PublicLayout`. Isso faz com que o `useCallback(refetch, [searchParams])` gere uma função nova a cada render.

3. **`useEffect(..., [refetch, refreshKey])` dispara em loop.** `refetch` muda de identidade → effect dispara → `setLoading(true)`, `setMovies(data)`, `setPagination(...)`, `setLoading(false)` → React agrupa os setStates num re-render → nesse re-render, `searchParams` é uma ref nova → `refetch` muda de novo → loop. Em StrictMode (dev) o effect roda 2x, amplificando.

A "fix" errada comum seria colocar `useRef` ou `useState` para evitar o `refetch` em `deps`, mas isso esconde o problema real: `useSearchParams()` não é uma dep útil para `useCallback` no App Router.

### 4. Solução escolhida

**Padrão:** `useContext` para o `refreshKey` + `searchParams?.toString()` como dep estável do `useEffect` + `useRef` dedupe.

```tsx
// DEPOIS
const { refreshKey } = useLayoutContext();

const lastKey = useRef<string>('');

const refetch = useCallback(async (paramsString: string) => {
  // ... usa URLSearchParams(paramsString).get(...)
}, []);

const paramsKey = searchParams?.toString() ?? '';

useEffect(() => {
  const key = `${paramsKey}|${refreshKey}`;
  if (lastKey.current === key) return;       // dedupe: só refetcha se mudou
  lastKey.current = key;
  refetch(paramsKey);
}, [paramsKey, refreshKey, refetch]);
```

**Por que `toString()` resolve:**
- `URLSearchParams` é uma estrutura de chave/valor. Para URLs equivalentes, `toString()` produz a **mesma string** canônica (`'a=1&b=2'`).
- Strings têm comparação por valor no React deps array — não há mais "mudança de ref".
- Mantém a reatividade: se o usuário muda `?page=2`, `toString()` vira `'page=2'`, dispara o effect uma vez.

**Por que `lastKey` ref:**
- Garante que mesmo com StrictMode (2 invocações) o refetch não dispara duplicado.
- Funciona como uma "fence" sequencial: se React decidir re-executar o effect em dev por qualquer motivo, o segundo call é no-op.

### 5. Bônus: `useSearchParams` Suspense

`PublicLayout` usa `useSearchParams()` para sincronizar o input de busca com a URL. No App Router, isso obriga a boundary de Suspense ou o build de produção quebra em qualquer página que renderize esse layout e seja pré-renderizada estaticamente.

```
Error occurred prerendering page "/favorites".
useSearchParams() should be wrapped in a suspense boundary
```

**Fix:** extrair o chrome que usa `useSearchParams` num componente interno (`PublicLayoutChrome`) e envolvê-lo com `<Suspense fallback={<navbar skeleton/>}>`.

```tsx
export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-dark-200">
      <Suspense fallback={<div className="h-16 bg-dark-100/80 border-b border-white/5" />}>
        <PublicLayoutChrome>{children}</PublicLayoutChrome>
      </Suspense>
    </div>
  );
}
```

Páginas com `dynamic = 'force-dynamic'` (home, movie detail) não exigem Suspense porque não são pré-renderizadas. Mas as 4 client-only (`/favorites /login /register /profile`) **são** pré-renderizadas como static (Next vê `'use client'` + sem fetch no server, gera HTML estático), e por isso precisam de Suspense no ancestor que use `useSearchParams`.

---

## Mudanças aplicadas

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/contexts/LayoutContext.tsx` (novo) | Context com `refreshKey: number`, `useLayoutContext()` hook |
| `frontend/src/components/layout/PublicLayout.tsx` | `useMemo` em `layoutValue`, `<LayoutContext.Provider>`, refatoração em `PublicLayout` + `PublicLayoutChrome` com Suspense |
| `frontend/src/app/(public)/home-client.tsx` | `useLayoutContext()`, `lastKey` ref, `paramsKey` estável, `refetch(paramsString)`, `onRetry={() => refetch(paramsKey)}` |
| `frontend/src/components/movie/MovieGrid.tsx` | `idsKey = ids.join(',')` extraído para var local (limpa warning exhaustive-deps) |
| `frontend/.gitignore` | adicionado `*.tsbuildinfo`; `tsconfig.tsbuildinfo` removido do tracking |
| `frontend/src/app/(public)/page.tsx` | `export const dynamic = 'force-dynamic'` (já estava pendente) |
| `frontend/src/app/(public)/movie/[id]/page.tsx` | `export const dynamic = 'force-dynamic'` (já estava pendente) |
| `frontend/src/app/loading.tsx` | deletado (duplicado, conteúdo redundante com `(public)/movie/[id]/loading.tsx`) |

---

## Verificações executadas

| Verificação | Resultado |
|-------------|-----------|
| `npm run type-check` | ✓ zero erros |
| `npm run lint` | ✓ "No ESLint warnings or errors" |
| `npm run build` | ✓ 8/8 páginas, zero warnings |
| `GET /` | 200 (39ms) |
| `GET /?page=2` | 200 (24ms) — renderiza 12 filmes da página 2 (Star Wars, Fight Club, etc) |
| `GET /?search=matrix` | 200 (17ms) — renderiza só Matrix |
| `GET /?page=2&search=lord` | 200 (13ms) — filtro combinado |
| `GET /?year=1994` | 200 (18ms) |
| `GET /?active=true` | 200 (18ms) |
| `GET /?genre=A%C3%A7%C3%A3o` (encoded) | 200 (27ms) |
| `GET /favorites /login /register /profile` | 200 — agora prerenderizados como Static (○) |
| `GET /movie/inception` | 200 (35ms) — Dynamic (ƒ) |
| `GET /movie/f147c4cc-1b1e-4b37-89aa-be7e89cdbb5e` (UUID) | 200 (28ms) |
| Bundle servido (`/_next/static/chunks/app/(public)/page.js`) | contém `useLayoutContext`, `lastKey`, `Suspense`, `PublicLayoutChrome`; **não** contém `document.querySelector` + `data-refresh` |
| Log do dev server | uma única entrada por navegação, sem refetch duplicado |

---

## Estado final

- **Commit:** `3f538fb` no `main`, 19 commits ahead de `origin/main`.
- **Containers backend:** `dev_app_1` (3000), `dev_postgres_1` (5432), `dev_redis_1` (6379) — todos UP via `docker-compose -f infra/docker/dev/docker-compose.yml up -d`.
- **Frontend dev:** não está rodando. Para subir: `cd frontend && npm run dev` (porta 5173).
- **Push para origin:** pendente — exige credenciais GitHub que não estão configuradas no shell (erro: `could not read Username for 'https://github.com'`). Mesma situação dos 18 commits anteriores.
- **Próxima iteração:** validar comportamento interativo fino no browser real (animações, hover, focus, modal de adicionar filme do admin, fluxo de review) — headless Chromium no host não roda por falta de `libnspr4`/`libnss3` e o ambiente não tem `sudo` para instalar.

---

## Lições para futuras sessões

1. **Nunca usar `document.querySelector` no meio do render** para passar valores de pai para filho em React. É padrão frágil, dessincronizado, e não se beneficia do sistema reativo. Use `Context`, props drilling, ou estado global.

2. **`useSearchParams()` do `next/navigation` App Router**:
   - É instável como dep de `useEffect`/`useCallback` (muda de ref a cada render).
   - Sempre derive uma **string estável** (`toString()`) para usar em deps.
   - Se o componente que usa `useSearchParams` pode ser pré-renderizado (rota static, `'use client'` sem `dynamic = 'force-dynamic'`), envolva-o com `<Suspense>`.

3. **`<Suspense>` boundary no layout root** é o lugar natural para o `useSearchParams` que serve o chrome (navbar com search box, breadcrumb, etc). Fallback = skeleton do próprio chrome para evitar layout shift.

4. **`next/navigation` retorna ref nova de `searchParams` mesmo quando o URL não muda**, quando há qualquer re-render do componente que chamou `useRouter`/`usePathname`. Isso é "by design" da implementação do hook (instancia novo `ReadonlyURLSearchParams` em `useMemo([], [])` mas que recria após `router.replace`). Doc oficial não destaca, mas é observável.

5. **Dev server em background**: usar `npm run dev > /tmp/next-dev.log 2>&1` (redirecionar stdout/stderr) garante que os logs são capturáveis via `process(action='log')`. Sem o redirect, o `process` retorna 0 linhas e fica invisível.

6. **HMR + `next build` são diferentes**: erros que só aparecem no `npm run build` (Suspense boundary, prerender) não bloqueiam `npm run dev`. Sempre rodar `npm run build` antes de commitar mudanças estruturais no App Router.
