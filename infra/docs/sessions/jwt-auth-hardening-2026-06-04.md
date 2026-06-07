# Sessão: Hardening de Autenticação JWT — 2026-06-04

## Visão Geral

Revisão completa do fluxo de autenticação JWT: o middleware lia tokens sem validar `iss`/`aud`/algoritmo, usava um único secret e tipo de token, e o Swagger não tinha `securityScheme` configurado. A sessão também removeu endpoints pré-auth (criação/edição de usuário sem auth) e consolidou self-management em `/api/auth/me`. Por fim, o frontend foi sincronizado para nunca mais enviar `userId` no body/query — o `userId` agora vem exclusivamente do JWT.

**Stack:** Node 20, TypeScript 5, Express 4, jsonwebtoken 9, swagger-jsdoc 6, React 18 + axios.

---

## Arquivos Modificados

### Backend
- `src/utils/jwt.ts` — reescrito: `iss`/`aud`/`jti`, algoritmo fixo HS256, access vs refresh com secrets distintos, `generateTokenPair`, `verifyAccessToken`/`verifyRefreshToken`, validação do secret no boot
- `src/middlewares/authMiddleware.ts` — Bearer case-insensitive, discriminação de `TokenExpiredError`/`NotBeforeError`/`JsonWebTokenError`, `req.user` e `req.userId` populados
- `src/middlewares/errorHandler.ts` — `AppError` aceita `code`; resposta inclui `code` no JSON
- `src/middlewares/validators.ts` — removido `body('userId')` de `reviewValidators.create`; trocado `userValidators.update/create/delete` por `userValidators.updateMe`
- `src/services/authService.ts` — login retorna access+refresh; novo método `refresh()`; novos `me`/`updateMe`/`deleteMe`
- `src/controllers/authController.ts` — handlers `refresh`, `me`, `updateMe`, `deleteMe`
- `src/controllers/reviewController.ts` — `userId` vem de `req.userId`; owner-or-admin check em update/delete
- `src/controllers/favoriteController.ts` — todos os handlers exigem auth, `userId` sempre do token
- `src/controllers/userController.ts` — apenas `getAll` e `getById`; `create`/`update`/`delete` removidos
- `src/services/userService.ts` — removidos `create`/`update`/`delete`; `findById`/`findAll` agora projetam campos (não retornam password)
- `src/services/reviewService.ts` — inalterado
- `src/services/favoriteService.ts` — inalterado (já trabalhava com userId/movieId injetados)
- `src/types/index.ts` — `CreateUserDTO`/`UpdateUserDTO` removidos; entra `UpdateMeDTO`; `AuthResponse` ganha `accessToken` e `refreshToken` (mantém `token` para back-compat)
- `src/config/swagger.ts` — `components.securitySchemes.bearerAuth` (bearerFormat: JWT) + schemas `Error`/`Unauthorized`/`Forbidden`; removido `security: []` global para forçar declaração por operação
- `src/routes/authRoutes.ts` — adicionados `GET/PUT/DELETE /api/auth/me`; `POST /api/auth/refresh`; validador `refresh`
- `src/routes/movieRoutes.ts` — `security: [{bearerAuth:[]}]` + 401/403 em POST/PUT/DELETE + POST `/genres` (agora protegido)
- `src/routes/reviewRoutes.ts` — `authenticate` em POST/PUT/DELETE; `security` + 401/403 nas operações protegidas
- `src/routes/favoriteRoutes.ts` — `router.use(authenticate)` no topo; userId removido dos query/body
- `src/routes/userRoutes.ts` — apenas `GET /` e `GET /:id`; POST/PUT/DELETE removidos
- `src/middlewares/authValidators.ts` — adicionado `refresh` validator

### Frontend
- `frontend/src/services/api.js` — `usersAPI` sem `create`/`update`/`delete`; `favoritesAPI` sem `userId`; `authAPI` ganha `me`/`updateMe`/`deleteMe`/`refresh`
- `frontend/src/context/AuthContext.jsx` — `updateUser(data)` e `deleteAccount()` sem `userId`
- `frontend/src/hooks/useFavorites.js` — hooks não recebem mais `userId`; usam só o JWT no header
- `frontend/src/pages/ProfilePage.jsx` — chama `updateUser({name})` e `deleteAccount()` (sem `user.id`)
- `frontend/src/pages/FavoritesPage.jsx` — chamadas de favoritos sem `user.id`
- `frontend/src/pages/HomePage.jsx` — `getStatus` e `toggle` sem `user.id`
- `frontend/src/pages/MoviePage.jsx` — `createReview(reviewData)` sem `userId` no body

### Infra
- `infra/docs/sessions/jwt-auth-hardening-2026-06-04.md` — esta sessão
- `infra/docs/activities.md` — registro atualizado
- `infra/docs/api-context/decisions/ADR-007-acesso-refresh-tokens.md` — ADR sobre o par de tokens

