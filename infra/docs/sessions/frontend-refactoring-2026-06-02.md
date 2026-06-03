# Sessão de Refatoração Frontend — 2026-06-02

## Visão Geral

Refatoração completa da barra de filtros/pesquisa e da navbar da página de filmes. A sessão começou com um bug de sobreposição no toolbar e evoluiu para uma reestruturação arquitetural: estado do modal movido para o `Layout`, navbar de 2 níveis, dropdown de filtros com aplicação explícita, substituição de todos os emojis por ícones `lucide-react`, e correções de bugs no backend (filtro de busca inexistente).

**Stack:** React 18, Vite 5, TailwindCSS 3.3, react-router-dom 6, lucide-react 1.17.

---

## Arquivos Modificados

### Frontend
- `frontend/src/components/layout/Layout.jsx` — owner do estado de busca + modal AdicionarFilme
- `frontend/src/components/layout/Navbar.jsx` — extraído de Layout; top bar com search + nav
- `frontend/src/components/movie/FilterBar.jsx` — convertido de sticky bar em dropdown
- `frontend/src/components/movie/MovieCard.jsx` — capitalize nos gêneros exibidos
- `frontend/src/components/movie/AddMovieModal.jsx` — click-outside + Cancelar com cor primária
- `frontend/src/components/movie/FavoriteButton.jsx` — ícone `Heart` + `Loader2`
- `frontend/src/components/movie/MovieToolbar.jsx` — **REMOVIDO** (substituído por FilterBar)
- `frontend/src/components/common/index.jsx` — `EmptyState`/`ErrorState`/`Rating` com lucide
- `frontend/src/pages/HomePage.jsx` — consome `refreshKey` do outlet context
- `frontend/src/pages/FavoritesPage.jsx` — `Lock` e `Heart` ícones
- `frontend/src/pages/ProfilePage.jsx` — `LogOut`, `Trash2`, `Pencil`
- `frontend/src/pages/MoviePage.jsx` — `Film`, `Pencil`, `PlayCircle`, `CheckCircle2`, `MessageSquare`, `ArrowLeft`
- `frontend/src/components/movie/index.js` — barrel: `MovieToolbar` → `FilterBar`
- `frontend/package.json` — adicionado `lucide-react`

### Backend
- `src/services/movieService.ts` — adicionado `search` ao `where` (case-insensitive em title/synopsis)
- `src/controllers/movieController.ts` — propaga `?search=` para o service
- `src/services/movieService.ts` (findAll) — `orderBy: { createdAt: 'asc' }` (era `desc`)
- `src/services/movieService.ts` (findAll) — filtro de gênero com `mode: 'insensitive'`

---

## Cronologia das Mudanças

### 1. Bug inicial: sobreposição no toolbar
**Problema:** campo de busca invadia espaço do select de Gênero. Search ficava maior que os demais, sem grid/flex organizado.

**Diagnóstico:** CSS Grid aplica `min-width: auto` por padrão nos filhos. O `<input>` da busca tem `placeholder="Buscar filmes..."` cujo min-content (~280px) excedia a célula `1fr` do grid → overflow.

**Solução:** adicionar `min-w-0` aos grid items e aos inputs. Grid passou de `flex-wrap` (quebra caótica) para grid estruturado com proporções definidas.

### 2. Reorganização estrutural: navbar 2 níveis
**Decisão:** criar `<Navbar />` (top bar com logo + search + nav) e `<FilterBar />` (filtros contextuais abaixo).

**Arquitetura final:**
```
┌────────────────────────────────────────────────────────┐
│ Navbar (sticky top-0)                                 │
│ [🎬] [🔍 search flex-1] [Início][Favoritos][👤][⏻]   │
├────────────────────────────────────────────────────────┤
│ FilterBar (sticky top-16) — só na HomePage            │
│ [Filtros ②] [chips] [Limpar]                          │
└────────────────────────────────────────────────────────┘
```

