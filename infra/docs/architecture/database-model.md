# Modelo de Dados — urmovierates

**Projeto:** urmovierates  
**ORM:** Prisma  
**Data:** 2026-05-19

---

## Schema do Banco de Dados

O schema do Prisma está localizado em `src/models/prisma/schema.prisma`.

### 1. User (Usuário)

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hash
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  reviews   Review[]

  @@map("users")
}

enum Role {
  USER
  ADMIN
}
```

### 2. Movie (Filme)

```prisma
model Movie {
  id        String   @id @default(uuid())
  title     String
  synopsis  String?
  year      Int
  poster    String?  // URL para imagem
  trailer   String?  // URL do trailer
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  reviews   Review[]

  @@map("movies")
}
```

### 3. Review (Avaliação)

```prisma
model Review {
  id        String   @id @default(uuid())
  rating    Int      // 1-5
  text      String?
  userId    String
  movieId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
  movie     Movie    @relation(fields: [movieId], references: [id])

  @@unique([userId, movieId])
  @@map("reviews")
}
```

---

## Diagrama de Entidade-Relacionamento

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│              │       │              │       │              │
│    User      │       │    Movie     │       │   Review     │
│              │       │              │       │              │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)     │       │ id (PK)     │
│ name         │       │ title       │       │ rating       │
│ email        │◄──────│ synopsis     │       │ text         │
│ password     │       │ year         │       │ userId (FK)  │
│ role         │       │ poster       │◄──────│ movieId (FK) │
│ createdAt    │       │ trailer      │       │ createdAt    │
│ updatedAt    │       │ active       │       │ updatedAt    │
└──────────────┘       │ createdAt   │       └──────────────┘
       │                │ updatedAt   │
       │                └──────────────┘
       │                      ▲
       │                      │
       └──────────────────────┘
            1:N (User tem Reviews)     1:N (Movie tem Reviews)
```

---

## Índices

| Tabela | Campo | Tipo | Finalidade |
|--------|-------|------|------------|
| users | email | Unique | Busca por email |
| reviews | userId | Index | Buscar avaliações do usuário |
| reviews | movieId | Index | Buscar avaliações do filme |
| reviews | (userId, movieId) | Unique | Uma avaliação por usuário/fillme |

---

## Regras de Integridade

1. **User → Review:** Cascade delete (ao deletar usuário, deleta avaliações)
2. **Movie → Review:** Restrict (não deletar filme com avaliações — soft delete)
3. **Review:** Nota entre 1 e 5
4. **Review:** Texto máximo 1000 caracteres

---

## Migrations

Migrações serão versionadas via Prisma Migrate:

```
src/models/prisma/migrations/
├── 20260519_01_initial_schema.sql
├── 20260519_02_add_indexes.sql
└── ...
```