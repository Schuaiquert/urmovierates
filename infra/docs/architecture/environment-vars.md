# Variáveis de Ambiente — urmovierates

**Projeto:** urmovierates  
**Data:** 2026-05-19

---

## Arquivos

- `.env.example` — Template com todas as variáveis
- `.env.dev` — Desenvolvimento local
- `.env.staging` — Ambiente de staging
- `.env.prod` — Produção (não versionado)

---

## Variáveis Obrigatórias

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/urmovierates

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=24h

# Logs
LOG_LEVEL=debug
```

---

## Variáveis Opcionais

```env
# CORS
CORS_ORIGIN=http://localhost:3001

# Swagger server URL (opcional — fallback usa http://localhost:${PORT})
# API_URL=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis Cache TTL
CACHE_TTL=3600
```

---

## API Key (`X-API-Key`)

Todas as rotas protegidas exigem o header `X-API-Key` com o valor desta variável.
Rotas públicas (auth/login, auth/register, auth/refresh, auth/forgot-password,
auth/reset-password, /health, /api-docs) **não** exigem.

```env
# Gerar com: openssl rand -hex 32
API_KEY=generate-with-openssl-rand-hex-32-min-16-chars
```

A aplicação **não inicializa** se `API_KEY` estiver ausente ou com menos de 16 caracteres.