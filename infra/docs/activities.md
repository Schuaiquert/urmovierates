# Registo de Atividades

**Projeto:** urmovierates  
**Data:** 2026-05-19

---

## 2026-05-19

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

---

## Próximos Passos

1. **Configuração TypeScript** — tsconfig.json ✅
2. **Setup Docker** — Dockerfiles ✅
3. **Modelagem Prisma** — schema.prisma ✅
4. **CRUD Filmes** — Rotas, controllers, services
5. **Sistema Auth** — JWT, registro, login
6. **Avaliações** — Reviews