### 3. Estado do modal AdicionarFilmes no Layout
**Motivação:** ao mover o botão "Adicionar filmes" para a navbar (visível em todas as páginas), o modal precisaria abrir de qualquer rota. Solução: estado `showAddModal` no `Layout`, exposto via `<Outlet context={...} />`.

**Padrão de refresh:** `Layout` mantém `refreshKey` (number). Ao adicionar filme:
```jsx
const handleMovieAdded = () => {
  setRefreshKey(k => k + 1)
  setShowAddModal(false)
}
```
`HomePage` reage:
```jsx
const { refreshKey = 0 } = useOutletContext() || {}
useEffect(() => { fetchMovies() }, [fetchMovies, refreshKey])
```

**Limitação conhecida:** se admin adicionar filme fora da Home, o `refreshKey` é incrementado mas a Home não está montada. Funciona transparentemente porque ao navegar para Home, o `useEffect` inicial busca os filmes (que já incluem o novo).

### 4. Debounce da busca (300ms)
**Motivação:** sem debounce, cada keystroke dispara uma requisição ao backend.

**Implementação em `Layout.jsx`:**
```jsx
const [search, setSearch] = useState(searchParams.get('search') || '')
const [debouncedSearch, setDebouncedSearch] = useState(search)

useEffect(() => {
  if (search === debouncedSearch) return
  const timer = setTimeout(() => setDebouncedSearch(search), 300)
  return () => clearTimeout(timer)
}, [search])
```

**Bypass no Enter:** `handleSearchSubmit` no `onKeyDown` chama `setDebouncedSearch(search)` + `setSearchParams` imediatamente, ignorando o debounce.

### 5. Substituição de emojis por lucide-react
**Todos os emojis do projeto foram trocados por ícones vetoriais.**

| Emoji | lucide-react |
|---|---|
| 🎬 logo/poster fallback | `Clapperboard`, `Film` |
| 🏠 home | `Home` |
| 👤 user | `User` |
| 🚪 logout | `LogOut` |
| 🔑 login | `LogIn` |
| ❤️ favoritos | `Heart` (fill dinâmico) |
| ⏳ loading | `Loader2` animate-spin |
| ⚠️ error | `AlertTriangle` |
| 📝 no reviews | `MessageSquare` |
| 🔐 locked | `Lock` |
| 🗑️ delete | `Trash2` |
| 📅 ano | `Calendar` |
| 🎭 gênero | `Film` |
| ✓ check | `CheckCircle2` / `Check` |
| ★ rating | `Star` (fill dinâmico) |

**EmptyState refatorado:** antes recebia `icon="🎬"` (string), agora `icon={Film}` (componente React). Renderizado dentro de `w-16 h-16 rounded-full bg-dark-100` para consistência visual.

**Mudança na API do EmptyState** (breaking change nos call sites):
```jsx
// Antes
<EmptyState icon="🎬" message="..." />
// Depois
<EmptyState icon={Film} message="..." />
```

### 6. Bug crítico: backend ignorava `?search=`
**Sintoma:** frontend enviava `?search=foo` corretamente, mas o backend retornava **todos** os filmes sem filtrar.

**Causa raiz:**
- `movieController.ts` lia apenas `page, limit, active, year, genre` da query
- `movieService.ts` construía o `where` do Prisma sem `search`

**Correção:**
```ts
// movieService.ts
if (query.search) {
  const term = String(query.search).trim();
  if (term) {
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { synopsis: { contains: term, mode: 'insensitive' } },
    ];
  }
}
```

```ts
// movieController.ts
search: req.query.search as string || undefined,
```

**Lição:** o frontend parecia correto (URL atualizava, requisição era feita) mas o backend silenciosamente ignorava o parâmetro. **Sempre validar contratos de query params entre frontend e backend.**

### 7. Bug de CSS: button com estilos default do navegador
**Sintoma:** botão "Sair" no Navbar tinha fundo cinza claro e borda 3D, completamente diferente dos links "Início"/"Favoritos"/"Usuário".

