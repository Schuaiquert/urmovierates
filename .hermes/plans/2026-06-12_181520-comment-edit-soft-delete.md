# Edição e Soft-Delete de Comentários com Auditoria Admin

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Permitir que o autor edite sua própria avaliação (texto + nota) e
que **qualquer exclusão** (do próprio autor OU por admin) seja um **soft
delete unificado** com auditoria (quem/quando/por quê) e exiba um aviso ao
autor — sem nunca confiar no frontend para autorização.

**Architecture:**
- Migration adiciona colunas `isDeleted`, `deletedAt`, `deletedById`,
  `deletionReason` em `reviews` + FK para `users`.
- Endpoint `PATCH /reviews/:id` (autor-only, admin NÃO edita de outros).
- Endpoint `DELETE /reviews/:id` aceita autor e admin; ambos disparam
  `softDelete` com `reason` **obrigatório** (validado por
  `express-validator`).
- Consultas públicas filtram `isDeleted=false`, com exceção transparente
  para o autor ver o registro removido (banner de moderação).
- Frontend adiciona botões Editar/Excluir contextuais, modal de edição
  reaproveitando `ReviewForm`, banner de moderação visível só ao autor,
  e `prompt` para coletar o motivo antes do delete.

**Tech Stack:** Node/Express + Prisma + PostgreSQL (backend), Next.js 14 App
Router + React 18 (frontend), framer-motion, lucide-react, tailwindcss.

---

## Estado Atual (linha de base)

- `prisma/schema.prisma` (linhas 85–99): model `Review { id, rating, text,
  userId, movieId, createdAt, updatedAt }` — sem campos de soft delete.
- `src/services/reviewService.ts` (linhas 32–54): `findById`, `update`,
  `delete` (físico); `findAll`/`getByMovie` retornam **tudo** sem filtro.
- `src/controllers/reviewController.ts` (linhas 70–103): `update`/`delete`
  aceitam ADMIN alterar/excluir de qualquer um — precisa afunilar.
- `src/routes/reviewRoutes.ts` (linhas 100–218): `PUT /:id`, `DELETE /:id`
  com `authenticate` + `requireRole('USER','ADMIN')` — middleware OK.
- `frontend/src/components/review/ReviewCard.tsx` (linhas 5–35): botão
  `Excluir` condicional via prop `onDelete` — não há `Editar`, não há
  estado `isDeleted`/`deletedBy`.
- `frontend/src/services/api.ts` (linhas 128–138): `reviewsAPI.remove`
  não envia body — precisa aceitar `reason`.
- `frontend/src/hooks/useReviews.ts` (linhas 50–55): `deleteReview` chama
  `reviewsAPI.remove(id)` sem body.
- `frontend/src/app/(public)/movie/[id]/movie-detail.tsx` (linhas 175–178):
  `ReviewCard` recebe `onDelete` só quando `r.userId === user.id`. Admin
  ainda não vê o botão Excluir em reviews de terceiros.
- `frontend/src/types/review.ts` (linhas 8–16): `Review` sem campos de
  moderação.

---

## Decisões de Design

1. **PK de `Review` é INTEGER** (wave B.2 — ver migration
   `20260609_223100_wave_b_reviews`). `deletedById` portanto é `Int`,
   **não UUID** (o briefing original mencionava UUID porque a base
   mental do user pode estar em TEXT IDs antigos; o código atual já
   migrou).
2. **Soft delete é a única modalidade de exclusão.** Tanto admin
   removendo conteúdo de terceiro quanto o próprio autor apagando o
   seu comentário disparam `softDelete` com auditoria completa.
   Decisão confirmada: o autor que apaga o próprio comentário também
   vê o banner de moderação no lugar do conteúdo original. Isso
   unifica a rastreabilidade (`isDeleted`/`deletedAt`/`deletedById`
   sempre preenchidos) e remove a complexidade de dois caminhos
   (hard/soft) na service.
3. **`deletionReason` é obrigatório.** Validators exige body com
   `reason` não-vazio (1–500 chars). Frontend usa `window.prompt`
   para coletar o motivo antes de chamar a API. Controller também
   defende em profundidade para evitar bypass.
4. **`updatedAt` em edição.** `@updatedAt` no Prisma já cuida disso;
   não há código novo, só documentação na `ReviewForm`.
5. **Filtro `isDeleted=false`** é aplicado em `findAll` (todas as
   listagens públicas), `getByMovie`, `getMovieStats` (não conta
   reviews deletadas) e `findById` (404 para terceiros, mas autor
   recebe o registro com `isDeleted=true`).
6. **Frontend:** o autor recebe `Review.isDeleted=true` com
   `deletedBy.name` e `deletedAt`. O `text` continua no payload
   (auditoria no banco), mas o frontend **não renderiza** no banner.
7. **`EditReviewModal`** reusa `ReviewForm` recebendo `initialValues`
   para evitar duplicar markup de rating/textarea.

---

## Tarefas (cada uma = 2–5 min)

### Task 1 — Migration: adicionar colunas de moderação

**Files:**
- Create: `prisma/migrations/20260612_182000_review_soft_delete/migration.sql`

**Step 1: Criar pasta de migration**

```bash
mkdir -p prisma/migrations/20260612_182000_review_soft_delete
```

**Step 2: Escrever SQL**

