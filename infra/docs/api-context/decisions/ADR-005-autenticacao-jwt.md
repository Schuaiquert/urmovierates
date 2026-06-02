# ADR-005 — Autenticação JWT

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Utilizar **JWT (JSON Web Tokens)** para autenticação stateless.

### Contexto

Precisa-se de:
- Autenticação stateless (sem sessões)
- Escalabilidade horizontal facilitada
- Token com expiração configuravel

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