# urmovierates

**Sistema de Avaliação de Filmes** — API REST em Node.js + TypeScript + Docker

## Visão Geral

API para um sistema web de avaliação de filmes onde:
- **Usuários comuns** podem visualizar filmes e suas avaliações
- **Administradores** têm controle total: adicionar, editar e excluir filmes

## Stack

- **Runtime:** Node.js 20+ com TypeScript
- **Framework:** Express.js
- **Banco de Dados:** PostgreSQL (via Docker)
- **Cache:** Redis
- **ORM:** Prisma
- **Autenticação:** JWT
- **Containerização:** Docker + Docker Compose

## Ambientes

| Ambiente | Porta | Finalidade |
|----------|-------|------------|
| dev | 3001 | Desenvolvimento local (ver `infra/docs/sessions/port-conflict-and-swagger-fix-2026-06-06.md`) |
| staging | 3001 | Homologação |
| prod | 3002 | Produção |

## Como Iniciar

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- PostgreSQL (ou usar Docker)

### Desenvolvimento Local

```bash
# 1. Clonar e instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 3. Iniciar PostgreSQL com Docker
cd infra/docker/dev && docker-compose up -d

# 4. Rodar migrations e seed
npx prisma migrate dev
npx prisma db seed

# 5. Iniciar o servidor
npm run dev
```

### Staging (Homologação)

```bash
# 1. Buildar imagem Docker
cd infra/docker/staging && docker-compose up -d --build

# 2. Aplicar migrations
docker exec -it <container_id> npx prisma migrate deploy

# 3. Acessar em http://localhost:3001
```

### Produção

```bash
# 1. Buildar imagem Docker
cd infra/docker/prod && docker-compose up -d --build

# 2. Aplicar migrations
docker exec -it <container_id> npx prisma migrate deploy

# 3. Acessar em http://localhost:3002
```

### Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL do PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Chave secreta para JWT | `sua-chave-secreta` |
| `PORT` | Porta do servidor | `3001` (dev) |
| `NODE_ENV` | Ambiente | `development` / `staging` / `production` |
| `API_KEY` | Segredo do header `X-API-Key` (backend) | `openssl rand -hex 32` |

### Frontend setup

O cliente Next.js precisa do mesmo `API_KEY` que o backend, exposto como
`NEXT_PUBLIC_API_KEY`. Copie `frontend/.env.example` para `frontend/.env.local`
e defina o valor com a mesma chave do backend (uma chave por ambiente).

```bash
cd frontend
cp .env.example .env.local
# cole o mesmo valor de API_KEY do backend
echo "NEXT_PUBLIC_API_KEY=*** >> .env.local
```

Variáveis `NEXT_PUBLIC_*` são inline no bundle no build, então reinicie
`npm run dev` após alterar. O valor é seguro de enviar no bundle do cliente
— é o mesmo segredo compartilhado que o backend já aceita em header público;
rotacione no backend e reimplante os dois lados para rolar.

### Scripts Úteis

```bash
npm run dev      # Iniciar em desenvolvimento
npm run build    # Buildar para produção
npm run start    # Iniciar em produção
npm run test     # Rodar testes
npx prisma studio # Abrir interface do Prisma
```

## Frontend

O frontend Next.js está em `frontend/`. Para iniciá-lo:

```bash
# 1. Entrar no diretório do frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Iniciar em desenvolvimento
npm run dev
```

O frontend estará disponível em **http://localhost:5173**. Em dev, requisições para `/api/*` são reescritas para o backend em `http://localhost:3001` via `next.config.mjs` (`rewrites()`).

### Stack do Frontend
- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS 3
- Framer Motion (transições)
- `lucide-react` (ícones)
- `axios` (HTTP)

### Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/movies` | Listar filmes |
| GET | `/api/movies/:id` | Detalhes do filme |
| POST | `/api/auth/register` | Registrar usuário |
| POST | `/api/auth/login` | Login |
| GET | `/api/genres` | Listar gêneros |
| GET | `/api/years` | Listar anos disponíveis |
| GET/POST | `/api/reviews` | Listar/criar avaliações |
| GET/PUT/DELETE | `/api/reviews/:id` | Detalhe/editar/excluir avaliação |

### Edição e exclusão de comentários

- `PUT /api/reviews/:id` — apenas o **autor** pode editar (admin NÃO
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

### Documentação Interativa (Swagger UI)

Disponível em **http://localhost:3001/api-docs** durante o desenvolvimento local.

A URL base exibida no botão "Try it out" é montada dinamicamente a partir de `API_URL` (override) ou `http://localhost:${PORT}`. O server URL fica registrado em `src/config/swagger.ts`.

## Estrutura Principal

```
urmovierates/
├── src/
│   ├── config/          # Configurações por ambiente
│   ├── controllers/     # Controladores HTTP
│   ├── middlewares/    # Middlewares Express
│   ├── models/          # Modelos de dados / Prisma
│   ├── routes/          # Definição de rotas
│   ├── services/       # Lógica de negócio
│   ├── types/          # Definições TypeScript
│   ├── utils/          # Utilitários
│   ├── ai/             # Módulo de IA (geração de contexto, assistência)
│   └── logs/           # Logs de erros e atividades
├── tests/               # Testes automatizados
├── infra/
│   ├── docker/         # Dockerfiles por ambiente (dev, staging, prod)
│   ├── docs/          # Documentação completa
│   └── scripts/       # Scripts auxiliares
└── public/             # Arquivos estáticos
```