```sql
-- =============================================================
-- Review soft delete + auditoria de moderação por admin/autor.
-- Pré-validação: nenhuma coluna de auditoria existe em reviews.
-- =============================================================

BEGIN;

ALTER TABLE "reviews"
  ADD COLUMN "isDeleted"     BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN "deletedAt"     TIMESTAMP(3),
  ADD COLUMN "deletionReason" TEXT,
  ADD COLUMN "deletedById"   INTEGER;

-- FK para users (sem cascade: se o moderador for removido, mantemos
-- o registro histórico e limpamos deletedById via SET NULL).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_deletedById_fkey'
  ) THEN
    ALTER TABLE "reviews"
      ADD CONSTRAINT "reviews_deletedById_fkey"
      FOREIGN KEY ("deletedById") REFERENCES "users"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- Índice auxiliar: "listar reviews removidas pelo admin X" em casos
-- de auditoria/discovery.
CREATE INDEX IF NOT EXISTS "reviews_isDeleted_deletedById_idx"
  ON "reviews"("isDeleted","deletedById");

-- Sanity-check
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM "reviews" WHERE "isDeleted" = TRUE;
  RAISE NOTICE 'Migration OK — existing soft-deleted rows=%', v_count;
END $$;

COMMIT;
```

**Step 3: Aplicar migration no banco de dev**

```bash
cd /home/projects/pedro/urmovierates
docker compose -f infra/docker/docker-compose.dev.yml exec -T app \
  npx prisma migrate deploy
```

(Se a app não estiver em container, usar `npx prisma migrate dev`.)

Expected: `1 migration(s) found in prisma/migrations. / Applying migration
20260612_182000_review_soft_delete / Database is now in sync.`

**Step 4: Regenerar Prisma Client**

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec -T app \
  npx prisma generate
```

**Step 5: Verificar colunas no Postgres**

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec -T postgres \
  psql -U postgres -d urmovierates -c '\d reviews'
```

Expected: aparecem as colunas `isDeleted`, `deletedAt`, `deletionReason`,
`deletedById` e o índice `reviews_isDeleted_deletedById_idx`.

**Step 6: Commit (NÃO executar — aguardar permissão do user)**

```bash
git add prisma/migrations/20260612_182000_review_soft_delete
git status  # só mostrar o diff, não commitar
```

> **Ponto de atenção:** projeto roda em Docker (ver memória
> `dev_app`/`dev_postgres_dev_data`). Caso o `docker compose` exija
> path diferente, ajustar para o arquivo real. Confirmar com
> `ls infra/docker/`.

---

### Task 2 — Schema.prisma: espelhar a migration

**Files:**
- Modify: `prisma/schema.prisma:85-99` (model `Review`)

**Step 1: Substituir o model `Review`**

```prisma
model Review {
  id        Int      @id @default(autoincrement())
  rating    Int
  text      String?  @db.VarChar(1000)
  userId    Int
  movieId   Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Moderação (soft delete + auditoria)
  isDeleted      Boolean   @default(false)
  deletedAt      DateTime?
  deletionReason String?
  deletedById    Int?

  user      User   @relation("ReviewAuthor", fields: [userId], references: [id], onDelete: Cascade)
  deletedBy User?  @relation("ReviewModerator", fields: [deletedById], references: [id], onDelete: SetNull)
  movie     Movie  @relation(fields: [movieId], references: [id], onDelete: Restrict)

  @@unique([userId, movieId])
  @@index([isDeleted, deletedById])
  @@map("reviews")
}
```

**Step 2: Atualizar o `model User` para a relação reversa**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  reviews          Review[] @relation("ReviewAuthor")
  moderatedReviews Review[] @relation("ReviewModerator")
  favorites        Favorite[]
  resetTokens      PasswordResetToken[]

  @@map("users")
}
```

**Step 3: Validar que o build do client bate com a migration**

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec -T app \
  npx prisma generate
docker compose -f infra/docker/docker-compose.dev.yml exec -T app \
  npx tsc --noEmit
```

Expected: nenhum erro TS. Erros sobre `moderatedReviews` ausente em
`User` indicam que o `prisma generate` não rodou dentro do container;
re-rodar o `exec -T app npx prisma generate` (ver memória: o
`command: ["sh","-c","npx prisma generate && npm run dev"]` no compose
já cuida do host, mas container precisa de regen explícito).

**Step 4: Commit (NÃO executar — mostrar diff)**

```bash
git diff prisma/schema.prisma  # só inspecionar
```

---

### Task 3 — DTO: `UpdateReviewDTO` aceita `reason` opcional (apenas info)

**Files:**
- Modify: `src/types/index.ts:34-37`

**Step 1: Substituir o bloco `UpdateReviewDTO`**

```typescript
export interface UpdateReviewDTO {
  rating?: number;
  text?: string;
  /** Apenas informativo: nunca persistido a partir de input de usuário
   *  comum. Usado internamente pelo service para registrar moderação. */
  deletionReason?: string;
}
```

> Observação: `deletionReason` é só placeholder; a captura real virá na
> Task 6 (validator de delete). O DTO apenas não precisa de um novo
> arquivo — vamos reaproveitar.

**Step 2: Validar compilação**

```bash
cd /home/projects/pedro/urmovierates
npx tsc --noEmit
```

Expected: sem erros.

**Step 3: Commit (mostrar diff)**

```bash
git diff src/types/index.ts
```

---

### Task 4 — Service: `findById`/`findAll`/`getByMovie`/`getMovieStats` ignoram deletados (com exceção para o autor)

**Files:**
- Modify: `src/services/reviewService.ts:1-63`

**Step 1: Adicionar helper `isVisibleTo`**

Substituir o topo do arquivo por:

```typescript
import prisma from '../config/database';
import { CreateReviewDTO, UpdateReviewDTO, PaginationQuery } from '../types';
import { AppError } from '../middlewares/errorHandler';

type Viewer = { userId: number; role: 'USER' | 'ADMIN' } | null;

/**
 * Decide se um registro deve aparecer para o viewer.
 * - Não-deletados: sempre visíveis.
 * - Deletados: visíveis APENAS para o autor.
 */
function isVisibleTo(
  review: { isDeleted: boolean; userId: number },
  viewer: Viewer,
): boolean {
  if (!review.isDeleted) return true;
  if (!viewer) return false;
  return viewer.userId === review.userId;
}

export class ReviewService {
  async findAll(
    query: PaginationQuery & { movieId?: number; userId?: number },
    viewer: Viewer = null,
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query.movieId) where.movieId = query.movieId;
    if (query.userId) where.userId = query.userId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, role: true } },
          movie: { select: { id: true, title: true } },
          deletedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
```

