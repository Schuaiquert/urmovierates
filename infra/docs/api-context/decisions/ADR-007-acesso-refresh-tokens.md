# ADR-007 — Par de Tokens (Access + Refresh)

**Status:** Aceito
**Data:** 2026-06-04
**Substitui/estende:** ADR-005

### Decisão

Autenticação baseada em **par de tokens JWT** com secrets e tempos de vida distintos:
- **Access token** — HS256, 15 min, secret `JWT_SECRET`
- **Refresh token** — HS256, 7 dias, secret `JWT_REFRESH_SECRET` (fallback: mesmo do access)
- Ambos carregam `iss`, `aud`, `jti`, `type` discriminado
- Verificação sempre valida `algorithms: ['HS256']` e os claims

### Contexto

A implementação inicial (ADR-005) usava um único JWT de 24h sem `iss`/`aud`/`jti` e sem refresh. Com o uso real, três problemas apareceram:

1. **Janela de exposição grande** — 24h sem possibilidade de revogar
2. **Sem defesa contra alg confusion** — embora mitigada pela lib v9, sem `algorithms` explícito
3. **Sem rotação de credenciais** — quem copia o token fica com ele até expirar

### Considerações

**Opções avaliadas:**

| Opção | Prós | Contras |
|-------|------|---------|
| Manter 1 token, encurtar para 15m | simples | UX ruim: re-login a cada 15m |
| Access 15m + Refresh 7d (escolhida) | bom balanço, suporta rotação | dois secrets para gerenciar |
| Access 15m + Refresh 30d | menos refreshes | janela de exposição maior |
| Token opaco + sessão no Redis | revoke instantâneo | quebra o "stateless" do ADR-005 |

**Por que HS256 e não RS256:**
- Single issuer e single verifier
- Não há terceira parte validando tokens
- Menor overhead computacional
- Pode evoluir para RS256 se houver microservices validando

**Por que dois secrets:**
- Comprometimento do access não invalida refreshes em circulação (e vice-versa)
- Permite rotação independente (rodar access sem forçar logout de refreshes válidos)
- Discriminação adicional além do `type` no payload

### Consequências

- `.env` precisa de `JWT_REFRESH_SECRET` (opcional, fallback para `JWT_SECRET`)
- Frontend precisa lidar com 401 `TOKEN_EXPIRED` chamando `POST /api/auth/refresh`
- `jti` no token habilita blacklist futura via Redis (não implementado ainda)
- `iss`/`aud` defaults: `urmovierates` / `urmovierates-api`
- `verifyAccessToken` rejeita tokens com `type: 'refresh'` e vice-versa

### Estrutura do Token

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "USER",
  "type": "access",
  "iss": "urmovierates",
  "aud": "urmovierates-api",
  "jti": "uuid-v4",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Endpoints relacionados

- `POST /api/auth/login` — retorna `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` — recebe `{ refreshToken }`, retorna par novo
- `authenticate` middleware — usa `verifyAccessToken` exclusivamente
