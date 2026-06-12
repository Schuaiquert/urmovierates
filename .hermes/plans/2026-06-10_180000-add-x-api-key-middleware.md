# X-API-Key Middleware Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a second authentication layer (`X-API-Key` header) to URMovieRates' Express API, applied to all protected routes (movies, reviews, favorites, users) on top of the existing JWT layer, with Swagger documentation and fail-fast environment validation.

**Architecture:** A new `apiKey` module under `src/apiKey/` houses the config validator, security constants, secure-comparison utility, and Express middleware. The middleware is mounted globally in `src/app.ts` **after** the public bypass list (login/register/refresh/forgot-password/reset-password/health/api-docs) and **before** the protected route mount points. JWT stays untouched — `X-API-Key` is a complementary gate. Swagger gains a new `apiKeyAuth` security scheme declared in `src/config/swagger.ts` and referenced via `security: - apiKeyAuth: []` on protected routes.

**Tech Stack:** Node.js 20, TypeScript 5.3, Express 4.18, `helmet` (already in stack), `crypto.timingSafeEqual` (Node built-in, no new dep), `swagger-jsdoc` (already in stack).

---

## Current State

```
src/
├── app.ts                       # Express bootstrap — mounts /api/auth, /api/movies, etc.
├── server.ts                    # connectDB + listen
├── config/
│   ├── database.ts              # Prisma
│   └── swagger.ts               # only bearerAuth declared
├── middlewares/
│   ├── authMiddleware.ts        # authenticate(), requireRole() — JWT
│   ├── authValidators.ts
│   ├── errorHandler.ts          # AppError class, JSON shape { error, code }
│   └── validators.ts
├── routes/
│   ├── authRoutes.ts            # /api/auth/* — login, register, refresh, forgot/reset, /me
│   ├── movieRoutes.ts           # /api/movies/* — admin write, public read
│   ├── userRoutes.ts            # /api/users
│   ├── reviewRoutes.ts          # /api/reviews/*
│   └── favoriteRoutes.ts        # /api/favorites/* — all authenticated
├── utils/
│   ├── crypto.ts                # randomToken helper (existing)
│   ├── jwt.ts
│   └── logger.ts                # winston
└── types/index.ts

infra/docker/dev/docker-compose.yml   # app service env: only NODE_ENV, DATABASE_URL, REDIS_URL
infra/docker/staging/docker-compose.yml
infra/docker/prod/docker-compose.yml
.env.example                              # no API_KEY line today
```

