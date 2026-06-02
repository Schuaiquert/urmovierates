# Scripts — urmovierates

**Projeto:** urmovierates  
**Data:** 2026-05-19

---

## Scripts Disponíveis

### setup.sh

Script de setup inicial para novos desenvolvedores.

```bash
./scripts/setup.sh
```

**O que faz:**
1. Verifica Node.js e Docker instalados
2. Copia `.env.example` para `.env`
3. Instala dependências npm
4. Sobe containers Docker (dev)
5. Executa migrações Prisma (`prisma migrate dev`)
6. Popula banco com seed (`prisma/seed.ts`)

**Fluxo:**
```
Node/Docker OK? → Copia .env → npm install → docker up → prisma migrate → seed
```

---

### docker-up.sh

Sobe todos os containers do ambiente.

```bash
./scripts/docker-up.sh [env]
```

**Parâmetros:**
- `env` — Ambiente (dev|staging|prod). Default: dev

**Exemplos:**
```bash
./scripts/docker-up.sh dev      # Sobe ambiente dev na porta 3000
./scripts/docker-up.sh staging  # Sobe ambiente staging na porta 3001
./scripts/docker-up.sh prod     # Sobe ambiente prod na porta 3002
```

---

### migrate.sh

Executa migrações do Prisma.

```bash
./scripts/migrate.sh [env]
```

**Parâmetros:**
- `env` — Ambiente (dev|staging|prod). Default: dev

---

### seed.sh

Popula o banco de dados com dados iniciais.

```bash
./scripts/seed.sh
```

**Cria:**
- 1 usuário admin (admin@urmovierates.com)
- 1 usuário normal (user@urmovierates.com)
- 5 filmes de exemplo (The Shawshank Redemption, The Godfather, etc)

---

## Arquivos de Seed

O arquivo `prisma/seed.ts` contém a função de seed:
- Localização: `prisma/seed.ts`
- Executado via: `npx ts-node prisma/seed.ts`
- Usa Prisma Client para inserção

---

## Uso no Desenvolvimento

```bash
# Setup inicial (primeira vez)
./scripts/setup.sh

# Durante desenvolvimento
npm run dev

# Sobe containers isoladamente
./scripts/docker-up.sh dev

# Para containers
cd docker/dev && docker-compose down

# Reset completo
cd docker/dev && docker-compose down -v && ./scripts/setup.sh
```