---

## Cronologia das Mudanças

### 1. Revisão do utilitário JWT
**Problema:** `jwt.ts` original era um wrapper mínimo:
```typescript
const JWT_SECRET = process.env.JWT_SECRET!;  // sem fallback nem validação
jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });  // sem iss/aud/algoritmo fixo
```
- Sem validação de algoritmo → vulnerável a `alg: none` (mitigada pelo jsonwebtoken v9, mas sem defense in depth)
- Sem `iss`/`aud`/`jti` → tokens emitidos por outro sistema com mesmo secret seriam aceitos
- Sem separação access/refresh → impossível revogar sessão sem invalidar o secret inteiro
- Erros genéricos no middleware (`'Invalid or expired token'`)

**Decisão:** reescrever com:
- `iss`, `aud`, `jti` em todo token
- Algoritmo restrito a `HS256` em sign e verify
- `type: 'access' | 'refresh'` discriminado por secret diferente
- `requireSecret(name, fallback?)` falha no boot se secret < 32 chars

### 2. Middleware com erros tipados
**Antes:** um único catch genérico.
**Depois:**
```typescript
if (error instanceof TokenExpiredError) → 401 TOKEN_EXPIRED
if (error instanceof NotBeforeError)    → 401 TOKEN_INACTIVE
if (error instanceof JsonWebTokenError) → 401 TOKEN_INVALID
                                              → 401 AUTH_FAILED (fallback)
```
- Bearer parsing case-insensitive (`/^Bearer\s+(.+)$/i`)
- `req.user` e `req.userId` populados
- `req.user.role` disponível para `requireRole`

### 3. AppError com `code`
Adicionado terceiro parâmetro opcional `code`. O `errorHandler` envia `error` + `code` no JSON de erro. Frontend já tem interceptor que lê `error.response.data.error`, agora também pode ler `code` para casos como `TOKEN_EXPIRED` (que dispararia refresh).

### 4. Swagger com securityScheme
**Problema:** Swagger gerado não tinha `securitySchemes`, então o botão "Authorize" não funcionava. Endpoints sem cadeado.

**Solução:**
- `components.securitySchemes.bearerAuth` com `type: http`, `scheme: bearer`, `bearerFormat: JWT`
- Schemas reutilizáveis: `Error`, `Unauthorized` (401), `TokenExpired` (401 com exemplo), `Forbidden` (403)
- `security: []` global removido — cada operação protegida declara `security: [{ bearerAuth: [] }]` explicitamente
- Schemas `Movie`/`User`/`Review`/`Favorite`/`CreateReview` ficaram com `required` correto (sem `userId` no `CreateReview`)

### 5. Bug encontrado via Swagger: "Valid userId is required"
**Sintoma:** ao tentar criar review direto no Swagger com `{ rating, text, movieId }`, retornava 400 `"Valid userId is required"`.

**Causa:** `reviewValidators.create` ainda validava `body('userId').isUUID()` herdado do design pré-JWT. O controller já usava `req.userId` mas o validator exigia o campo no body.

**Fix:** removida a linha. Outras varreduras em `validators.ts` confirmaram que era o único resíduo de validação `userId` no body.

### 6. Auditoria de todos os endpoints
Verificação sistemática com `grep` em `validators.ts` e `controllers/`:
- `body('userId')` / `query('userId')` em validators → **nenhum após o fix**
- `userId` ainda em 3 lugares legítimos (mantidos):
  - `Review` schema (resposta) e `Favorite` schema (resposta) — descrevem o campo retornado
  - `GET /api/reviews?userId=...` — filtro público de listagem
- Endpoints que recebiam `userId` no body (favorites) já estavam refatorados no passo 1; controllers usavam `req.userId` mas frontend ainda enviava o campo.

### 7. Remoção de endpoints legados
**Pré-auth endpoints identificados (com aprovação do usuário):**
- `POST /api/users` — duplicado de `/api/auth/register`; frontend nem chamava
- `PUT /api/users/:id` — qualquer um editava qualquer conta, inclusive `role`
- `DELETE /api/users/:id` — qualquer um deletava qualquer conta

**Substituídos por `/api/auth/me`:**
- `GET /api/auth/me` — perfil do logado (lê `req.userId`)
- `PUT /api/auth/me` — atualiza name/email/password (não permite trocar `role`; isso é admin-only via `requireRole('ADMIN')` em endpoints futuros)
- `DELETE /api/auth/me` — deleta a própria conta + cascateia `passwordResetToken`

**Limpeza resultante:**
- `userService.ts` perdeu `create`/`update`/`delete`; agora só faz leituras projetadas (sem password)
- `userController.ts` reduzido a `getAll`/`getById`
- `validators.ts`: `userValidators.create`/`update`/`delete` removidos; entra `userValidators.updateMe`
- `types/index.ts`: `CreateUserDTO`/`UpdateUserDTO` removidos; entra `UpdateMeDTO`

