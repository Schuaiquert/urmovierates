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

### Scripts Úteis

```bash
npm run dev      # Iniciar em desenvolvimento
npm run build    # Buildar para produção
npm run start    # Iniciar em produção
npm run test     # Rodar testes
npx prisma studio # Abrir interface do Prisma
```

## Frontend

O frontend React está em `frontend/`. Para iniciá-lo:

```bash
# 1. Entrar no diretório do frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Iniciar em desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173` (Vite default).

### Variáveis do Frontend

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_URL` | URL da API backend | `http://localhost:3001` (dev) |

### Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/movies` | Listar filmes |
| GET | `/api/movies/:id` | Detalhes do filme |
| POST | `/api/auth/register` | Registrar usuário |
| POST | `/api/auth/login` | Login |
| GET | `/api/genres` | Listar gêneros |
| GET | `/api/years` | Listar anos disponíveis |

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
