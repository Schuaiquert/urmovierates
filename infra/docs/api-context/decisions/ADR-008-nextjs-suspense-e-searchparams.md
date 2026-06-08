# ADR-008 — useSearchParams no Next.js 14 App Router: Suspense + string estável

**Status:** Aceito
**Data:** 2026-06-08
**Contexto:** Frontend Next.js 14 (App Router) com `reactStrictMode: true`

### Decisão

Ao usar `useSearchParams()` no App Router, **sempre**:

1. Derivar uma string estável para usar como dependência de hooks: `const paramsKey = searchParams?.toString() ?? ''`. Nunca depender da referência de `searchParams` em `useEffect`/`useCallback`.
2. Envolver o componente que consome `useSearchParams` em `<Suspense>`, com fallback igual ao chrome (skeleton) para evitar layout shift.
3. Para valores cross-tree (ex.: flag de "lista precisa refetch"), propagar via `Context`, nunca via `document.querySelector` + `data-*` attribute.

### Contexto

O Next.js 14 App Router marca o uso de `useSearchParams()` como **CSR bailout**: em build de produção, se uma página puder ser pré-renderizada (e o componente for o único consumer de `useSearchParams` na rota), o Next **falha o build** com:

```
useSearchParams() should be wrapped in a suspense boundary at page "/favorites"
```

Rotas com `export const dynamic = 'force-dynamic'` escapam dessa regra (não são pré-renderizadas). Mas todas as rotas `'use client'` **sem** `dynamic = 'force-dynamic'` (ex.: páginas de auth, profile, favorites) **são** pré-renderizadas como static, e qualquer ancestor que use `useSearchParams` precisa de Suspense.

Em dev mode isso vira warning de hydration; em prod vira erro de build.

Adicionalmente, a referência retornada por `useSearchParams()` **muda a cada render** (mesmo para URLs equivalentes). Isso é "by design" da implementação do hook no `next/navigation` — instancia um novo `ReadonlyURLSearchParams` sempre que o componente pai re-renderiza após `router.replace`. Como dep de `useEffect`/`useCallback`, causa re-execuções espúrias.

Durante a migração Vite→Next.js, isso gerou um loop de refetch visível: `refetch` era `useCallback` com dep `searchParams` → re-render → nova ref de `searchParams` → `refetch` muda de identidade → `useEffect` dispara → `setMovies/setPagination/setLoading` → re-render → loop. Em StrictMode (já ativo no projeto) o efeito rodava 2x e o backend via clusters de GETs idênticos em `/api/movies`.

### Considerações

| Opção | Prós | Contras |
|-------|------|---------|
| Adicionar `dynamic = 'force-dynamic'` em todas as rotas que usam `useSearchParams` | simples | quebra prerender; piora LCP/TTFB; não funciona para layout compartilhado |
| Envolver com `<Suspense>` no layout | preserva prerender; fallback controlável | precisa separar o componente que usa `useSearchParams` |
| Não usar `useSearchParams`, ler `window.location.search` em client | dispensa Suspense | quebra SSR; values disponíveis só após hydration |
| Usar `useSearchParams` e nunca depender da referência (apenas do `toString()`) | evita o loop sem Suspense | não resolve o erro de build de prerender |
| **Combinação: Suspense + `toString()` + `Context` para cross-tree** (escolhida) | cobre build + runtime + arquitetura; resiliente a StrictMode | três regras a seguir |

**Por que `toString()` em vez de `JSON.stringify(searchParams)`:**
- `URLSearchParams` é uma estrutura linear de chave/valor. `toString()` produz uma string canônica (`'a=1&b=2'`) que é estável para URLs equivalentes.
- Strings têm igualdade por valor → comparação direta no deps array do React é confiável.
- Não há `JSON.stringify` overhead nem alocação de objeto intermediário.

**Por que Context e não `data-*` attribute scraping:**
- `document.querySelector('main').getAttribute('data-refresh-key')` lido no render é leitura de DOM no meio do React — fora do ciclo de vida, sem batching, sem re-render automático.
- Funciona em condições estáveis, mas falha silenciosamente em re-renders concorrentes, transitions do React 18, ou quando o layout é desmontado/remontado.
- Context propaga via árvore React, dispara re-render quando o valor muda (com `useMemo`), e é testável.

### Consequências

**Positivas:**
- Build de produção verde para todas as 8 rotas (4 antes falhavam com Suspense error).
- Home `/` agora responde em 14-50ms por navegação, sem GETs duplicados no backend.
- Padrão replicável: futuras páginas com filtros/ordenação na URL seguem o mesmo template (`paramsKey` + `lastKey` ref + Suspense se for prerender).

**Negativas:**
- Toda página que precise de `useSearchParams` precisa ser pensada quanto a "static vs dynamic" desde o design.
- O `<Suspense>` boundary tem custo de fallback visível por ~1 frame na primeira render (skeleton). Aceitável para o chrome de navbar; precisa de cuidado em páginas onde o conteúdo **inteiro** depende de `useSearchParams`.

**Riscos conhecidos:**
- Se alguém adicionar um novo consumer de `useSearchParams` num componente que renderiza direto no layout root e esquecer o Suspense, o build vai falhar em CI. **Mitigação:** o pipeline já roda `npm run build` antes do merge, então a regressão é detectada.
- O `paramsKey` é uma string que cresce conforme filtros (`?search=...&year=...&page=...&active=...`). Não há deduplicação semântica — se o usuário digita `?search=foo` e depois apaga para `?search=`, o `toString()` produz strings diferentes, o que é o comportamento desejado (refetch para cada mudança real). Custo: O(n) de comparação de string a cada render. Aceitável até dezenas de filtros.

### Referências

- [Next.js docs: useSearchParams should be wrapped in a suspense boundary](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout)
- [Next.js docs: prerendering static routes that use cookies/headers/searchParams](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic)
- Implementação: `frontend/src/app/(public)/home-client.tsx`, `frontend/src/components/layout/PublicLayout.tsx`, `frontend/src/contexts/LayoutContext.tsx`
- Sessão: `infra/docs/sessions/frontend-nextjs-loop-fix-2026-06-08.md`
- ADR relacionado: nenhum (este é o primeiro ADR sobre o frontend Next.js)
