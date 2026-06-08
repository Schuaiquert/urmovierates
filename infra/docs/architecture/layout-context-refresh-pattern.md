# Pattern: Cross-tree invalidation signal via LayoutContext

**Categoria:** arquitetura de estado
**Aplicável a:** qualquer lista client-side que precise revalidar quando algo global acontece (item adicionado, item removido em outra página, etc).
**Motivação:** evitar re-fetch poluído (timer, polling, refetch-on-focus) e ao mesmo tempo evitar a tentação de propagar sinal via DOM scraping.

---

## Problema

Em SPAs há eventos que precisam invalidar listas em **outras** páginas:
- usuário adiciona um filme → a home, os favoritos e outras listas devem mostrar o novo filme.
- usuário remove um favorito → outras abas, contadores no header.
- admin edita um filme → lista de filmes reflete a edição.

Abordagens ingênuas e por que falham:

| Abordagem | Problema |
|-----------|----------|
| Polling a cada X segundos | desperdiça banda, atrasa o usuário, e mesmo assim é "stale" entre polls |
| `window.dispatchEvent` + listener | funciona, mas vira arquitetura de eventos ad-hoc sem type safety |
| DOM scraping: `document.querySelector('main').getAttribute('data-refresh-key')` lido no render | **não dispara re-render React**, só lê o estado atual; é leitura "às cegas" |
| Context com getter/setter | OK, mas precisa de cuidado para não re-renderizar todos os consumers em todo setState |

A solução do projeto `urmovierates` foi **Context com um contador** (sinal de invalidação), não com o estado da lista em si. A lista continua sendo buscada pelo consumer que precisa dela; o context só diz "está desatualizado, refetcha".

---

## Solução

### 1. Definição do context

```tsx
// src/contexts/LayoutContext.tsx
'use client';

import { createContext, useContext } from 'react';

export interface LayoutContextValue {
  /**
   * Bumped by the PublicLayout when something globally invalidates
   * the lists (e.g. a movie is added, a favorite changes).
   * Children can depend on this to re-fetch.
   */
  refreshKey: number;
}

export const LayoutContext = createContext<LayoutContextValue>({ refreshKey: 0 });

export function useLayoutContext(): LayoutContextValue {
  return useContext(LayoutContext);
}
```

**Princípios:**
- O context carrega **só o sinal de invalidação**, não os dados. Dados têm forma e ciclo de vida diferentes em cada consumer.
- O valor default (`{ refreshKey: 0 }`) garante que consumers fora do Provider funcionam (ex.: testes, Storybook).
- É `'use client'` — não participa de SSR. Em SSR o valor é o default, e o consumer trata o primeiro `useEffect` como o fetch inicial.

### 2. Provider no layout root

```tsx
// src/components/layout/PublicLayout.tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { LayoutContext } from '@/contexts/LayoutContext';

export function PublicLayout({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const layoutValue = useMemo(() => ({ refreshKey }), [refreshKey]);

  return (
    <LayoutContext.Provider value={layoutValue}>
      <main data-refresh-key={refreshKey}>{children}</main>
      <SomeModal onDone={refresh} />
    </LayoutContext.Provider>
  );
}
```

**Notas:**
- `useMemo` em `layoutValue` é essencial: sem ele, o objeto `{ refreshKey }` muda de referência a cada render, fazendo todos os consumers re-renderizarem desnecessariamente.
- `setRefreshKey((k) => k + 1)` é imutável e estável.
- O `data-refresh-key` no `<main>` **foi mantido** por compatibilidade com testes E2E/Playwright que checam o DOM. Não é mais usado por nenhum consumer React (substituído pelo Context). Pode ser removido em uma refatoração futura quando não houver mais dependência externa.

### 3. Consumer com dedupe

```tsx
// src/app/(public)/home-client.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLayoutContext } from '@/contexts/LayoutContext';

export function HomeClient({ initialMovies }) {
  const { refreshKey } = useLayoutContext();
  const searchParams = useSearchParams();

  const lastKey = useRef<string>('');

  const refetch = useCallback(async (paramsString: string) => {
    // ... fetch e setMovies/setPagination
  }, []);

  const paramsKey = searchParams?.toString() ?? '';

  useEffect(() => {
    const key = `${paramsKey}|${refreshKey}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    refetch(paramsKey);
  }, [paramsKey, refreshKey, refetch]);
}
```

**Por que `lastKey` ref:**
- StrictMode (dev) executa o effect 2x na montagem.
- Re-renders que mudem `paramsKey` mas para a mesma URL efectiva (improvável mas possível após `router.replace` com params idênticos) não devem disparar fetch duplicado.
- O ref persiste entre renders e é atualizado sincronamente antes do fetch, garantindo que um segundo call concorrente vê a key nova e bail-out.

**Por que `${paramsKey}|${refreshKey}` (chave composta):**
- Se a URL muda (paramsKey diferente) → refetch independente do refreshKey.
- Se algo invalida (refreshKey++) → refetch mesmo se a URL é a mesma.
- Compor as duas em uma string permite comparar com `===` (igualdade simples) e dedupe ambos os cenários.

---

## Onde **NÃO** aplicar

- **Estado local a uma feature** (ex.: campo de busca local antes de submeter): use `useState` na própria feature. Context é overhead desnecessário.
- **Estado que muda a cada keystroke** (ex.: texto de input de busca em tempo real): se propagar via context a cada caractere, todo consumer re-renderiza. Debounce + URL state é melhor.
- **Cache de dados do servidor**: prefira SWR, React Query, ou `useSWR` com chave. Eles já invalidam por URL e têm revalidação automática. Context é só para sinal cross-tree **além** do que essas libs já cobrem.

---

## Trade-offs

| Aspecto | Impacto |
|---------|---------|
| Toda adição de filme precisa chamar `refresh()` | Esquecer = stale data na home. Mitigação: helper `useRefresh()` que retorna o `() => setRefreshKey(k => k + 1)` memoizado |
| Re-render de todos os consumers em qualquer bump | Para 5-10 consumers é desprezível. Para 100+, considerar flag booleano + lista de chaves afetadas |
| Não carrega os dados, só o sinal | Positivo: cada consumer faz seu próprio fetch com seus próprios params (search, filter, pagination). Negativo: se 5 consumers refetcham juntos, são 5 requests. Aceitável para 5–10 listas; se virar problema, deduplicar via SWR compartilhado |
| Combinar com `searchParams?.toString()` para o ciclo de URL → fetch | Adiciona 1 import e 1 linha; resolve o loop de re-fetch documentado no ADR-008 |

---

## Histórico de aplicação no projeto

| Data | Aplicação | Commit |
|------|-----------|--------|
| 2026-06-08 | `LayoutContext.refreshKey` criado para invalidar home/favorites após add/remove | `3f538fb` |

---

## Referências

- ADR-008: `useSearchParams` no Next.js 14 App Router
- Sessão: `infra/docs/sessions/frontend-nextjs-loop-fix-2026-06-08.md`
- Implementação: `frontend/src/contexts/LayoutContext.tsx`, `frontend/src/components/layout/PublicLayout.tsx`, `frontend/src/app/(public)/home-client.tsx`