**Public routes (must NOT require X-API-Key):**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET  /health`
- `GET  /api-docs`, `GET /api-docs/*` (Swagger UI + assets)
- `GET  /` (root, not currently defined — leave open)

**Protected routes (must require X-API-Key):**
- `/api/movies/*` (all)
- `/api/reviews/*` (all)
- `/api/favorites/*` (all)
- `/api/users/*` (all)
- `GET /api/auth/me`, `PUT /api/auth/me`, `DELETE /api/auth/me` (authenticated profile ops)

**Design decisions baked in:**
1. Single shared key from env (multi-key / per-client rotation is out of scope — YAGNI).
2. Fail-fast on missing `API_KEY` at boot — server won't start without it.
3. Use `crypto.timingSafeEqual` for comparison (constant-time, prevents timing attacks).
4. Header value must match exactly — no trimming, no prefix support (avoid ambiguity).
5. Keep the existing `AppError` class for error responses (401 / 403 with `code`).
6. No DB schema change required.
7. Docker compose files updated to inject `API_KEY` from host env so each env can have its own.

---

## Tasks

### Task 1: Add `API_KEY` to environment template and example

**Objective:** Document the new variable so contributors know to set it.

**Files:**
- Modify: `.env.example`
- Modify: `infra/docs/architecture/environment-vars.md`

**Step 1: Append to `.env.example`**

Append after the last line:
```env

# API Key — sent in `X-API-Key` header to every protected route
# Generate with: openssl rand -hex 32
API_KEY=your-api-key-min-32-chars-recommended
```

**Step 2: Append to `infra/docs/architecture/environment-vars.md`**

Add a new section after "## Variáveis Opcionais":
```markdown
---

## API Key (`X-API-Key`)

Todas as rotas protegidas exigem o header `X-API-Key` com o valor desta variável.
Rotas públicas (auth/login, auth/register, auth/refresh, auth/forgot-password,
auth/reset-password, /health, /api-docs) **não** exigem.

```env
# Gerar com: openssl rand -hex 32
API_KEY=your-api-key-min-32-chars-recommended
```

A aplicação **não inicializa** se `API_KEY` estiver ausente ou com menos de 16 caracteres.
```

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add .env.example infra/docs/architecture/environment-vars.md
git commit -m "docs(env): document API_KEY for X-API-Key auth"
```

---

### Task 2: Create the `apiKey` config module with fail-fast validation

**Objective:** Centralize env loading + validation for the API key. Boot must fail with a clear message if `API_KEY` is missing or too weak.

**Files:**
- Create: `src/apiKey/config.ts`

**Step 1: Write the file**

```ts
// src/apiKey/config.ts
import logger from '../utils/logger';

export const API_KEY_HEADER = 'X-API-Key';
export const MIN_API_KEY_LENGTH = 16;

export class ApiKeyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyConfigError';
  }
}

function loadAndValidateApiKey(): string {
  const raw = process.env.API_KEY;

  if (!raw || raw.trim().length === 0) {
    throw new ApiKeyConfigError(
      'API_KEY is not set. Generate one with `openssl rand -hex 32` and add it to your .env file.'
    );
  }

  const key = raw.trim();

  if (key.length < MIN_API_KEY_LENGTH) {
    throw new ApiKeyConfigError(
      `API_KEY is too short (${key.length} chars). Minimum is ${MIN_API_KEY_LENGTH}.`
    );
  }

  // Reject placeholder / obvious-default values to prevent accidental deploy.
  const forbidden = ['changeme', 'your-api-key', 'example', 'placeholder', 'todo'];
  if (forbidden.some((needle) => key.toLowerCase().includes(needle))) {
    throw new ApiKeyConfigError(
      'API_KEY looks like a placeholder. Replace it with a real secret (openssl rand -hex 32).'
    );
  }

  return key;
}

// Loaded eagerly at module import — fail-fast at process start.
export const API_KEY: string = (() => {
  try {
    return loadAndValidateApiKey();
  } catch (err) {
    if (err instanceof ApiKeyConfigError) {
      logger.error(`❌ ${err.message}`);
      // Print to stderr as well so it shows up in Docker `docker logs`.
      // eslint-disable-next-line no-console
      console.error(`[FATAL] ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
})();
```

**Step 2: Verify it loads**

Open a shell and confirm a missing key crashes:
```bash
cd /home/projects/pedro/urmovierates
unset API_KEY
npx ts-node -e "import './src/apiKey/config'" 2>&1 | head -5
```
Expected: `[FATAL] API_KEY is not set...` and non-zero exit code.

Now set a key and confirm it loads silently:
```bash
cd /home/projects/pedro/urmovierates
API_KEY="$(openssl rand -hex 32)" npx ts-node -e "import './src/apiKey/config'; console.log('OK')"
```
Expected: `OK` (then the process exits; no fatal message).

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add src/apiKey/config.ts
git commit -m "feat(apiKey): add fail-fast config module for X-API-Key"
```

---

### Task 3: Create the secure-comparison utility

**Objective:** Compare the provided header value with the env key in constant time so an attacker can't infer the key byte-by-byte from response latency.

**Files:**
- Create: `src/apiKey/secureCompare.ts`

**Step 1: Write the file**

```ts
// src/apiKey/secureCompare.ts
import { timingSafeEqual } from 'crypto';
import { API_KEY } from './config';

/**
 * Constant-time comparison of the candidate header value against the configured API_KEY.
 * Returns false for any structural mismatch (non-string, length mismatch, wrong content)
 * without leaking timing information beyond the length check.
 */