**Step 2: Substituir `findById` por versão com visibilidade**

```typescript
  async findById(id: number, viewer: Viewer = null) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, role: true } },
        deletedBy: { select: { id: true, name: true } },
      },
    });
    if (!review) throw new AppError('Review not found', 404);
    if (!isVisibleTo(review, viewer)) {
      throw new AppError('Review not found', 404);
    }
    return review;
  }
```

**Step 3: Adicionar `getByMovie` e `getMovieStats` filtrando deletados**

```typescript
  async getByMovie(
    movieId: number,
    viewer: Viewer = null,
  ) {
    // Carrega TODAS as reviews (incluindo deletadas) para depois
    // filtrar as que o viewer tem direito de ver. Mais simples que
    // duas queries; reviews por filme são poucas.
    const all = await prisma.review.findMany({
      where: { movieId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
        deletedBy: { select: { id: true, name: true } },
      },
    });
    return all.filter((r) => isVisibleTo(r, viewer));
  }

  async getMovieStats(movieId: number) {
    const reviews = await prisma.review.findMany({
      where: { movieId, isDeleted: false },
      select: { rating: true },
    });
    if (reviews.length === 0) return { average: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Number((sum / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }
```

**Step 4: Manter `create`/`update`/`findByUserAndMovie` como estão**

Não precisam de mudança — `create` não vê deletados, `update` só roda
em `findById` que o controller já validou, e `findByUserAndMovie` é
interno do fluxo de criação.

**Step 5: Verificar TS**

```bash
npx tsc --noEmit
```

Expected: erros em `controller` que ainda passam a assinatura antiga.
Normal — corrigimos na Task 5.

**Step 6: Commit (mostrar diff)**

```bash
git diff src/services/reviewService.ts
```

---

### Task 5 — Controller: edição autor-only + delete unificado (soft) com `reason` obrigatório

**Files:**
- Modify: `src/controllers/reviewController.ts:1-107`
- Modify: `src/services/reviewService.ts` (acrescentar `softDelete`)

**Step 1: Substituir o controller inteiro**

```typescript
import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService';
import { AppError } from '../middlewares/errorHandler';
import { CreateReviewDTO, UpdateReviewDTO } from '../types';

type Viewer = { userId: number; role: 'USER' | 'ADMIN' };

function viewerFromReq(req: Request): Viewer | null {
  if (!req.user) return null;
  return { userId: req.user.userId, role: req.user.role as Viewer['role'] };
}

export class ReviewController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.findAll(
        {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10,
          movieId: req.query.movieId ? Number(req.query.movieId) : undefined,
          userId: req.query.userId ? Number(req.query.userId) : undefined,
        },
        viewerFromReq(req),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.findById(
        Number(req.params.id),
        viewerFromReq(req),
      );
      res.json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  async getByMovie(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getByMovie(
        Number(req.params.movieId),
        viewerFromReq(req),
      );
      res.json({ data: reviews });
    } catch (error) {
      next(error);
    }
  }

  async getMovieStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reviewService.getMovieStats(
        Number(req.params.movieId),
      );
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      }
      const data: CreateReviewDTO = {
        rating: Number(req.body.rating),
        text: req.body.text,
        movieId: Number(req.body.movieId),
        userId: req.userId,
      };
      const review = await reviewService.create(data);
      res.status(201).json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Editar comentário.
   * - Apenas o autor pode editar (admin NÃO edita comentários de outros).
   * - Apenas `rating` e `text` são mutáveis.
   * - `isDeleted`/`deletedById`/`deletedAt`/`deletionReason` JAMAIS
   *   vêm do body.
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      }
      const id = Number(req.params.id);
      const existing = await reviewService.findById(id, viewerFromReq(req));

      if (existing.userId !== req.user.userId) {
        throw new AppError(
          'Only the author can edit a review',
          403,
          'FORBIDDEN_NOT_AUTHOR',
        );
      }
      if (existing.isDeleted) {
        throw new AppError(
          'Cannot edit a removed review',
          409,
          'REVIEW_REMOVED',
        );
      }

      // Defesa em profundidade: ignora qualquer campo sensível do body.
      const safeBody = { ...req.body };
      delete safeBody.isDeleted;
      delete safeBody.deletedById;
      delete safeBody.deletedAt;
      delete safeBody.deletionReason;
      delete safeBody.userId;
      delete safeBody.movieId;

      const data: UpdateReviewDTO = safeBody;
      const review = await reviewService.update(id, data);
      res.json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir comentário.
   * - Autor pode excluir o próprio; admin pode excluir qualquer um.
   * - **Sempre soft delete** com auditoria (decisão confirmada).
   * - `reason` é obrigatório; validado também aqui em caso de bypass
   *   do express-validator.
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      }
      const id = Number(req.params.id);
      const existing = await reviewService.findById(id, {
        userId: req.user.userId,
        role: 'ADMIN', // bypass do filtro isDeleted=true
      });
      if (!existing) {
        throw new AppError('Review not found', 404, 'NOT_FOUND');
      }

      const isAdmin = req.user.role === 'ADMIN';
      const isAuthor = existing.userId === req.user.userId;

      if (!isAdmin && !isAuthor) {
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }

      // `reason` é garantido pelo validator, mas defendemos aqui.
      const reason = typeof req.body?.reason === 'string'
        ? req.body.reason.trim()
        : '';
      if (!reason) {
        throw new AppError(
          'Deletion reason is required',
          400,
          'REASON_REQUIRED',
        );
      }

      // Soft delete unificado (autor OU admin) — sem hardDelete.
      await reviewService.softDelete(id, req.user.userId, reason);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
```

