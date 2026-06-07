# Registo de Atividades

**Projeto:** urmovierates
**Última atualização:** 2026-06-04

---

## 2026-06-04 — Hardening de Autenticação JWT

| Atividade | Detalhes |
|-----------|----------|
| Revisão do utilitário JWT | Adicionados `iss`/`aud`/`jti`; algoritmo fixo HS256; par access+refresh com secrets distintos |
| Middleware com erros tipados | `TOKEN_EXPIRED`/`TOKEN_INVALID`/`AUTH_MISSING`/`FORBIDDEN`; Bearer case-insensitive |
| Swagger com securityScheme | `bearerAuth` (bearerFormat: JWT) + schemas `Unauthorized`/`Forbidden` |
| Bug "Valid userId is required" | Removido `body('userId')` de `reviewValidators.create` |
| Auditoria de endpoints | Confirmado: nenhum outro validator exige `userId` no body |
| Remoção de endpoints legados | `POST /api/users`, `PUT/DELETE /api/users/:id` removidos |
| Novos endpoints self-service | `GET/PUT/DELETE /api/auth/me` (substituem user management) |
| Sincronização do frontend | `favoritesAPI`/`usersAPI`/`authAPI` sem `userId`; hooks/páginas atualizados |
| Documentação | Sessão + ADR-007 sobre par de tokens |

Sessão detalhada: `infra/docs/sessions/jwt-auth-hardening-2026-06-04.md`
ADR: `infra/docs/api-context/decisions/ADR-007-acesso-refresh-tokens.md`

---

## 2026-06-02 — Refatoração Frontend

| Atividade | Detalhes |
|-----------|----------|
| Bug de sobreposição no toolbar | CSS Grid + `min-w-0` |
| Reorganização navbar 2 níveis | `<Navbar />` separado de `<FilterBar />` |
| Modal AdicionarFilme no Layout | Estado compartilhado entre HomePage/MoviePage |
| Substituição de emojis por lucide-react | `Heart`, `Pencil`, `Trash2`, `LogOut`, `Lock`, `Film` etc. |
| Backend: filtro `search` | Adicionado em `movieService.findAll` (case-insensitive) |

Sessão detalhada: `infra/docs/sessions/frontend-refactoring-2026-06-02.md`

---

## 2026-06-02 — Features Admin

| Atividade | Detalhes |
|-----------|----------|
| Edição/remoção de filmes | `MovieToolbar` movido para `MovieCard` (admin only) |
| Edição de review | `EditReviewModal` no `MoviePage` |
| Perfil com edição de nome | `ProfilePage` ganha `updateUser` |

Sessão detalhada: `infra/docs/sessions/admin-features-2026-06-02.md`

---

## 2025-06 — Implementação Inicial de Auth

| Atividade | Detalhes |
|-----------|----------|
| Sistema JWT | register, login, forgot, reset |
| Middleware | `authenticate`, `optionalAuth`, `requireRole` |
| Páginas frontend | LoginPage, RegisterPage, ProfilePage |
| Variáveis | `JWT_SECRET`, `JWT_EXPIRES_IN` |

Sessão detalhada: `infra/docs/sessions/auth-implementation-2025-06.md`

---

## 2026-05-19 — Setup Inicial

| Hora | Atividade | Responsável | Detalhes |
|------|-----------|-------------|----------|
| - | Criação da estrutura de pastas | Pedro | Estrutura base criada |
| - | Documentação inicial | Pedro | README.md, project-context.md |
| - | Definição de user stories | Pedro | 7 user stories documentadas |
| - | Decisões arquiteturais | Pedro | 6 ADRs registrados |
| - | Documentação técnica | Pedro | database model, docker, layers |
| - | Configuração Docker | Pedro | Dockerfiles e compose para dev/staging/prod |
| - | Schema Prisma | Pedro | Modelos User, Movie, Review |
| - | Scripts auxiliares | Pedro | setup.sh, docker-up.sh, migrate.sh, seed.sh |
| - | Seed do banco | Pedro | prisma/seed.ts com dados iniciais |

---

## Tarefas Concluídas

### Setup
- [x] Estrutura de pastas (`src/`, `docs/`, `docker/`, `scripts/`, etc.)
- [x] README.md com visão geral
- [x] `docs/api-context/project-context.md`
- [x] `docs/architecture/folder-structure.md`
- [x] `docs/architecture/database-model.md`
- [x] `docs/architecture/docker.md`
- [x] `docs/architecture/layers.md`
- [x] `docs/user-stories/user-stories.md`
- [x] `docs/api-context/decisions/ADR-000-template.md`
- [x] `docs/api-context/ai-context.md`
- [x] Docker compose e Dockerfiles (dev/staging/prod)
- [x] `src/models/prisma/schema.prisma`
- [x] `prisma/seed.ts`
- [x] Scripts: setup.sh, docker-up.sh, migrate.sh, seed.sh

### Auth (iterativo)
- [x] Sistema JWT inicial (ADR-005)
- [x] Hardening de JWT — par access+refresh, iss/aud, swagger (ADR-007)
- [x] `POST /api/auth/refresh`
- [x] `GET/PUT/DELETE /api/auth/me`
- [x] Remoção de endpoints legados (`POST/PUT/DELETE /api/users`)

---

## Próximos Passos

1. **Refresh automático no frontend** — interceptor axios não chama `authAPI.refresh` em 401 `TOKEN_EXPIRED`
2. **Blacklist de `jti`** — logout real (revoga tokens em circulação)
3. **Rate limit em auth** — `express-rate-limit` em `/login` e `/refresh`
4. **Endpoints admin de usuário** — decidir se `GET /api/users*` fica público ou vira admin
5. **Testes unitários** — `verifyAccessToken`, `verifyRefreshToken`, ownership de review
6. **Separação de `/api/genres`** — router próprio se o modelo crescer