export function isValidApiKey(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || candidate.length === 0) {
    return false;
  }
  if (candidate.length !== API_KEY.length) {
    return false;
  }

  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(API_KEY, 'utf8');

  if (a.length !== b.length) {
    return false;
  }

  // timingSafeEqual requires equal-length buffers; we already enforced that above.
  return timingSafeEqual(a, b);
}
```

**Step 2: Sanity-check with a quick script**

```bash
cd /home/projects/pedro/urmovierates
API_KEY="abc123456789012345" npx ts-node -e "
import { isValidApiKey } from './src/apiKey/secureCompare';
console.log('exact:', isValidApiKey('abc123456789012345'));   // true
console.log('wrong:', isValidApiKey('abc123456789012346'));   // false
console.log('short:', isValidApiKey('abc'));                  // false
console.log('undef:', isValidApiKey(undefined));               // false
"
```
Expected output:
```
exact: true
wrong: false
short: false
undef: false
```

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add src/apiKey/secureCompare.ts
git commit -m "feat(apiKey): add constant-time comparison utility"
```

---

### Task 4: Create the Express middleware

**Objective:** Express middleware that reads `X-API-Key`, validates it, and returns the standard JSON error shape on failure.

**Files:**
- Create: `src/apiKey/middleware.ts`

**Step 1: Write the file**

```ts
// src/apiKey/middleware.ts
import { Request, Response, NextFunction } from 'express';
import { API_KEY_HEADER } from './config';
import { isValidApiKey } from './secureCompare';
import { AppError } from '../middlewares/errorHandler';

const HEADER_NAME_LC = API_KEY_HEADER.toLowerCase();

/**
 * Express middleware that requires a valid `X-API-Key` header.
 *
 * - 401 Unauthorized when the header is missing or not a non-empty string.
 * - 403 Forbidden when the header is present but does not match the configured key.
 *
 * Responses follow the project standard: { error: string, code: string }.
 */
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  // Express normalizes header names to lowercase. Use bracket access to be safe
  // regardless of casing in the spec.
  const raw = req.headers[HEADER_NAME_LC];

  if (raw === undefined || raw === null) {
    return next(new AppError('X-API-Key header is required', 401, 'API_KEY_MISSING'));
  }

  // Reject non-string, arrays, etc. (e.g. duplicated headers end up as string[]).
  if (typeof raw !== 'string' || raw.length === 0) {
    return next(new AppError('X-API-Key header is invalid', 401, 'API_KEY_INVALID'));
  }

  if (!isValidApiKey(raw)) {
    return next(new AppError('Invalid X-API-Key', 403, 'API_KEY_FORBIDDEN'));
  }

  return next();
}

export default apiKeyAuth;
```

**Step 2: Type-check**

```bash
cd /home/projects/pedro/urmovierates
npx tsc --noEmit
```
Expected: no errors.

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add src/apiKey/middleware.ts
git commit -m "feat(apiKey): add express middleware with 401/403 JSON responses"
```

---

### Task 5: Create a barrel index for the `apiKey` module

**Objective:** Single import surface (`import { apiKeyAuth, API_KEY_HEADER } from '@/apiKey'`) keeps callers clean and decouples them from internal file layout.

**Files:**
- Create: `src/apiKey/index.ts`

**Step 1: Write the file**

```ts
// src/apiKey/index.ts
export { apiKeyAuth, default } from './middleware';
export { API_KEY, API_KEY_HEADER, MIN_API_KEY_LENGTH, ApiKeyConfigError } from './config';
export { isValidApiKey } from './secureCompare';
```

**Step 2: Type-check**

```bash
cd /home/projects/pedro/urmovierates
npx tsc --noEmit
```
Expected: no errors.

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add src/apiKey/index.ts
git commit -m "feat(apiKey): add barrel export"
```

---

### Task 6: Define the public-route bypass list and wire middleware into Express

**Objective:** Mount `apiKeyAuth` globally so all routes are gated, then carve out the documented public routes (auth login/register/refresh/forgot/reset, /health, /api-docs).

**Files:**
- Modify: `src/app.ts`

**Step 1: Update `src/app.ts`**

Replace the file contents with:

```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import errorHandler from './middlewares/errorHandler';
import logger from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { apiKeyAuth, API_KEY_HEADER } from './apiKey';
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';
import reviewRoutes from './routes/reviewRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

// Security & Performance middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// ---------------------------------------------------------------------------
// Public endpoints (no X-API-Key required).
// Order matters: these must be registered BEFORE the global apiKeyAuth gate.
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger UI + its static assets (served by swagger-ui-express).
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public auth flows.
app.use('/api/auth/login', (_req, _res, next) => next());
app.use('/api/auth/register', (_req, _res, next) => next());
app.use('/api/auth/refresh', (_req, _res, next) => next());
app.use('/api/auth/forgot-password', (_req, _res, next) => next());
app.use('/api/auth/reset-password', (_req, _res, next) => next());

// ---------------------------------------------------------------------------
// X-API-Key gate — applied to everything mounted below this line.
// /api/auth/me and /api/auth/<public-flows> live under the same /api/auth
// router, so we need a per-path bypass instead of mounting the auth router
// wholesale before the gate. See Task 7 for the auth-routes split.
// ---------------------------------------------------------------------------
app.use(apiKeyAuth);

// Routes (protected by X-API-Key + (where applicable) JWT)
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Surfaces the configured header name in `app.locals` for ad-hoc introspection
// (e.g. tests). Not used by middleware itself.
app.locals.apiKeyHeader = API_KEY_HEADER;

export default app;
```

> **Wait — there's a bug in the bypass list above.** The bypass `app.use('/api/auth/login', ...)` would only match the exact `login` path; deeper routes like `/api/auth/login/extra` would still hit it, but `/api/auth/me` would NOT be matched and would correctly fall through to the gate. However, the noop `app.use(path, next)` is a wart — it just calls `next()` with no logic. That works but reads as dead code. The cleaner approach in Task 7 splits the auth routes into public + protected sub-routers. **For now, keep this task as a working draft; Task 7 will replace the bypass block with the proper split.**

**Step 2: Type-check**

```bash
cd /home/projects/pedro/urmovierates
npx tsc --noEmit
```
Expected: no errors.

**Step 3: Commit (temporary, will be amended in Task 7)**

```bash
cd /home/projects/pedro/urmovierates
git add src/app.ts
git commit -m "feat(app): gate all routes with X-API-Key (wip bypass, fixed next task)"
```

---

### Task 7: Split `authRoutes` into public + protected sub-routers

**Objective:** Replace the noop-path bypass hack from Task 6 with a clean structural split: public auth flows go in `authPublicRoutes`, the protected `/me` endpoints stay in `authRoutes`.

**Files:**
- Modify: `src/routes/authRoutes.ts` (remove `/me` GET/PUT/DELETE)
- Create: `src/routes/authPublicRoutes.ts`
- Modify: `src/app.ts` (mount public router before gate, protected router after gate)

**Step 1: Create `src/routes/authPublicRoutes.ts`**

```ts
import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authValidators } from '../middlewares/authValidators';

const router = Router();

/**
 * Public auth flows — these do NOT require JWT *or* X-API-Key.
 * Keep this list in sync with `src/app.ts` documentation.
 */
router.post('/login', authValidators.login, authController.login.bind(authController));
router.post('/register', authValidators.register, authController.register.bind(authController));
router.post('/refresh', authValidators.refresh, authController.refresh.bind(authController));
router.post('/forgot-password', authValidators.forgotPassword, authController.forgotPassword.bind(authController));
router.post('/reset-password', authValidators.resetPassword, authController.resetPassword.bind(authController));

export default router;
```

> Note: Swagger JSDoc comments are kept in the original `authRoutes.ts` (for `/me`) so the public Swagger annotations on `/login` etc. remain there too. **Move the existing JSDoc blocks for the 5 public endpoints from `authRoutes.ts` into this new file** so the swagger-jsdoc scanner picks them up from here instead. The annotation blocks currently sit above each `router.post('/login', ...)` line — copy them unchanged.

**Step 2: Trim `src/routes/authRoutes.ts`**

Remove the 5 public routes and keep only the `/me` ones. Resulting file should look like:

```ts
import { Router } from 'express';
import { authController } from '../controllers/authController';
import { userValidators, validate } from '../middlewares/validators';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Updated user profile }
 *       401: { $ref: '#/components/schemas/Unauthorized' }
 *   delete:
 *     summary: Delete the authenticated user's account
 *     tags: [Auth]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       204: { description: Account deleted }
 *       401: { $ref: '#/components/schemas/Unauthorized' }
 */
router.get('/me', authenticate, authController.me.bind(authController));
router.put(
  '/me',
  authenticate,
  userValidators.updateMe,
  validate,
  authController.updateMe.bind(authController)
);
router.delete('/me', authenticate, authController.deleteMe.bind(authController));

export default router;
```

