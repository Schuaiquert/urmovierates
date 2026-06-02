# Contexto para IA — urmovierates

**Projeto:** urmovierates  
**Data:** 2026-05-19  
**Versão:** 1.0.0

---

## Sobre o Projeto

Sistema REST API para avaliação de filmes em Node.js + TypeScript. Permite que usuários avaliem filmes (1-5 estrelas) e administrators gerenciem o catálogo.

**Stack:** Express.js + Prisma + PostgreSQL + Redis + Docker

---

## Estrutura de Pastas

```
src/
├── config/          # Configurações por ambiente
├── controllers/     # Controladores HTTP
├── middlewares/     # auth, admin, errorHandler
├── models/          # Prisma schema + repositories
├── routes/          # Definição de rotas
├── services/        # Lógica de negócio
├── types/           # Definições TypeScript
├── utils/           # Logger, helpers
├── ai/             # Módulo de IA
└── logs/           # error.log, activity.log
```

---

## Modelos de Dados

- **User:** id, name, email, password (bcrypt), role (USER|ADMIN)
- **Movie:** id, title, synopsis, year, poster, trailer, active
- **Review:** id, rating (1-5), text, userId, movieId

---

## Regras de Negócio

1. Usuários podem ver filmes e fazer avaliações
2. Admins podem criar, editar e excluir filmes
3. Uma avaliação por usuário por filme
4. Exclusão de filme é soft delete
5. Todas as ações admin são logadas

---

## Endpoints Principais

```
Auth:
POST   /api/auth/register
POST   /api/auth/login

Movies:
GET    /api/movies
GET    /api/movies/:id
POST   /api/movies        (admin)
PUT    /api/movies/:id    (admin)
DELETE /api/movies/:id    (admin)

Reviews:
GET    /api/movies/:id/reviews
POST   /api/movies/:id/reviews   (auth)
PUT    /api/reviews/:id          (owner)
DELETE /api/reviews/:id          (owner)
```

---

## Autenticação

JWT stateless. Token expira em 24h. Payload: `{ userId, email, role }`

---

## Módulo de IA (`src/ai/`)

Contém:
- `contextGenerator.ts` — Gera contexto estruturado para LLMs
- `assistant.ts` — Assistente virtual
- `docsGenerator.ts` — Geração automática de documentação

---

## Logs

- `src/logs/error.log` — Erros da aplicação
- `src/logs/activity.log` — Ações admin (create/update/delete movies)

---

## Ambientes Docker

| Ambiente | Porta | Finalidade |
|----------|-------|------------|
| dev | 3000 | Desenvolvimento |
| staging | 3001 | Homologação |
| prod | 3002 | Produção |

---

## Status Atual

Estrutura de pastas criada. Próximos passos:
1. Configuração Docker
2. Setup TypeScript
3. Modelagem Prisma
4. CRUD Filmes
5. Sistema Auth
6. Avaliações