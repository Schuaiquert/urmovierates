# Arquitetura em Camadas — urmovierates

**Projeto:** urmovierates  
**Data:** 2026-05-19

---

## Visão Geral

A aplicação segue o padrão **arquitetura em camadas (layered architecture)** com separação clara de responsabilidades, garantindo testabilidade, manutenibilidade e escalabilidade.

---

## Diagrama da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (HTTP)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTES (Rotas)                             │
│  movieRoutes.ts / userRoutes.ts / reviewRoutes.ts             │
│  • Mapeia URL → Controller                                     │
│  • Validação básica de rota                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARES (Filtros)                        │
│  auth.ts / admin.ts / errorHandler.ts / rateLimiter.ts         │
│  • Autenticação                                                 │
│  • Autorização                                                  │
│  • Tratamento de erros                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CONTROLLERS (Controladores)                    │
│  movieController.ts / userController.ts / reviewController.ts   │
│  • Recebe req/res HTTP                                         │
│  • Validação de entrada                                        │
│  • Chamada de services                                         │
│  • Formatação de resposta                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVICES (Lógica de Negócio)                  │
│  movieService.ts / userService.ts / authService.ts             │
│  • Regras de negócio                                           │
│  • Validações de domínio                                       │
│  • Coordenação entre repositories                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               REPOSITORIES (Acesso a Dados)                     │
│  movieRepository.ts / userRepository.ts / reviewRepository.ts │
│  • Abstração de acesso ao banco                                │
│  • Queries Prisma                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRISMA / PostgreSQL                          │
│  schema.prisma → migrations → banco de dados                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsabilidades por Camada

### 1. Routes (`src/routes/`)

| Responsabilidade | Descrição |
|------------------|-----------|
| **Mapeamento** | Associa métodos HTTP + URL ao controller correto |
| **Validação básica** | Verifica se rota existe |

**Exemplo:**
```typescript
router.get('/movies', movieController.findAll);
router.post('/movies', auth, admin, movieController.create);
```

### 2. Middlewares (`src/middlewares/`)

| Middleware | Responsabilidade |
|------------|------------------|
| `auth.ts` | Valida token JWT, anexa `user` ao request |
| `admin.ts` | Verifica se `user.role === 'ADMIN'` |
| `errorHandler.ts` | Centraliza tratamento de erros |
| `rateLimiter.ts` | Limita requisições por IP |

### 3. Controllers (`src/controllers/`)

| Responsabilidade | Descrição |
|------------------|-----------|
| **Validação** | Valida dados de entrada com Zod/Joi |
| **Resposta HTTP** | Status codes, headers, formato JSON |
| **Delegação** | Chama service apropriado |

**Exemplo:**
```typescript
// movieController.ts
async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = movieSchema.parse(req.body);
    const movie = await movieService.create(data);
    res.status(201).json(movie);
  } catch (error) {
    next(error);
  }
}
```

### 4. Services (`src/services/`)

| Responsabilidade | Descrição |
|------------------|-----------|
| **Regras de negócio** | Lógica que define como o sistema funciona |
| **Validações de domínio** | Regras específicas do negócio |
| **Coordenação** | Orchestra múltiplas operações |

**Exemplo:**
```typescript
// movieService.ts
async function create(data: CreateMovieDTO) {
  // Regra: título não pode existir
  const exists = await movieRepository.findByTitle(data.title);
  if (exists) throw new ConflictError('Movie already exists');
  
  return movieRepository.create(data);
}
```

### 5. Repositories (`src/models/repositories/`)

| Responsabilidade | Descrição |
|------------------|-----------|
| **Acesso a dados** | Abstração sobre Prisma Client |
| **Queries** | Operations de CRUD |

**Exemplo:**
```typescript
// movieRepository.ts
async function findByTitle(title: string) {
  return prisma.movie.findFirst({ where: { title } });
}
```

---

## Fluxo de uma Requisição

```
GET /api/movies/123
        │
        ▼
┌───────────────┐
│   Routes      │  movieRoutes.ts → GET /:id
└───────────────┘
        │
        ▼
┌───────────────┐
│  Middleware   │  auth.ts → verifica token JWT
└───────────────┘
        │
        ▼
┌───────────────┐
│  Controller   │  movieController.findById(123)
└───────────────┘
        │
        ▼
┌───────────────┐
│   Service     │  movieService.getById(123)
└───────────────┘
        │
        ▼
┌───────────────┐
│ Repository    │  movieRepository.findById(123)
└───────────────┘
        │
        ▼
┌───────────────┐
│   Prisma      │  prisma.movie.findUnique(where: {id: 123})
└───────────────┘
        │
        ▼
     Response
```

---

## Pastas对应entes

| Camada | Pasta |
|--------|-------|
| Routes | `src/routes/` |
| Middlewares | `src/middlewares/` |
| Controllers | `src/controllers/` |
| Services | `src/services/` |
| Repositories | `src/models/repositories/` |
| Models (ORM) | `src/models/prisma/` |

---

## Princípios Aplicados

1. **Separation of Concerns (SoC)** — Cada camada tem responsabilidade única
2. **Dependency Inversion** — Controllers dependem de Services (abstratos), não de Repositories
3. **Single Responsibility** — Cada módulo faz uma coisa bem feita
4. **DRY** — Lógica de negócio em um único lugar (Services)