**Step 3: Move the 5 public-route JSDoc blocks**

Cut the JSDoc blocks (lines 11-41, 46-90, 95-118, 123-141, 146-172 of the current `authRoutes.ts`) and paste them above the corresponding routes in `authPublicRoutes.ts`. Each block's `paths:` reference already points to `/api/auth/<endpoint>` which is correct.

**Step 4: Replace the bypass block in `src/app.ts`**

Replace lines 33-39 (the noop bypasses) and the import line for `authRoutes` with:

```ts
import authPublicRoutes from './routes/authPublicRoutes';
import authRoutes from './routes/authRoutes';
```

And replace the public-bypass block:

```ts
// Public auth flows (no X-API-Key, no JWT).
app.use('/api/auth', authPublicRoutes);
```

**Step 5: Type-check**

```bash
cd /home/projects/pedro/urmovierates
npx tsc --noEmit
```
Expected: no errors.

**Step 6: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add src/routes/authRoutes.ts src/routes/authPublicRoutes.ts src/app.ts
git commit -m "refactor(auth): split routes into public + protected sub-routers"
```

---

### Task 8: Update Swagger spec to declare `apiKeyAuth`

**Objective:** Surface the new auth scheme in Swagger UI so the "Authorize" button exposes an `X-API-Key` field that gets sent on every protected request.

**Files:**
- Modify: `src/config/swagger.ts`

**Step 1: Replace the file**

```ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'urmovierates API',
      version: '1.0.0',
      description:
        'REST API for movie reviews and ratings. Two authentication layers: (1) `X-API-Key` header on every protected route, (2) JWT Bearer token from /api/auth/login for user-scoped operations.',
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT access token returned by /api/auth/login or /api/auth/refresh. Use the form "Bearer {token}".',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description:
            'Shared secret defined in the API_KEY environment variable. Send as `X-API-Key: <value>`. Required for all routes except /api/auth/{login,register,refresh,forgot-password,reset-password}, /health and /api-docs.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
        Unauthorized: {
          description: 'Missing or invalid token / API key',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              examples: {
                auth_missing: {
                  summary: 'Missing X-API-Key',
                  value: { error: 'X-API-Key header is required', code: 'API_KEY_MISSING' },
                },
                auth_invalid: {
                  summary: 'Invalid X-API-Key',
                  value: { error: 'Invalid X-API-Key', code: 'API_KEY_FORBIDDEN' },
                },
                token_missing: {
                  summary: 'Missing JWT',
                  value: { error: 'Authentication required', code: 'AUTH_MISSING' },
                },
              },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Insufficient permissions', code: 'FORBIDDEN' },
            },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

**Step 2: Type-check**

```bash
cd /home/projects/pedro/urmovierates
npx tsc --noEmit
```

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add src/config/swagger.ts
git commit -m "feat(swagger): declare apiKeyAuth security scheme + examples"
```

---

### Task 9: Add `apiKeyAuth: []` to all protected route JSDoc blocks

**Objective:** Make every protected operation in Swagger require both `apiKeyAuth` and (where applicable) `bearerAuth`. Public routes stay with no `security` block.

**Files:**
- Modify: `src/routes/movieRoutes.ts`
- Modify: `src/routes/reviewRoutes.ts`
- Modify: `src/routes/favoriteRoutes.ts`
- Modify: `src/routes/userRoutes.ts`

**Step 1: `movieRoutes.ts`**

Add a top-level JSDoc under the existing schemas block, then add the security line inside each operation. The route definitions stay identical — only the JSDoc changes. In every `@swagger` block (POST /, POST /genres, PUT /:id, DELETE /:id), add:

```yaml
    security:
      - apiKeyAuth: []
      - bearerAuth: []