**Step 2: Adicionar `softDelete` na service (sem `hardDelete`)**

Acrescentar ao final da classe `ReviewService` em
`src/services/reviewService.ts`:

```typescript
  /**
   * Soft delete unificado: usado tanto pelo autor removendo o
   * próprio quanto pelo admin removendo de terceiro. Decisão
   * confirmada: NÃO há caminho de hard delete.
   */
  async softDelete(id: number, deletedById: number, reason: string) {
    return prisma.review.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById,
        deletionReason: reason,
      },
    });
  }
```

**Step 3: Verificar TS**

```bash
npx tsc --noEmit
```

Expected: 0 erros. Se aparecer erro de `hardDelete` órfão, remover
qualquer referência remanescente.

**Step 4: Commit (mostrar diff)**

```bash
git diff src/controllers/reviewController.ts src/services/reviewService.ts
```

---

### Task 6 — Validador: `reason` obrigatório no DELETE + campos sensíveis bloqueados no PATCH

**Files:**
- Modify: `src/middlewares/validators.ts:43-57`

**Step 1: Reforçar `reviewValidators.update`**

Substituir o bloco `reviewValidators.update` por:

```typescript
  update: [
    param('id').isInt({ min: 1 }).withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('text').optional().trim().isLength({ max: 1000 }),
    // Defesa em profundidade: body não pode trazer campos de moderação.
    body('isDeleted').not().exists().withMessage('isDeleted is not allowed'),
    body('deletedById').not().exists().withMessage('deletedById is not allowed'),
    body('deletedAt').not().exists().withMessage('deletedAt is not allowed'),
    body('deletionReason').not().exists().withMessage('deletionReason is not allowed'),
    body('userId').not().exists().withMessage('userId is not allowed'),
    body('movieId').not().exists().withMessage('movieId is not allowed'),
  ],
```

**Step 2: Tornar `reason` obrigatório no `delete`**

Substituir `delete` por:

```typescript
  delete: [
    param('id').isInt({ min: 1 }).withMessage('Invalid review ID'),
    body('reason')
      .exists({ checkFalsy: true })
      .withMessage('reason is required')
      .bail()
      .isString()
      .withMessage('reason must be a string')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('reason cannot be empty')
      .bail()
      .isLength({ max: 500 })
      .withMessage('reason must be at most 500 characters'),
  ],
```

> O `reason` é obrigatório para **qualquer** delete (autor ou admin),
> garantindo que a auditoria sempre tenha um motivo. O `bail()` para
> o pipeline após o primeiro erro para evitar mensagens cascateadas.

**Step 3: Verificar TS**

```bash
npx tsc --noEmit
```

Expected: 0 erros.

**Step 4: Commit (mostrar diff)**

```bash
git diff src/middlewares/validators.ts
```

---

### Task 7 — Tipos do frontend: campos de moderação em `Review`

**Files:**
- Modify: `frontend/src/types/review.ts:1-21`

**Step 1: Substituir o arquivo**

```typescript
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
  updatedAt: string;
  /** Marca se o comentário foi removido (soft delete). */
  isDeleted?: boolean;
  /** Data ISO da remoção. Presente apenas quando isDeleted=true. */
  deletedAt?: string | null;
  /** Texto do motivo da remoção. Sempre presente em isDeleted=true
   *  (obrigatório pelo backend). */
  deletionReason?: string | null;
  /** Quem removeu (autor ou admin). Incluído via `include: { deletedBy }`. */
  deletedBy?: Pick<User, 'id' | 'name'> | null;
  deletedById?: number | null;
}

export interface ReviewStats {
  average: number;
  count: number;
}
```

**Step 2: Verificar TS do frontend**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: pode haver erros em arquivos consumidores (ReviewCard,
movie-detail, useReviews) — corrigimos nas tasks seguintes.

**Step 3: Commit (mostrar diff)**

```bash
git diff src/types/review.ts
```

---

### Task 8 — `ReviewForm`: aceitar `initialValues` + `submitLabel` para reuso em edição

**Files:**
- Modify: `frontend/src/components/review/ReviewForm.tsx:1-68`

**Step 1: Substituir o componente**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Rating } from '@/components/common/Rating';

const MAX_CHARS = 1000;
const RATING_LABEL: Record<number, string> = {
  1: 'Não gostou', 2: 'Regular', 3: 'Bom', 4: 'Ótimo', 5: 'Excelente!',
};