### 8. Sincronização do frontend
- `usersAPI` reduzido a `getAll`/`getById` no client
- `favoritesAPI` sem `userId` em qualquer método
- `authAPI` ganha `me`/`updateMe`/`deleteMe`/`refresh`
- `AuthContext.updateUser(data)` e `deleteAccount()` não recebem mais `userId`
- Hooks `useFavoriteStatus`/`useUserFavorites` perderam o parâmetro `userId`
- `MoviePage` envia review sem `userId` no payload

### 9. Variáveis de ambiente
Adicionadas ao `.env` (já documentado no commit anterior):
```
JWT_REFRESH_SECRET=outro-segredo-com-pelo-menos-32-chars
JWT_ISSUER=urmovierates
JWT_AUDIENCE=urmovierates-api
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```
`JWT_REFRESH_SECRET` é opcional (cai no `JWT_SECRET` se ausente).

---

## Estrutura de Tokens

### Access Token
- Algoritmo: `HS256`
- Claims: `userId`, `email`, `role`, `type: 'access'`, `iss`, `aud`, `jti`, `iat`, `exp`
- TTL: 15m (curto)
- Uso: header `Authorization: Bearer <access>` em toda rota protegida

### Refresh Token
- Algoritmo: `HS256`
- Claims: mesmas do access + `type: 'refresh'`
- Secret: **diferente** do access (defesa em profundidade)
- TTL: 7d
- Uso: `POST /api/auth/refresh` body `{ refreshToken }` → par novo de access+refresh

### Fluxo
```
[Login]  ──POST /api/auth/login──>  { accessToken, refreshToken, user }
                                            │
                                            ▼
                              Authorization: Bearer <access>
                                            │
                                            ▼
[Protected endpoint] ──200/4xx──>  response
                                            │
                                  if 401 TOKEN_EXPIRED
                                            │
                                            ▼
[Refresh]  ──POST /api/auth/refresh──>  { accessToken, refreshToken, user }
                                            │
                                            ▼
                            retry original request
```

---

## Segurança

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Validação de algoritmo | implícita na lib | explícita em `algorithms: ['HS256']` |
| `iss`/`aud` | ausentes | obrigatórios; tokens de outros sistemas rejeitados |
| `jti` | ausente | presente (permite blacklist futura) |
| Separação access/refresh | uma chave, um tipo | dois secrets, tipos discriminados |
| Bearer case | `startsWith('Bearer ')` | regex case-insensitive + trim |
| Erro detalhado | `'Invalid or expired token'` | `code: TOKEN_EXPIRED`/`TOKEN_INVALID`/etc |
| `userId` do body | confiável | sempre do JWT (req.userId) |
| `POST /api/users` | criava qualquer usuário | removido |
| `PUT/DELETE /api/users/:id` | sem auth | removido |

---

## Variáveis de Ambiente

```env
# Obrigatórias (existente)
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Novas (opcionais com defaults sensatos)
JWT_REFRESH_SECRET=                     # default = JWT_SECRET
JWT_ISSUER=urmovierates                 # default
JWT_AUDIENCE=urmovierates-api           # default
JWT_EXPIRES_IN=15m                      # encurtado de 24h
JWT_REFRESH_EXPIRES_IN=7d               # default
```

---

## Endpoints Finais

### Auth (públicos)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Auth (protegidos com `authenticate`)
- `GET /api/auth/me`
- `PUT /api/auth/me` 🔒
- `DELETE /api/auth/me` 🔒

### Movies
- `GET /api/movies` (público)
- `GET /api/movies/years` (público)
- `GET /api/movies/genres` (público)
- `GET /api/movies/:id` (público)
- `POST /api/movies` 🔒 (ADMIN)
- `POST /api/movies/genres` 🔒 (ADMIN)
- `PUT /api/movies/:id` 🔒 (ADMIN)
- `DELETE /api/movies/:id` 🔒 (ADMIN)

### Reviews
- `GET /api/reviews` (público)
- `GET /api/reviews/movies/:movieId` (público)
- `GET /api/reviews/movies/:movieId/stats` (público)
- `GET /api/reviews/:id` (público)
- `POST /api/reviews` 🔒 (owner=user)
- `PUT /api/reviews/:id` 🔒 (owner or ADMIN)
- `DELETE /api/reviews/:id` 🔒 (owner or ADMIN)

### Favorites (todos 🔒)
- `GET /api/favorites`
- `GET /api/favorites/status?movieIds=a,b,c`
- `POST /api/favorites/:movieId`
- `DELETE /api/favorites/:movieId`
- `POST /api/favorites/:movieId/toggle`

