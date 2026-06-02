# ADR-006 — Docker Multiambiente

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