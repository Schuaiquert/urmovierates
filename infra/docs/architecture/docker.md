# Configuração Docker — urmovierates

**Projeto:** urmovierates  
**Data:** 2026-05-19

---

## Visão Geral

Docker Compose com 3 serviços:
- **app** — Aplicação Node.js + TypeScript
- **postgres** — Banco de dados PostgreSQL 16
- **redis** — Cache Redis 7

---

## Estrutura de Arquivos

```
docker/
├── dev/
│   ├── Dockerfile
│   └── docker-compose.yml
├── staging/
│   ├── Dockerfile
│   └── docker-compose.yml
└── prod/
    ├── Dockerfile
    └── docker-compose.yml
```

## Docker Compose — Dev

```yaml
version: '3.8'

services:
  app:
    build:
      context: ../..
      dockerfile: docker/dev/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/urmovierates
      - REDIS_URL=redis://redis:6379
    volumes:
      - ../../src:/app/src
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=urmovierates
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:
  redis_dev_data:
```

## Dockerfile — Dev

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Instala dependências globais
RUN npm install -g typescript ts-node nodemon

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia código fonte
COPY . .

# Gera cliente Prisma
RUN npx prisma generate

# Expõe porta
EXPOSE 3000

# Watch mode com nodemon
CMD ["npm", "run", "dev"]
```

## Staging

```yaml
version: '3.8'

services:
  app:
    build:
      context: ../..
      dockerfile: docker/staging/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/urmovierates
      - REDIS_URL=redis://redis:6379
    command: npm run start

  postgres:
    image: postgres:16-alpine
    ports:
      - "5433:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
```

## Produção

Produção usa as mesmas imagens mas com:
- Build otimizado (sem source maps)
- Restart policy
- Secrets via variáveis de ambiente
- Porta 3002

## Variáveis de Ambiente por Ambiente

| Variável | Dev | Staging | Prod |
|----------|-----|---------|------|
| NODE_ENV | development | staging | production |
| PORT | 3000 | 3001 | 3002 |
| DATABASE_URL | postgresql://... | postgresql://... | postgresql://... |
| REDIS_URL | redis://... | redis://... | redis://... |
| JWT_SECRET | dev-secret | staging-secret | (do vault) |
| LOG_LEVEL | debug | info | warn |

---

## Scripts Úteis

```bash
# Sobe todos os containers do ambiente dev
docker-compose -f docker/dev/docker-compose.yml up

# Sobe em background
docker-compose -f docker/dev/docker-compose.yml up -d

# Para todos os containers
docker-compose -f docker/dev/docker-compose.yml down

# Rebuild da imagem
docker-compose -f docker/dev/docker-compose.yml build --no-cache
```

---

## Ordem de Inicialização

1. **postgres** — Banco de dados disponível
2. **redis** — Cache disponível
3. **app** — Aplicação inicia (com retry de conexão ao banco)

---

## Persistência

| Volume | Container | Path | Conteúdo |
|--------|-----------|------|----------|
| postgres_data | postgres | /var/lib/postgresql/data | Dados do banco |
| redis_data | redis | /data | Dados do cache |
| src (bind mount) | app | /app/src | Código fonte (dev) |