**Causa raiz:** Tailwind preflight está **desabilitado** neste projeto (`tailwind.config.js:29`: `corePlugins: { preflight: false }`). Sem o reset do Tailwind, o user-agent stylesheet dos browsers aplica defaults aos `<button>`:
- `background-color: buttonface`
- `border: 2px outset buttonborder`

`appearance-none` sozinho **não** reseta background/border — apenas remove o "look nativo" (iOS button style).

**Correção:**
```jsx
<button className={`${navLinkClass(false)} bg-transparent border-0`}>
  Sair
</button>
```

`bg-transparent` reseta o background, `border-0` reseta a border. Aplicado também ao botão "Adicionar filmes" no FilterBar (depois movido para a navbar).

### 8. Reordenação dos botões da navbar
**Ordem final** (da esquerda para a direita no right group):
1. Adicionar filmes (admin only)
2. Início
3. Favoritos
4. Usuário (com primeiro nome)
5. Sair

**Estados de autenticação:**
- **Autenticado:** mostra Adicionar (se admin) + Início + Favoritos + Usuário + Sair
- **Não autenticado:** mostra Início + Favoritos + Entrar (substitui Usuário+Sair)

**Mobile:** textos ocultos (`hidden sm:inline`), só ícones visíveis.

### 9. Modal: Cancelar + click-outside
**Pedidos do usuário:**
1. Botão Cancelar com mesma cor do botão Salvar
2. Click fora do modal = cancelar

**Implementação:**
```jsx
<div onClick={onClose} className="fixed inset-0 bg-black/70 ...">
  <div onClick={(e) => e.stopPropagation()} className="bg-dark-100 ...">
    {/* conteúdo do modal */}
  </div>
</div>
```

Click no backdrop → `onClose`. Click dentro do conteúdo → `stopPropagation` impede bubble, modal não fecha.

**Cancelar estilizado como `variant="primary"`** para ficar idêntico ao Adicionar. Resultado: dois botões primary lado a lado, distinguidos apenas pelo label ("Cancelar" vs "Adicionar").

### 10. Ordem dos filmes: asc vs desc
**Pedido:** filme recém-adicionado deve aparecer **abaixo** dos outros (no final da lista).

**Mudança no backend** (`movieService.ts:27`):
```ts
// Antes
orderBy: { createdAt: 'desc' }
// Depois
orderBy: { createdAt: 'asc' }
```

**Trade-off:** ordem global alterada. Todos os usuários veem filmes antigos primeiro.

**Caveat de paginação:** se houver ≥ 12 filmes, o novo aparece na primeira página (porque `asc` + `limit=12` retorna os 12 mais antigos). Se o admin estiver na página 2+, precisa navegar para página 1.

### 11. FilterBar: sticky bar → dropdown
**Pedido:** transformar o FilterBar (sticky bar com 3 chips sempre visíveis) em um dropdown (botão que abre painel).

**Implementação:**
- Trigger button com label "Filtros", ícone `Filter`, badge com contador de filtros ativos, chevron rotativo
- Painel dropdown com `absolute top-full left-0 mt-2 z-50`
- Click outside fecha (`mousedown` no document, registrado só quando aberto)
- Estado ativo: `bg-primary-500/10 border-primary-500/30 text-primary-300` (mesma linguagem dos nav links)

**Estrutura do painel:**
```
┌─────────────────────────────┐
│ 🎬 GÊNERO                   │
│ [Todos              ▼]    │
│                             │
│ 📅 ANO                      │
│ [Todos              ▼]    │
│                             │
│ ✓ STATUS                    │
│ [Todos              ▼]    │
│ ─────────────────────────── │
│ [✕ Limpar]  [✓ Aplicar]    │
└─────────────────────────────┘
```

### 12. Filtros: botão "Aplicar" explícito
**Pedido:** adicionar botão "Aplicar filtros" no dropdown.

**Mudança de paradigma:** antes, mudar um select aplicava imediatamente. Agora, mudanças ficam em estado local até clicar "Aplicar" (ou "Limpar").