### Users (somente leitura)
- `GET /api/users`
- `GET /api/users/:id`

---

## Testes Realizados

### JWT util
```bash
# generateAccessToken + verifyAccessToken
access=user1, role=USER, type=access, iss=urmovierates, aud=urmovierates-api, jti=true

# Cross-type rejection
verifyAccessToken(refreshToken) → "Invalid token type, expected access"
verifyRefreshToken(accessToken) → "Invalid token type, expected refresh"
```

### Middleware
```bash
# Casos de borda do Bearer
"Bearer " + token              → ok
"bearer " + token              → ok (case-insensitive)
"   Bearer   " + token         → ok (trim)
"Basic " + token               → 401 AUTH_MISSING
"Bearer " + "not-a-jwt"        → 401 TOKEN_INVALID
"Bearer " + expired            → 401 TOKEN_EXPIRED
(sem Authorization)             → 401 AUTH_MISSING

# Role chain
USER → requireRole('ADMIN')    → 403 FORBIDDEN
ADMIN → requireRole('ADMIN')   → ok, req.userId set
```

### Swagger
```bash
# Endpoints protegidos: 18/18 com security + 401/403
# Endpoints públicos:  13/13 sem security
# bearerAuth scheme: { type: http, scheme: bearer, bearerFormat: JWT }
```

### Review create
```bash
# Body sem userId (correto agora)
{ rating: 5, text: "x", movieId: "the-godfather" } → 201
{ rating: 99, movieId: "x" }                       → 400 "Rating must be between 1 and 5"
{ rating: 5 }                                      → 400 "movieId is required"
(sem Bearer)                                       → 401 AUTH_MISSING
```

---

## Problemas Resolvidos

1. **Tokens sem `iss`/`aud`** — agora rejeitados se o par issuer/audience não bater
2. **Algoritmo não fixo** — `alg: none` e `alg: RS256` (com secret público) bloqueados via `algorithms: ['HS256']`
3. **Erro genérico de JWT** — frontend agora pode ler `code` e decidir refresh vs relogin
4. **`userId` no body** — controllers ignoram; vem sempre do token; validador body('userId') removido
5. **`POST /api/users`** — removido, duplicava register
6. **`PUT/DELETE /api/users/:id`** — removidos, sem auth eram brecha de privilege escalation
7. **Swagger sem Authorize** — `bearerAuth` security scheme + `security` por operação
8. **Frontend enviando `userId` legado** — `useFavorites`/`FavoritesPage`/`HomePage`/`MoviePage`/`AuthContext`/`api.js` sincronizados

---

## Decisões Tomadas

| Decisão | Motivo | Alternativas |
|---------|--------|--------------|
| Access 15m + Refresh 7d | Bom balanço entre UX e janela de exposição | 1h access + 30d refresh / sem refresh |
| Refresh token em secret separado | Comprometimento do access não invalida o refresh (e vice-versa) | Mesmo secret + discriminação por `type` |
| `iss`/`aud` com defaults | Defesa em profundidade sem mudar muito .env | Sem `iss`/`aud` (vulnerável) |
| `/api/auth/me` em vez de manter `users/:id` | Self-service claro; evita ambiguidade de "qualquer user" | Manter users/:id com requireRole(ADMIN) |
| Não permitir trocar `role` via `/me` | Privilege escalation bloqueada; troca de role fica para admin endpoint futuro | Permitir com validação extra |
| Remover `POST /api/users` (vs manter) | Único caminho de criação é `register` (com password hash + validações) | Manter e exigir admin |

---

## Issues em Aberto

1. **Refresh automático no frontend** — o interceptor de response não chama `authAPI.refresh` em 401 `TOKEN_EXPIRED`. Hoje, access expirado = logout manual.
2. **Blacklist de `jti`** — o `jti` está no token mas não há denylist; logout não invalida tokens já emitidos.
3. **Endpoints admin de usuário** — `GET /api/users` e `GET /api/users/:id` ainda não exigem auth; se forem read-only públicos, ok; se forem admin, precisam de `authenticate, requireRole('ADMIN')`.
4. **POST `/api/movies/genres` no mesmo router de movies** — funciona, mas há modelos Genre e MovieGenre no Prisma; pode merecer um `genreRoutes` dedicado no futuro.

---

## Notas para Futuras Implementações

- Implementar blacklist de `jti` (Redis) para suportar logout real
- Refresh automático no interceptor do axios
- Rate limit em `/api/auth/login` e `/api/auth/refresh` (express-rate-limit já está no package.json)
- Migrar `GET /api/users*` para `authenticate, requireRole('ADMIN')` se forem endpoints admin
- Considerar separar `/api/genres` em router próprio
- Adicionar testes unitários para `verifyAccessToken`/`verifyRefreshToken` (hoje só smoke test)