interface ReviewFormProps {
  /** Se informado, o formulário entra em modo "edição". */
  initialValues?: { rating: number; text: string };
  onSubmit: (data: { rating: number; text: string }) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export function ReviewForm({
  initialValues,
  onSubmit,
  loading,
  submitLabel = 'Publicar Avaliação',
}: ReviewFormProps) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(initialValues?.rating ?? 0);
  const [text, setText] = useState(initialValues?.text ?? '');
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
    try {
      await onSubmit({ rating, text });
      if (!initialValues) {
        setRating(0);
        setText('');
      }
    } catch (e) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Erro ao salvar avaliação');
    }
  };

  return (
    <form onSubmit={submit} className="bg-dark-100 rounded-xl p-6 border border-white/5">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        {initialValues ? 'Editar avaliação' : 'Avalie este filme'}
      </h3>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-3">Sua nota</label>
        <Rating value={rating} size="lg" interactive onChange={setRating} />
        {rating > 0 && <p className="text-sm text-gray-500 mt-1">{RATING_LABEL[rating]}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Seu comentário <span className="text-gray-600">(opcional)</span>
        </label>
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
      <Button type="submit" loading={loading} disabled={rating === 0} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
```

**Step 2: Verificar TS do frontend**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: 0 erros (consumidores atuais só passam `onSubmit`/`loading`,
que continuam válidos pela opcionalidade de `initialValues`).

**Step 3: Commit (mostrar diff)**

```bash
git diff src/components/review/ReviewForm.tsx
```

---

### Task 9 — Componente `EditReviewModal`

**Files:**
- Create: `frontend/src/components/review/EditReviewModal.tsx`
- Modify: `frontend/src/components/review/index.ts:1-2`

**Step 1: Criar `EditReviewModal.tsx`**

```tsx
'use client';

import { Modal } from '@/components/common/Modal';
import { ReviewForm } from './ReviewForm';
import type { Review } from '@/types';

interface EditReviewModalProps {
  open: boolean;
  review: Review;
  onClose: () => void;
  onSave: (data: { rating: number; text: string }) => Promise<void>;
  loading?: boolean;
}

export function EditReviewModal({
  open, review, onClose, onSave, loading,
}: EditReviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Editar avaliação" size="md">
      <div className="p-6">
        <ReviewForm
          initialValues={{
            rating: review.rating,
            text: review.text ?? '',
          }}
          onSubmit={onSave}
          loading={loading}
          submitLabel="Salvar alterações"
        />
      </div>
    </Modal>
  );
}
```

**Step 2: Atualizar `index.ts`**

```typescript
export { ReviewForm } from './ReviewForm';
export { ReviewCard } from './ReviewCard';
export { EditReviewModal } from './EditReviewModal';
```

**Step 3: Verificar TS do frontend**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: 0 erros.

**Step 4: Commit (mostrar diff)**

```bash
git diff src/components/review/EditReviewModal.tsx src/components/review/index.ts
```

---

### Task 10 — `ReviewCard`: renderizar estado de remoção + botões Editar/Excluir

**Files:**
- Modify: `frontend/src/components/review/ReviewCard.tsx:1-35`

**Step 1: Substituir o componente**

```tsx
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Rating } from '@/components/common/Rating';
import { formatDate } from '@/lib/format';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  isAdmin?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (id: string) => void;
}