**Implementação:**
- Removido o `useEffect` que sincronizava `year/genre/status` → URL automaticamente
- Adicionado `handleApply` que é o único caminho para commitar mudanças
- Adicionado `handleClear` que limpa **e** aplica em uma ação (atalho)
- `page` é resetada para 1 ao aplicar (evita ficar preso em página sem resultados)

**Comportamento:**
- Mudar select → só estado local
- Click "Aplicar" → URL atualiza → HomePage reage → refetch
- Click "Limpar" → limpa tudo e aplica (URL sem filtros)
- Click fora do dropdown → fecha, mudanças locais preservadas (não aplicadas)

### 13. Unificação de gêneros (case-insensitive)
**Pedido:** "Ação" e "ação" devem ser tratados como o mesmo gênero.

**Correções aplicadas:**

1. **`AddMovieModal.jsx:95-106`** — valores hardcoded em Title Case:
   ```jsx
   <option value="Ação">Ação</option>
   <option value="Animação">Animação</option>
   ...
   ```
   (antes: `value="ação"`, `value="animação"` em lowercase)

2. **`FilterBar.jsx:36-40`** — dedupe por lowercase ao carregar da API:
   ```js
   const seen = new Set()
   const uniqueGenres = (genresRes.data?.data || []).filter((g) => {
     const key = g.name.trim().toLowerCase()
     if (seen.has(key)) return false
     seen.add(key)
     return true
   })
   ```

3. **`movieService.ts:14-18`** — filtro de gênero case-insensitive:
   ```ts
   where.genres = {
     some: {
       genre: { name: { equals: query.genre, mode: 'insensitive' } }
     }
   }
   ```

**Limitação:** não normaliza diacríticos (`acao` vs `Ação` com/sem cedilha). Para normalizar diacríticos, seria necessário `String.normalize('NFD')` no frontend.

### 14. Status "Todos" = todos os filmes
**Problema:** o `HomePage.jsx` tinha:
```jsx
const active = searchParams.get('active') !== 'false' ? true : undefined
```

Quando `active` não estava na URL, era interpretado como `true` (só filmes ativos). Status "Todos" no filtro não setava `active`, então apareciam só os ativos.

**Correção:**
```jsx
const activeParam = searchParams.get('active')
const active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined
```

| Status | URL | `active` enviado à API |
|---|---|---|
| Todos | sem `active` | `undefined` (todos) |
| Ativos | `active=true` | `true` (só ativos) |
| Inativos | `active=false` | `false` (só inativos) |

### 15. Hierarquia visual da Home
**Pedido:** mover o FilterBar para entre "Filmes" e "filmes encontrados".

**Estrutura final:**
```jsx
<h1>Filmes</h1>           {/* sem margin (recebe py-8 do container) */}
<div className="mt-3 mb-4">
  <FilterBar />            {/* mt-3 separa do título, mb-4 da contagem */}
</div>
<p className="mb-6">       {/* mb-6 separa da grid */}
  {totalResults} filmes encontrados
</p>
{/* grid de filmes */}
```

### 16. Title "URMovieRates" aumentado
**Pedido:** aumentar o título mantendo o estilo.

**Mudança:** `text-lg` (18px) → `text-2xl` (24px). Ícone `w-6 h-6` (24px) → `w-7 h-7` (28px). Gradiente preservado.

**Compatibilidade com header `h-16` (64px):** line-height de `text-2xl` é 32px, deixa 16px de padding top/bottom. Sem overflow.

### 17. MovieCard: capitalize nos gêneros
**Pedido:** exibir gêneros em Title Case nos cards.

**Solução minimalista:** adicionar `capitalize` (Tailwind = `text-transform: capitalize`) na tag. CSS-only, zero JS.

```jsx
<span className="text-xs px-2 py-0.5 bg-dark-300 rounded text-gray-400 capitalize">
  {g.name}
</span>
```

`text-transform: capitalize` capitaliza primeira letra de cada palavra. Não altera a string no DOM, só apresentação.

### 18. Footer: link do GitHub
**Pedido:** substituir o texto de copyright "Backend: Node.js + Prisma + PostgreSQL" pelo link do `.gitignore` no GitHub.

