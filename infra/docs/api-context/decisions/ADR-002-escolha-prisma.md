# ADR-002 — Escolha do Prisma como ORM

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Utilizar **Prisma ORM** para abstração do banco de dados.

### Contexto

É necessário um ORM que:
- Funcione bem com TypeScript
- Tenha migrations robustas
- Ofereça type-safety na construção de queries

### Considerações

**Prós:**
- Client gerado com tipos TypeScript completos
- Migrations com versionamento via Prisma Migrate
- Schema como fonte da verdade
- Prisma Studio para visualização

**Contras:**
- Overhead de query em casos específicos
- Runtime adicional (Prisma Client)
- Dependência de toolchain específica

### Consequências

- Schema do banco em `src/models/prisma/schema.prisma`
- Migrations versionadas em `src/models/prisma/migrations/`
- Client importado via `import { PrismaClient } from '@prisma/client'`