export function ReviewCard({
  review, currentUserId, isAdmin, onEdit, onDelete,
}: ReviewCardProps) {
  const {
    id, rating, text, user, createdAt,
    isDeleted, deletedAt, deletedBy, deletionReason,
  } = review;

  const isAuthor = !!currentUserId && currentUserId === user?.id;
  const canEdit = !isDeleted && isAuthor && !!onEdit;
  const canDelete =
    !isDeleted &&
    ((isAuthor && !!onDelete) || (isAdmin && !!onDelete));

  // === Estado: comentário removido (soft delete), visto pelo autor ===
  if (isDeleted && isAuthor) {
    return (
      <article className="bg-dark-100 rounded-xl p-5 border border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-amber-200 font-medium">
              Seu comentário foi removido
              {deletedBy?.name && (
                <>
                  {' '}pelo administrador{' '}
                  <span className="text-amber-100">{deletedBy.name}</span>
                </>
              )}
              {deletedAt && (
                <>
                  {' '}em{' '}
                  <span className="text-amber-100">
                    {formatDate(deletedAt, 'long')}
                  </span>
                </>
              )}
              .
            </p>
            {deletionReason && (
              <p className="text-amber-300/80 text-sm mt-1">
                Motivo: {deletionReason}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              O conteúdo original não está mais visível publicamente.
            </p>
          </div>
        </div>
      </article>
    );
  }

  // === Estado normal ===
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
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
          <p className="text-gray-500 text-sm">{formatDate(createdAt, 'long')}</p>
          {(canEdit || canDelete) && (
            <div className="flex gap-3 text-sm">
              {canEdit && (
                <button
                  onClick={() => onEdit!(review)}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-primary-400 transition-colors"
                  aria-label="Editar avaliação"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                  Editar
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete!(id)}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-red-400 transition-colors"
                  aria-label="Excluir avaliação"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Excluir
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {text && <p className="text-gray-300 mt-3 leading-relaxed">{text}</p>}
    </article>
  );
}
```

**Step 2: Verificar TS do frontend**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: erros em `movie-detail.tsx` que ainda passa a prop antiga
`onDelete` sem `currentUserId`/`isAdmin`/`onEdit`. Corrigimos na Task 11.

**Step 3: Commit (mostrar diff)**

```bash
git diff src/components/review/ReviewCard.tsx
```

---

### Task 11 — Frontend wiring: `api.ts` + `useReviews` + `movie-detail`

**Files:**
- Modify: `frontend/src/services/api.ts:128-138` (bloco `reviewsAPI`)
- Modify: `frontend/src/hooks/useReviews.ts:50-55` (`deleteReview`)
- Modify: `frontend/src/app/(public)/movie/[id]/movie-detail.tsx:1-189`

**Step 1: `reviewsAPI.remove` aceita `reason` no body**

Substituir o bloco `reviewsAPI` em `services/api.ts:128-138`:

```typescript
export const reviewsAPI = {
  getAll: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<Review[]>>('/reviews', { params }),
  getByMovie: (movieId: string) =>
    api.get<ApiResponse<Review[]>>(`/reviews/movies/${movieId}`),
  getMovieStats: (movieId: string) =>
    api.get<ApiResponse<ReviewStats>>(`/reviews/movies/${movieId}/stats`),
  create: (data: Partial<Review>) => api.post<ApiResponse<Review>>('/reviews', data),
  update: (id: string, data: Partial<Review>) => api.put<ApiResponse<Review>>(`/reviews/${id}`, data),
  // reason é obrigatório no backend; o caller do hook deve garanti-lo.
  remove: (id: string, reason: string) =>
    api.delete(`/reviews/${id}`, { data: { reason } }),
};
```

> Axios `delete` aceita body no segundo argumento via `{ data: ... }`.

**Step 2: Hook `useReviews` passa o `reason` ao remover**

Substituir a função `deleteReview` em `useReviews.ts:50-55`:

```typescript
  const deleteReview = async (id: string, reason: string) => {
    if (!reason || !reason.trim()) {
      throw new Error('Motivo da exclusão é obrigatório');
    }
    await reviewsAPI.remove(id, reason.trim());
    setReviews((prev) => prev.filter((r) => r.id !== id));
    emitDataChanged({ kind: 'review:deleted', movieId });
    await fetchReviews();
  };
```

**Step 3: `movie-detail.tsx` — atualizar imports**

Trocar a linha 11 de:

```typescript
import { ReviewForm, ReviewCard } from '@/components/review';
```

para:

```typescript
import { ReviewForm, ReviewCard, EditReviewModal } from '@/components/review';
```

**Step 4: Adicionar state para edição**

Logo após `const [editing, setEditing] = useState(false);` (linha 27),
adicionar:

```typescript
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
```

**Step 5: Puxar `updateReview` do hook**

Trocar a linha 22–23 de:

```typescript
  const { reviews, stats, loading, createReview, deleteReview, refetch } =
    useMovieReviews(initialMovie.id);
```

para:

```typescript
  const { reviews, stats, loading, createReview, updateReview, deleteReview, refetch } =
    useMovieReviews(initialMovie.id);
```

**Step 6: Substituir `handleDelete` para pedir motivo**

Substituir o bloco `handleDelete` (linhas 59–66) por:

```typescript
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    const reason = window.prompt('Motivo da exclusão (obrigatório):');
    if (!reason || !reason.trim()) {
      window.alert('É necessário informar um motivo para excluir.');
      return;
    }
    try { await deleteReview(id, reason.trim()); }
    catch (e: unknown) {
      const err = e as { userMessage?: string };
      window.alert(err.userMessage ?? 'Erro ao excluir avaliação');
    }
  };
```

> **Nota UX:** `window.prompt` é a abordagem mínima viável e cobre
> o requisito de "motivo obrigatório" sem criar mais um modal. Em
> um follow-up, substituir por um `ConfirmDeleteModal` que combine
> confirmação + campo de motivo em uma única janela modal, mantendo
> o padrão visual dos outros modais do projeto (`AddMovieModal`,
> `EditMovieModal`, `EditReviewModal`). Aceitável para esta entrega.

**Step 7: Adicionar `handleSaveEdit`**

Após `handleCreate` (linha 57), adicionar:

```typescript
  const handleSaveEdit = async (data: { rating: number; text: string }) => {
    if (!editingReview) return;
    setSavingEdit(true);
    try {
      await updateReview(editingReview.id, data);
      setEditingReview(null);
    } catch (e: unknown) {
      const err = e as { userMessage?: string };
      window.alert(err.userMessage ?? 'Erro ao salvar edição');
    } finally {
      setSavingEdit(false);
    }
  };
```

**Step 8: Substituir a renderização do `ReviewCard`**

Trocar as linhas 175–178 por:

```tsx
            {displayReviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                currentUserId={user?.id}
                isAdmin={isAdmin}
                onEdit={
                  user && r.userId === user.id && !r.isDeleted
                    ? () => setEditingReview(r)
                    : undefined
                }
                onDelete={
                  user && (r.userId === user.id || isAdmin) && !r.isDeleted
                    ? () => handleDelete(r.id)
                    : undefined
                }
              />
            ))}
```

**Step 9: Renderizar o `EditReviewModal`**

Logo antes do `</div>` final (linha 187), inserir:

```tsx
      {editingReview && (
        <EditReviewModal
          open={!!editingReview}
          review={editingReview}
          loading={savingEdit}
          onClose={() => setEditingReview(null)}
          onSave={handleSaveEdit}
        />
      )}
```

**Step 10: Verificar TS do frontend**

```bash
cd /home/projects/pedro/urmovierates/frontend
npx tsc --noEmit
```

Expected: 0 erros.

**Step 11: Commit (mostrar diff)**

```bash
git diff src/services/api.ts src/hooks/useReviews.ts src/app/\(public\)/movie/\[id\]/movie-detail.tsx
```

> **Pitfall WSL:** paths com colchetes/brackets podem quebrar o shell.
> Usar **aspas simples** em volta do path, ou `git diff -- src/app/...`
> (o `--` evita interpretação de opções).

---

### Task 12 — Validação fim-a-fim (smoke test via curl)

> A pasta `tests/` está vazia e o `package.json` tem `"test": "jest"`
> mas **não há `jest.config` nem specs**. Não vamos instalar Jest
> agora (YAGNI). Em vez disso, validamos o comportamento via curl
> contra a API rodando.

**Files:** nenhum — apenas smoke test.

**Step 1: Garantir que o backend está rodando**

```bash
cd /home/projects/pedro/urmovierates
docker compose -f infra/docker/docker-compose.dev.yml ps
```

Expected: `dev_app` com status `Up`. Se estiver down:

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d app
```

**Step 2: Login como admin (obter token)**

```bash
TOKEN_ADMIN=$(curl -sS -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"email":"admin@urmovierates.com","password":"admin123"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["token"])')
echo "TOKEN_ADMIN length=${#TOKEN_ADMIN}"
```

Expected: `TOKEN_ADMIN length=...` ≥ 100.

> **Pitfall memória:** a pipeline Hermes pode **redatar** o `password`
> no body do curl. Se `password=admin123` virar `password=***`, o login
> falha. Em prática, no WSL atual o redator não atua sobre `curl`
> payloads simples. Se o login falhar, ver skill
> `docker-compose-dev-workflow` para workarounds (`printf` com base64,
> `htpasswd`, etc.).

**Step 3: Login como user comum e criar review de teste**

```bash
TOKEN_USER=$(curl -sS -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"email":"user@urmovierates.com","password":"user123"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["token"])')

REVIEW_ID=$(curl -sS -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN_USER" \
  -d '{"rating":4,"text":"review de teste edit/delete","movieId":1}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')
echo "REVIEW_ID=$REVIEW_ID"
```

**Step 4: Edição pelo autor (deve passar)**

```bash
curl -sS -X PATCH http://localhost:3000/api/reviews/$REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN_USER" \
  -d '{"rating":5,"text":"review editada"}' | python3 -m json.tool
```

Expected: `data.rating == 5` e `data.text == "review editada"`.

**Step 5: Edição por outro user (deve falhar 403)**

```bash
curl -sS -X PATCH http://localhost:3000/api/reviews/$REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"rating":1}' -w "\nHTTP %{http_code}\n"
```

Expected: `HTTP 403` e `code: FORBIDDEN_NOT_AUTHOR`.

> Confirma que **admin não edita comentário de outro usuário**.

**Step 6: Edição com `isDeleted` no body (deve falhar 400)**

```bash
curl -sS -X PATCH http://localhost:3000/api/reviews/$REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN_USER" \
  -d '{"isDeleted":true,"rating":3}' -w "\nHTTP %{http_code}\n"
```

Expected: `HTTP 400` e `error: "isDeleted is not allowed"`.

**Step 7: Delete SEM motivo (deve falhar 400)**

```bash
curl -sS -X DELETE http://localhost:3000/api/reviews/$REVIEW_ID \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN_USER" \
  -H "Content-Type: application/json" \
  -d '{}' -w "\nHTTP %{http_code}\n"
```

Expected: `HTTP 400` e `error: "reason is required"`.

**Step 8: Delete COM motivo — soft delete unificado**

```bash
curl -sS -X DELETE http://localhost:3000/api/reviews/$REVIEW_ID \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN_USER" \
  -H "Content-Type: application/json" \
  -d '{"reason":"quero remover"}' -w "\nHTTP %{http_code}\n"
```

Expected: `HTTP 204`.

> O autor removeu o próprio. Mesmo assim, foi soft delete (não
> houve `prisma.review.delete`).

**Step 9: Confirmar soft delete no banco**

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec -T postgres \
  psql -U postgres -d urmovierates \
  -c "SELECT id, \"isDeleted\", \"deletedById\", \"deletedAt\", \"deletionReason\" FROM reviews WHERE id=$REVIEW_ID;"
```

Expected:

```
 id | isDeleted | deletedById | deletedAt | deletionReason
----+-----------+-------------+-----------+----------------
  X | t         |        2    | 2026-...  | quero remover
```

**Step 10: Listar reviews do filme (terceiro NÃO vê a deletada)**

```bash
curl -sS http://localhost:3000/api/reviews/movies/1 \
  -H "X-API-Key: $API_KEY" | \
  python3 -c 'import json,sys; data=json.load(sys.stdin)["data"]; print("count:", len(data)); print("deleted visible:", any(r["isDeleted"] for r in data))'
```

Expected: `count: ...` (sem a deletada) e `deleted visible: False`.

**Step 11: Autor consulta a review deletada (deve receber com banner)**

```bash
curl -sS http://localhost:3000/api/reviews/$REVIEW_ID \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $TOKEN_USER" | python3 -m json.tool
```

Expected: `data.isDeleted == true`, `data.deletedBy.id == 2`,
`data.deletedBy.name == "John Doe"` (o próprio autor aparece como
moderador da auto-exclusão), `data.text == "review editada"`
(conteúdo preservado para auditoria), `data.deletedAt` presente,
`data.deletionReason == "quero remover"`.

**Step 12: Terceiro consulta a review deletada (deve receber 404)**

```bash
curl -sS http://localhost:3000/api/reviews/$REVIEW_ID \
  -H "X-API-Key: $API_KEY" -w "\nHTTP %{http_code}\n"
```

Expected: `HTTP 404`.

**Step 13: Stats do filme (não conta a deletada)**

```bash
curl -sS http://localhost:3000/api/reviews/movies/1/stats \
  -H "X-API-Key: $API_KEY" | python3 -m json.tool
```

Expected: `count` **menor** do que era antes do delete.

**Step 14: Commit (não executar — registrar no log)**

```bash
echo "Smoke test passed at $(date)" >> /tmp/urmovierates-smoke.log
```

---

### Task 13 — Atualizar README com a nova API

**Files:**
- Modify: `README.md` (seção "Endpoints" / "Reviews")

**Step 1: Adicionar nota sobre soft delete e motivo obrigatório**

Localizar a seção que descreve `PATCH /api/reviews/:id` e `DELETE
/api/reviews/:id` e adicionar (ou substituir o bloco existente):

```markdown
### Edição e exclusão de comentários

- `PATCH /api/reviews/:id` — apenas o **autor** pode editar (admin NÃO
  edita comentários de outros). Campos mutáveis: `rating`, `text`.
  Campos sensíveis (`isDeleted`, `deletedById`, `deletedAt`,
  `deletionReason`, `userId`, `movieId`) são rejeitados com HTTP 400.
- `DELETE /api/reviews/:id` — autor pode excluir o próprio; admin
  pode excluir qualquer um. **Sempre soft delete** com auditoria
  (`isDeleted`, `deletedAt`, `deletedById`, `deletionReason`).
  Body **obrigatório**: `{ "reason": "motivo (1-500 chars)" }`.
  Resposta 400 (`REASON_REQUIRED`) se ausente ou vazio.
- O autor da review removida ainda recebe o registro ao consultar
  `GET /api/reviews/:id` com seu token, com `isDeleted: true` e
  `deletedBy: { id, name }` para exibir o banner de moderação.
  Em auto-exclusões, `deletedBy` aponta para o próprio autor.
- Listagens públicas (`GET /api/reviews/movies/:id`,
  `GET /api/reviews`) e o cálculo de estatísticas (`/stats`) **ignoram**
  reviews com `isDeleted: true`.
```

**Step 2: Commit (mostrar diff)**

```bash
git diff README.md
```

---

## Resumo dos Arquivos Afetados

**Backend (criar):**
- `prisma/migrations/20260612_182000_review_soft_delete/migration.sql`

**Backend (modificar):**
- `prisma/schema.prisma`
- `src/types/index.ts`
- `src/services/reviewService.ts`
- `src/controllers/reviewController.ts`
- `src/middlewares/validators.ts`

**Frontend (criar):**
- `frontend/src/components/review/EditReviewModal.tsx`

**Frontend (modificar):**
- `frontend/src/types/review.ts`
- `frontend/src/services/api.ts`
- `frontend/src/hooks/useReviews.ts`
- `frontend/src/components/review/ReviewForm.tsx`
- `frontend/src/components/review/ReviewCard.tsx`
- `frontend/src/components/review/index.ts`
- `frontend/src/app/(public)/movie/[id]/movie-detail.tsx`

**Docs:**
- `README.md`

## Critérios de Aceitação (mapeados)

| AC | Como verificamos |
|----|-------------------|
| Usuário edita apenas próprio | Task 5: `existing.userId !== req.user.userId → 403 FORBIDDEN_NOT_AUTHOR` |
| User comum não edita de terceiros | Idem; Task 12 step 5 confirma com admin tentando editar review de user |
| User comum exclui apenas próprio | Task 5: `!isAdmin && !isAuthor → 403`; autor pode excluir o próprio (soft) |
| Admin exclui de qualquer user | Task 5: `isAdmin → softDelete` (mesmo fluxo do autor) |
| Exclusões são registradas | Task 1 (migration) + Task 5 (`softDelete` seta `isDeleted`/`deletedAt`/`deletedById`/`deletionReason`) — **para todo delete** |
| `deletionReason` é obrigatório | Task 6 (validator: `exists({ checkFalsy: true })`) + Task 5 (defesa em profundidade) + Task 12 step 7 (curl sem motivo → 400) |
| Comentários removidos não aparecem publicamente | Tasks 4 + 5: `where: { isDeleted: false }` em `findAll`/`getMovieStats`, filtro em `getByMovie`, `isVisibleTo` em `findById` |
| Autor vê aviso de moderação | Tasks 7 (tipo) + 10 (banner amber em `ReviewCard`) + 4 (exceção de visibilidade) |
| Conteúdo original não é exibido | Task 10: ramo `isDeleted && isAuthor` não renderiza `text`/`rating`; backend envia (auditoria), frontend suprime |
| Validação no backend | Tasks 5 (defesa em profundidade) + 6 (express-validator rejeita campos sensíveis e exige `reason`) |
| Migration sem perda de dados | Task 1: `ADD COLUMN ... DEFAULT FALSE` é não-destrutivo |

## Riscos & Tradeoffs

1. **Autor vê o próprio `text` deletado via `GET /reviews/:id`.**
   Tradeoff explícito: precisamos enviar `text` para auditoria/memória
   do autor; o frontend suprime a renderização. Alternativa: NULL-ificar
   o `text` no soft delete (perde-se o histórico do que foi removido).
   **Decisão:** manter `text` no banco (rastreabilidade), ocultar no UI.

2. **Auto-exclusão também é soft delete.** Decisão confirmada: o
   autor que apaga o próprio comentário também vê o banner de
   moderação no lugar do conteúdo, e `deletedBy` aponta para o
   próprio usuário (não há terceiro). Tradeoff: a auditoria fica
   uniforme (sempre sabemos quem/quando/por quê), mas o autor perde
   o "apagar e pronto". Aceitável conforme decisão do time.

3. **Prompt nativo do browser (`window.prompt`) para coletar o
   motivo.** Funcional e zero-dependência, mas UX inferior a um
   modal custom. Documentado na Task 11 step 6 como follow-up
   aceitável (criar `ConfirmDeleteModal` no padrão dos outros
   modais do projeto).

4. **Admin pode editar?** O briefing original diz "Administradores
   **não** devem editar comentários de outros usuários." A Task 5
   implementa **autor-only** para edição. Admin só remove. Confirmado
   pelo user.

5. **`getByMovie` carrega todas as reviews e filtra em memória.**
   Simples e correto. Ineficiente em filmes com milhares de reviews;
   a otimização (CTE/array_filter no Postgres) fica como follow-up.

6. **Jest não configurado.** Não vamos adicionar framework de teste
   (YAGNI). Smoke test manual via curl cobre o caminho crítico.

## Decisões Confirmadas (com o user)

1. **Admin NÃO edita comentário de outros.** Implementação atual
   proíbe até admin editar de terceiros (autor-only em PATCH).
   Confirmado pelo user.
2. **Soft delete unificado.** Tanto admin removendo terceiro quanto
   autor removendo o próprio disparam `softDelete` com auditoria.
   **Não há mais caminho de `hardDelete` na service.** Confirmado
   pelo user.
3. **`deletionReason` é obrigatório.** Validators exige body com
   `reason` não-vazio (1–500 chars). Frontend usa `window.prompt`
   para coletar o motivo antes de chamar a API. Controller defende
   em profundidade. Confirmado pelo user.

## Rollback Story

Se Task 1 revelar problema estrutural (ex.: `prisma migrate` falha por
lock do Postgres), reverter com:

```bash
# reverter migration (rollback manual do SQL)
docker compose -f infra/docker/docker-compose.dev.yml exec -T postgres \
  psql -U postgres -d urmovierates -c "
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_deletedById_fkey;
    DROP INDEX IF EXISTS reviews_isDeleted_deletedById_idx;
    ALTER TABLE reviews DROP COLUMN IF EXISTS isDeleted, deletedAt, deletionReason, deletedById;
  "
docker compose -f infra/docker/docker-compose.dev.yml exec -T app \
  npx prisma migrate resolve --rolled-back 20260612_182000_review_soft_delete
docker compose -f infra/docker/docker-compose.dev.yml exec -T app \
  npx prisma generate
```

E reverter `prisma/schema.prisma` com `git checkout prisma/schema.prisma`.