**Iteração:**
1. Primeiro: `<a>` com URL completa visível
2. Depois: `<a>` estilizado como botão "GitHub" com ícone oficial do GitHub (SVG fill="currentColor")

**Estado final:** botão discreto no footer direito, com ícone GitHub + label "GitHub". Atributos `target="_blank" rel="noopener noreferrer"` para segurança.

---

## Decisões Arquiteturais Importantes

### 1. Estado do modal no Layout, não na página
**Por que:** o botão "Adicionar filmes" foi movido para a navbar (visível em todas as páginas). O modal precisa abrir de qualquer rota, então o estado precisa estar acima do `<Outlet />`.

**Alternativa considerada:** React Context. Rejeitada por ser overkill para um único modal.

### 2. Outlet Context vs props para compartilhar `search` e `refreshKey`
**Por que:** Layout é pai de todas as rotas via `<Outlet />`. O contexto é a forma idiomática de passar dados do Layout para filhos sem prop drilling.

**Limitação:** `useOutletContext()` retorna `undefined` se o componente for renderizado fora do `<Outlet />` (ex: em testes). Solução: `useOutletContext() || {}` com defaults.

### 3. Refresh via `refreshKey` ao invés de refetch manual
**Por que:** pattern simples baseado em counter. `HomePage` reage à mudança de número via `useEffect`. Sem subscriptions, sem EventBus, sem Context adicional.

**Limitação:** se múltiplas páginas precisassem reagir ao mesmo evento, seria necessário Context ou EventBus. Para um único caso (HomePage), é suficiente.

### 4. `useOutletContext` para `setSearch` no FilterBar
**Por que:** o FilterBar precisa limpar a busca ao clicar "Limpar" (junto com seus próprios filtros). A busca vive no Layout. O FilterBar consome `setSearch` via outlet context.

### 5. CSS `capitalize` em vez de JS para Title Case
**Por que:** performance (zero JS, GPU compositor), manutenção (sem manipulação de string no render), correto para casos comuns.

**Limitação:** não normaliza diacríticos. Para casos com acentos diferentes, precisaria de JS.

### 6. CSS Grid para FilterBar dropdown
**Por que:** o FilterBar interno (dentro do painel) usa grid para organizar os 3 campos de forma consistente. O painel usa `absolute` positioning com `top-full` para abrir abaixo do trigger.

### 7. Debounce apenas na busca da navbar, não nos filtros
**Por que:** a busca é "live" (digitação contínua). Os filtros têm seleção discreta (clicar opção). Aplicar debounce nos filtros adicionaria latência desnecessária.

**Mudança posterior:** com o botão "Aplicar" explícito, o debounce dos filtros foi removido completamente. Mudanças ficam em estado local até "Aplicar".

### 8. Tailwind preflight desabilitado
**Implicação:** o projeto não tem o CSS reset do Tailwind. Isso preserva alguns defaults do navegador que podem ser úteis, mas causa bugs em `<button>` (fundo `buttonface`, borda 3D).

**Workaround:** aplicar `appearance-none bg-transparent border-0` em todos os `<button>` que devem parecer com `<a>` (links).

---

## Lições Aprendidas

### 1. Validação de contratos API
O bug do `?search=` ignorado pelo backend foi descoberto tarde porque o frontend parecia funcionar (URL atualizava, requisição era feita). **Lição:** sempre testar o round-trip completo, incluindo a resposta do backend.

### 2. Preflight do Tailwind
Desabilitar preflight tem consequências que precisam ser tratadas caso a caso. **Lição:** quando preflight está off, documentar os defaults de browser que precisam ser resetados.

### 3. CSS Grid + min-width: auto
Grid items têm `min-width: auto` por padrão, o que pode causar overflow. **Lição:** sempre adicionar `min-w-0` em grid items que recebem conteúdo variável (textos, inputs).

