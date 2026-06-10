# Migração UUID → INTEGER IDENTITY — Notas em tempo real

**Data:** 2026-06-09 → 2026-06-10
**ORM:** Prisma 5.22 + PostgreSQL 16 (via docker)
**Estratégia:** 3 ondas (A: folhas, B: dependentes com PK, C: validação de junção)

## Estado Atual — MIGRAÇÃO CONCLUÍDA

| Wave | Tabelas | Status | FKs recriadas | Observações |
|---|---|---|---|---|
| A.1 | genres | ✅ done 2026-06-09 | 1 (movie_genres) | Sequence `genres_id_new_seq` |
| A.2 | movies | ✅ done 2026-06-09 | 3 (reviews, favorites, movie_genres) | Sequence `movies_id_new_seq` |
| A.3 | users | ✅ done 2026-06-09 | 3 (reviews, favorites, pwt) | Sequence `users_id_new_seq` |
| B.1 | favorites | ✅ done 2026-06-09 | 0 (já é folha) | Sequence `favorites_id_new_seq` |
| B.2 | reviews | ✅ done 2026-06-09 | 0 (já é folha) | Sequence `reviews_id_new_seq` |
| B.3 | password_reset_tokens | ✅ done 2026-06-10 | 0 (já é folha) | Sequence `password_reset_tokens_id_new_seq` |
| C | movie_genres | ✅ validado | 0 (PK composta, FKs já recriadas em A.1 e A.2) | Zero órfãos em todas as ondas |

## Contagens (auditar contra baseline)

**Baseline pré-migração** (preservado):
- users: 9
- movies: 43
- genres: 12
- favorites: 5
- reviews: 7
- password_reset_tokens: 0
- movie_genres: 78

**Pós-tudo** (após rodar `prisma/seed.ts` que adiciona 5 filmes + 10 junções):
- users: 9
- movies: 48
- genres: 12
- favorites: 5
- reviews: 7
- password_reset_tokens: 0
- movie_genres: 88

**Órfãos: 0 em todas as ondas.** (verificado em `scripts/db/_validate_final.js`)

## Ajuste da Wave B.3 (correção durante execução)

A primeira tentativa de `prisma db execute` falhou em:

```
ERROR: setval: value 0 is out of bounds for sequence "password_reset_tokens_id_new_seq" (1..9223372036854775807)
```

Causa: o `setval(..., 0, false)` planejado para o caso "tabela vazia" não é válido no PostgreSQL — sequences não aceitam 0 (mínimo é 1). Correção: trocar o `setval` para `IF MAX IS NOT NULL THEN setval(max, true)` — quando pwt está vazia, `MAX` retorna `NULL` e a sequence fica no padrão `1`.

## Ajustes em relação ao plano original

1. **A coluna nova precisa de sequence dedicada**, com `OWNED BY` + `SET DEFAULT nextval(...)` para que Prisma envie o id como DEFAULT (não como bound param).
2. **RENAME COLUMN falha** se a coluna de destino já existe. Estratégia: drop a coluna velha antes de renomear.
3. **`prisma db execute` honra BEGIN/ROLLBACK** mas o estado fica limpo em caso de erro. Não há lixo deixado no banco.
4. **`prisma migrate resolve --applied`** marca a migration como aplicada no `_prisma_migrations` (registro de que ela foi executada fora do `migrate dev`).
5. **`prisma generate` falha** se o schema tiver inconsistências (ex: model pai `Int` mas FK filha `String`). Rodar `generate` apenas depois de atualizar todos os models.
6. **Seed precisa de update** quando o `id` deixa de ser slug (UUID) e vira Int autoincrement. O `prisma.movie.upsert({ where: { id: 'the-shawshank-redemption' } })` quebrou. Solução: `findFirst({ where: { title } })` + `create` ou `update` (já que `title` não é `@unique` no schema, não dá pra usar `upsert`).
7. **Backend precisa de `Number(req.params.id)`** em todos os controllers — `req.params` é `string` por padrão no Express, mas os services agora esperam `number`.
8. **JWT payload `userId: string → number`** — todos os tokens emitidos antes da migração viraram inválidos. Usuários precisam logar de novo.

## Validação Final

Comandos executados após a migração:
- `npx tsc --noEmit` → 0 erros
- `npx prisma migrate status` → "Database schema is up to date!" (10 migrations)
- `npx prisma generate` → ok
- `npx ts-node prisma/seed.ts` → "✅ Seeding completed"
- `node scripts/db/_validate_final.js` → zero órfãos em 7 checagens, 6 sequences presentes

## Impacto no Frontend

O frontend (`frontend/src/types/{movie,review,user}.ts`) precisa ter todos os `id: string`, `movieId: string`, `userId: string`, `genreId: string` atualizados para `number`. A página dinâmica `frontend/src/app/(public)/movie/[id]/page.tsx` recebe `id` como `string` da URL e passa para o Prisma — precisa de `Number(params.id)` no `movie-detail.tsx`.