```

The public reads (GET /, GET /:id, GET /years, GET /genres) get no `security` field — they're public reads protected only by the gate, which Swagger doesn't model per-operation for the apiKey-in-header case (it would force the user to click Authorize even for public reads). To document that `X-API-Key` IS required, add a top-level `security: - apiKeyAuth: []` on the file's schemas header and rely on the Authorize button at the top of the page.

Simpler rule: add `security: - apiKeyAuth: []` to every operation that already uses `bearerAuth` (i.e. the admin / write ops). Leave read-only GET operations without `security` so they show as anonymous in Swagger (matches the actual runtime: any caller with the API key can call them; Swagger just doesn't force-set the header on the try-it form for unflagged operations).

**Step 2: `reviewRoutes.ts`**

Same rule. Add `apiKeyAuth: []` to POST /, PUT /:id, DELETE /:id, GET /movies/:movieId, GET /movies/:movieId/stats, GET /:id.

**Step 3: `favoriteRoutes.ts`**

All operations are authenticated. Add `apiKeyAuth: []` to every operation.

**Step 4: `userRoutes.ts`**

Both reads get `apiKeyAuth: []`.

**Step 5: Type-check + boot the server briefly**

```bash
cd /home/projects/pedro/urmovierates
npx tsc --noEmit
```
Expected: no errors.

**Step 6: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add src/routes/movieRoutes.ts src/routes/reviewRoutes.ts src/routes/favoriteRoutes.ts src/routes/userRoutes.ts
git commit -m "docs(swagger): declare apiKeyAuth requirement on protected routes"
```

---

### Task 10: Update Docker compose files to inject `API_KEY`

**Objective:** Each compose environment must forward `API_KEY` from the host. Read it from the shell environment, never inline a real secret in YAML.

**Files:**
- Modify: `infra/docker/dev/docker-compose.yml`
- Modify: `infra/docker/staging/docker-compose.yml`
- Modify: `infra/docker/prod/docker-compose.yml`

**Step 1: In each file, find the `app` service `environment:` block and add:**

```yaml
      - API_KEY=${API_KEY}
```

This uses Docker Compose's `${VAR}` shell interpolation — at `docker-compose up` time it reads `API_KEY` from the shell that runs the command, failing with a clear error if unset.

**Step 2: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add infra/docker/dev/docker-compose.yml infra/docker/staging/docker-compose.yml infra/docker/prod/docker-compose.yml
git commit -m "chore(docker): forward API_KEY from host env to all compose services"
```

---

### Task 11: Manual end-to-end smoke test (curl + Insomnia/Postman)

**Objective:** Verify the gate works against a running server. No automated test framework in this repo (tests/ is empty), so this task is a manual verification script.

**Files:** none (instructions only — run inline).

**Step 1: Boot the server with a known key**

```bash
cd /home/projects/pedro/urmovierates
export API_KEY="$(openssl rand -hex 32)"
# Required for the rest of the server to boot
export DATABASE_URL="postgresql://postgres:***@localhost:5432/urmovierates"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="local-dev-jwt-secret-32+chars-xxxxxxxxxxxxxxxx"
npm run dev
```

Server logs should show `🚀 Server running on port 3000` and **no** `❌ API_KEY` fatal message.

**Step 2: Verify the gate**

a) Missing key on a protected route → 401 API_KEY_MISSING
```bash
curl -i http://localhost:3000/api/movies
```
Expected: `HTTP/1.1 401`, body `{"error":"X-API-Key header is required","code":"API_KEY_MISSING"}`.

b) Wrong key → 403 API_KEY_FORBIDDEN
```bash
curl -i -H "X-API-Key: wrong" http://localhost:3000/api/movies
```
Expected: `HTTP/1.1 403`, body `{"error":"Invalid X-API-Key","code":"API_KEY_FORBIDDEN"}`.

c) Correct key → 200 (or whatever movies list returns)
```bash
curl -i -H "X-API-Key: $API_KEY" http://localhost:3000/api/movies
```
Expected: `HTTP/1.1 200 OK` with a JSON body.

d) Public route without key → 200/201 (no gate)
```bash
curl -i -X POST -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password123"}' \
  http://localhost:3000/api/auth/register