### 4. State lifting
Mover o estado do modal para cima no component tree (Layout) é menos óbvio mas necessário quando o trigger se move para um local global. **Lição:** ao mover um trigger, verificar onde o estado correspondente vive.

### 5. `appearance-none` ≠ reset completo
A propriedade CSS `appearance` apenas remove o "look nativo", não reseta background/border/padding. **Lição:** para reset completo de `<button>`, é preciso `appearance-none + bg-transparent + border-0`.

### 6. URL como source of truth
A URL é a fonte de verdade para filtros/busca. Estado local é só para UX (debounce, edição antes de aplicar). **Lição:** o estado local deve sempre poder ser reconstruído a partir da URL.

### 7. Title Case via CSS
`text-transform: capitalize` resolve 90% dos casos de formatação visual sem JS. **Lição:** preferir soluções CSS para transformações puramente visuais.

### 8. `replace: true` no setSearchParams da busca
```js
setSearchParams(params, { replace: true })
```
Evita que cada keystroke adicione entrada no histórico do browser. **Lição:** para mudanças de estado "ao vivo" (digitação), sempre usar `replace: true`.

---

## TODOs e Melhorias Futuras

1. **Migração de dados:** rodar migration no banco para normalizar gêneros duplicados (e.g., `UPDATE Genre SET name = 'Ação' WHERE LOWER(name) = 'ação' AND name != 'Ação'`). Atualmente o `mode: 'insensitive'` resolve a leitura, mas a duplicação persiste.

2. **Normalização de diacríticos:** adicionar `String.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` no dedupe de gêneros, para tratar `acao` e `Ação` como iguais.

3. **Refresh ao adicionar em página diferente:** se o admin adicionar filme estando na página de Profile (não-Home), o `refreshKey` é incrementado mas a Home não está montada. Ao navegar para Home, o `useEffect` inicial faz fetch (correto). Mas se admin adicionar e ficar na mesma página, o refresh é imediato. Validar comportamento cross-page com mais cuidado.

4. **Reset de página ao aplicar filtros:** atualmente `handleApply` reseta `page=1`. Mas se o usuário está em uma página alta e o filtro exclui seus resultados, ele fica preso. Confirmar que está resetando corretamente.

5. **Acessibilidade do dropdown de filtros:** tem `aria-expanded` e `aria-haspopup="true"`, mas falta `aria-controls` apontando para o painel. Fechar com `Escape` também não está implementado.

6. **Fechar dropdown com Escape:** adicionar handler de `keydown` para `Escape` que fecha o dropdown.

7. **Botão Adicionar em todas as páginas:** o botão está na navbar global, mas só faz sentido conceitualmente na Home. Considerar ocultar em outras páginas (Login, Register, etc.) para evitar UX confuso.

8. **Validação de Admin no Layout:** o Layout sabe se o usuário é admin e passa `onAddMovie` condicionalmente para Navbar. Mas a Navbar não sabe do auth (recebe apenas a função). Se outras verificações de admin forem adicionadas, pode haver inconsistência. Considerar passar `isAdmin` como prop também.

9. **Cache de opções de filtro:** `FilterBar` faz `moviesAPI.getYears()` e `moviesAPI.getGenres()` em todo mount. Considerar cache (React Query, SWR, ou context) para evitar requests repetidos.

10. **Testes:** nenhum teste foi escrito durante esta sessão. Seria importante adicionar testes para:
    - Debounce da busca
    - Filtro `?search=` no backend
    - Dedupe de gêneros
    - Click-outside do modal
    - `refreshKey` propaga corretamente

---

## Comandos Úteis

```bash
# Rodar frontend em dev
cd frontend && npm run dev

# Build de produção
cd frontend && npm run build

# Typecheck do backend
npx tsc --noEmit

# Buscar todas as referências a um componente
grep -rn "FilterBar" frontend/src

# Verificar que não há emojis restantes
grep -rE "🎬|🏠|👤|🚪|🔑|❤️|🤍|⏳|⚠️|📝|🔐|🗑️|📅|🎭|🌟|🔴|🟢|🎉|✨|⏰|✓" frontend/src
```
