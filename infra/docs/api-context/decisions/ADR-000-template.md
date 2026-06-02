# ADR — Architecture Decision Records

**Projeto:** urmovierates  
**Formato:** Markdown por decisão

---

## ADR-001 — Escolha do TypeScript

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Utilizar **TypeScript 5.x** como linguagem principal do projeto.

### Contexto

Precisa-se de uma linguagem que ofereça:
- Tipagem estática para reduzir erros em tempo de execução
- Melhor suporte a IDEs e tooling
- Compatibilidade com o ecossistema Node.js

### Considerações

**Prós:**
- Tipagem estática catching erros durante desenvolvimento
- Autocomplete superior em IDEs
- Refactoring mais seguro
- Documentação via tipos

**Contras:**
- Curva de aprendizado para devs sem experiência TS
- Processo de build adicional (compilação)
- Configuração inicial

### Consequências

- Build pipeline inclui `tsc` (TypeScript compiler)
- Strict mode habilitado para máxima segurança de tipos
- Definições de tipos em `src/types/`

---

## ADR-002 — Escolha do Prisma como ORM

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
- Seed em `prisma/seed.ts`

---

## ADR-003 — Escolha do Express.js como Framework

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Utilizar **Express.js 4.x** como framework HTTP.

### Contexto

Precisa-se de um framework que:
- Seja minimalista e flexível
- Tenha vasto ecossistema de middlewares
- Seja amplamente documentado
- Possua baixa curva de entrada

### Considerações

**Prós:**
- Ecossistema maduro com milhares de middlewares
- Curva de aprendizado baixa
- Flexível para arquitetura em camadas
- Performance adequada para APIs REST

**Contras:**
- Não impõe estrutura → risco de desorganização
- Necessário configurar banyak things manualmente
- Sem validação nativa

### Consequências

- Middlewares: cors, helmet, compression, morgan
- Validação via express-validator ou zod
- Estrutura em camadas: Routes → Controllers → Services → Repositories
- Erro 404 para rotas não encontradas, erro 500 para exceções não tratadas

---

## ADR-004 — Estrutura de Pastas

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Adotar estrutura de pastas **baseada em features/camadas** com separação clara de responsabilidades.

### Contexto

O projeto necessita de:
- Escalabilidade para múltiplos módulos
- Testabilidade facilitada
- Documentação organizada
- Contexto dedicado para IA

### Considerações

**Prós:**
- Separação clara de responsabilidades (SoC)
- Fácil de localizar arquivos por contexto
- Modularização natural
- Pasta `docs/` dedicada para documentação

**Contras:**
- Estrutura mais verbosa que flat structure
- Overhead inicial para projetos pequenos

### Consequências

- Código fonte em `src/`
- Documentação em `docs/`
- Módulo de IA em `src/ai/`
- Logs em `src/logs/`
- Docker configs isolados por ambiente em `docker/{env}/`

---

## ADR-005 — Autenticação JWT

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Utilizar **JWT (JSON Web Tokens)** para autenticação stateless.

### Contexto

Precisa-se de:
- Autenticação stateless (sem sessões)
- Escalabilidade horizontal facilitada
- Token com expiração configurable

### Considerações

**Prós:**
- Stateless → fácil scaling
- Token contém informações do usuário (role, id)
- Refresh token para renovação

**Contras:**
- Token não pode ser invalidado individualmente (sem blacklist)
- Armazenamento seguro no cliente necessário

### Consequências

- Secret key no arquivo `.env`
- Access token: expira em 24h
- Middleware `auth.ts` valida token em todas as rotas protegidas
- Payload: `{ userId, email, role }`

---

## ADR-006 — Docker Multiambiente

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Utilizar **Docker + Docker Compose** com configuração por ambiente (dev/staging/prod).

### Contexto

Precisa-se de:
- Ambientes consistentes entre devs
- Facilidade de setup para novos membros
- Ambientes isolados (dev/staging/prod)

### Considerações

**Prós:**
- Isolamento de dependências
- Ambientes idênticos em toda a equipe
- Fácil orquestração de múltiplos containers

**Contras:**
- Overhead de recursos
- Curva de aprendizado em Docker

### Consequências

- Dockerfile por ambiente em `docker/{env}/`
- docker-compose.yml sobe: app + postgres + redis
- Porta exposta varia por ambiente (3000/3001/3002)
- Variables de ambiente via `.env.{env}` montado em `/app`