```
Expected: 201 (or 409 if email exists) — **no** API_KEY_MISSING error.

e) Health without key → 200
```bash
curl -i http://localhost:3000/health
```
Expected: `{"status":"ok",...}`.

f) Swagger UI without key → 200 (HTML page)
```bash
curl -i http://localhost:3000/api-docs/
```
Expected: `HTTP/1.1 200` with `text/html` body.

g) Swagger JSON declares `apiKeyAuth`
```bash
curl -s http://localhost:3000/api-docs/swagger-ui-init.js | head -c 200
# Or for the raw spec:
curl -s http://localhost:3000/api-docs.json
# (some setups expose at /api-docs/swagger-ui-init.js — adjust if missing)
```
Expected: in the JSON spec, `components.securitySchemes.apiKeyAuth` is present with `type: apiKey, in: header, name: X-API-Key`.

**Step 3: Insomnia / Postman import**

Use the live Swagger spec as the import source:
- Insomnia: `Application > Preferences > Data > Import Data > From URL > http://localhost:3000/api-docs.json`
- Postman: `Import > Link > http://localhost:3000/api-docs.json`

Then on the collection root, set two auth helpers:
- Bearer Token: `{{ token }}` (filled in after login)
- Header `X-API-Key`: `<paste your API_KEY>`

Use environment variable `API_KEY` in Postman so it propagates to every request.

**Step 4: Verify JWT coexistence**

Login, then call `/api/auth/me` with both headers:
```bash
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  http://localhost:3000/api/auth/login | jq -r .data.token)

curl -i -H "X-API-Key: $API_KEY" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/me
```
Expected: 200 with the user profile. Without `X-API-Key`, expect 401 API_KEY_MISSING. Without the Bearer token, expect 401 AUTH_MISSING (the JWT layer rejects after the API key passes). Both layers fire in sequence.

---

### Task 12: Update README + .gitignore to include `.env.local` reminder

**Objective:** Tell the next developer how to set up the new key and remind them not to commit it.

**Files:**
- Modify: `README.md`
- Modify: `.gitignore` (no change needed if `.env` already ignored — confirm)

**Step 1: Check `.gitignore`**

```bash
cd /home/projects/pedro/urmovierates
cat .gitignore
```
Expected to already include `.env`. If absent, add it.

**Step 2: Add a section to `README.md` after the existing "Variáveis de Ambiente" table**

```markdown
### X-API-Key

Toda requisição a rota protegida deve incluir o header `X-API-Key`. Defina o valor em
`.env`:

```env
API_KEY=$(openssl rand -hex 32)
```

Rotas **públicas** (não exigem a chave):
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /health`
- `GET /api-docs`

Todas as demais exigem o header. A aplicação **não inicializa** sem `API_KEY`.

#### Exemplo Insomnia/Postman

Header global da collection:

| Header        | Value                          |
|---------------|--------------------------------|
| `X-API-Key`   | `<valor da variável API_KEY>`  |
| `Authorization` | `Bearer <token retornado por /api/auth/login>` |
```

**Step 3: Commit**

```bash
cd /home/projects/pedro/urmovierates
git add README.md .gitignore
git commit -m "docs(readme): document X-API-Key usage and Insomnia example"
```

---

## Validation Summary

After all tasks, the following invariants must hold:

1. `npx tsc --noEmit` exits 0.
2. `npm run dev` exits with `❌ API_KEY is not set...` when `API_KEY` env is missing.
3. `curl -i http://localhost:3000/api/movies` → 401 API_KEY_MISSING.
4. `curl -i -H "X-API-Key: wrong" http://localhost:3000/api/movies` → 403 API_KEY_FORBIDDEN.
5. `curl -i -H "X-API-Key: $API_KEY" http://localhost:3000/api/movies` → 200.
6. `curl -i -X POST http://localhost:3000/api/auth/login -d ...` → 200/401 (no API key needed).
7. `curl -i http://localhost:3000/health` → 200 (no API key needed).
8. `curl -i http://localhost:3000/api-docs/` → 200 HTML (no API key needed).
9. Swagger spec at `/api-docs.json` includes `apiKeyAuth` in `securitySchemes` and `apiKeyAuth: []` in the `security` block of every protected operation.
10. JWT login still works; `/api/auth/me` requires both `X-API-Key` (returns 401 API_KEY_MISSING without) and Bearer token (returns 401 AUTH_MISSING if key is right but token is missing).
11. `docker-compose up` in any of `infra/docker/{dev,staging,prod}/` fails with a clear `API_KEY not set` error if the host env var is empty.

---

## Files Touched

| File                                     | Action   | Why                                                |
|------------------------------------------|----------|----------------------------------------------------|
| `.env.example`                           | modify   | document `API_KEY`                                 |
| `infra/docs/architecture/environment-vars.md` | modify | full env reference                                 |
| `src/apiKey/config.ts`                   | create   | fail-fast env loader                               |
| `src/apiKey/secureCompare.ts`            | create   | `timingSafeEqual` helper                           |
| `src/apiKey/middleware.ts`               | create   | Express `apiKeyAuth`                               |
| `src/apiKey/index.ts`                    | create   | barrel export                                      |
| `src/app.ts`                             | modify   | mount gate + public sub-router                     |
| `src/routes/authRoutes.ts`               | modify   | keep only `/me`                                    |
| `src/routes/authPublicRoutes.ts`         | create   | login/register/refresh/forgot/reset                |
| `src/config/swagger.ts`                  | modify   | declare `apiKeyAuth` scheme                        |
| `src/routes/movieRoutes.ts`              | modify   | add `apiKeyAuth: []` JSDoc                         |
| `src/routes/reviewRoutes.ts`             | modify   | add `apiKeyAuth: []` JSDoc                         |
| `src/routes/favoriteRoutes.ts`           | modify   | add `apiKeyAuth: []` JSDoc                         |
| `src/routes/userRoutes.ts`               | modify   | add `apiKeyAuth: []` JSDoc                         |
| `infra/docker/dev/docker-compose.yml`    | modify   | forward `API_KEY`                                  |
| `infra/docker/staging/docker-compose.yml`| modify   | forward `API_KEY`                                  |
| `infra/docker/prod/docker-compose.yml`   | modify   | forward `API_KEY`                                  |
| `README.md`                              | modify   | usage section                                      |
| `.gitignore`                             | confirm  | `.env` already ignored                             |

No DB schema, no Prisma migration, no new npm dep.

---

## Risks, Tradeoffs, and Open Questions

1. **Single shared key vs per-client keys.** The plan uses a single `API_KEY`. That's the simplest mental model and matches the "internal service" use case. If you ever need per-client keys (e.g. mobile app vs partner integration), the natural extension is a `api_keys` table with a hash column + `last_used_at` and a small lookup-and-compare function — but that's out of scope for this round (YAGNI).

2. **Header on every request vs caching.** `X-API-Key` is checked on every request. For an internal API at expected QPS this is fine (single `timingSafeEqual` is ~µs). If you need to revoke a leaked key, restart the service with the new env value — there's no rotation API in scope.

3. **No rate limiting at the API-key layer.** `express-rate-limit` is already in `package.json` but the current `app.ts` doesn't mount it. If/when it's added, the rate limiter should sit *before* `apiKeyAuth` so it can shed load cheaply on bad keys (otherwise an attacker spamming wrong keys still pays the full `timingSafeEqual` per request — cheap but wasteful). Leave a `TODO` in `app.ts` for that.

4. **Swagger security on read endpoints.** Public GETs (movies list, movie detail, genres, years) require `X-API-Key` at runtime but the JSDoc doesn't list `security:` on them, so the Swagger "Try it out" form won't pre-fill the header. Two options: (a) add `security: - apiKeyAuth: []` to every operation including reads — extra click friction; (b) keep reads un-annotated and document the gap in the README. Plan goes with (b). Open question for the user: do you want (a)?

5. **No automated test suite.** The repo's `tests/` folder is empty. The plan's verification is a manual curl matrix. If you want Jest+supertest tests for the middleware, that's an extra task — say the word and I'll add it.

6. **Plain env var vs secrets manager.** The plan reads `API_KEY` from `process.env` like every other secret in the project. For production, the expectation is that the orchestrator (Docker host, k8s, ECS) injects it from a secrets manager. No code change needed to plug into Vault / SSM / Secrets Manager — just a different `docker-compose.yml` `environment:` source.

7. **`req.headers` casing.** Express normalizes header names to lowercase, so `req.headers['x-api-key']` is correct. The middleware uses `API_KEY_HEADER.toLowerCase()` derived from the constant in `config.ts`, so the canonical name lives in one place.
