# Sessão: Conflito de Porta 3000 e Fix do Swagger — 2026-06-06

**Data:** 2026-06-06
**Sintoma:** Frontend Vite (5173) subia ok, mas todas as chamadas `/api/*` retornavam `http proxy error: socket hang up` / `ECONNRESET` no terminal do Vite.

---

## Causa Raiz

Outro processo Node rodando como **root** em `/app` (`pid 38477`, nodemon + ts-node em `src/server.ts`) já ocupava a porta **3000** e **resetava a conexão TCP** assim que recebia qualquer requisição HTTP — não era um servidor HTTP funcional.

O backend local (`/home/projects/pedro/urmovierates`, `pid 38572`) ficava em loop de restart porque não conseguia fazer `bind` na 3000. O proxy do Vite (`→ :3000`) conectava no processo root, que respondia com RST.

**Diagnóstico:**
```bash
ss -ltnp 'sport = :3000'      # 0.0.0.0:3000 LISTEN (sem pid visível para ubuntu)
ps -ef | grep ts-node          # dois backends: root em /app e ubuntu em urmovierates
curl -v http://localhost:3000/ # conexão aceita, "Recv failure: Connection reset by peer"
```

---

## Fix Aplicado

Sem permissão de `sudo` no shell do opencode, o processo root não pôde ser morto. Solução: **migrar o backend de desenvolvimento local para a porta 3001** (livre; a 3001 do Docker é staging e não estava em uso).

| Arquivo | Mudança |
|---------|---------|
| `.env:3` | `PORT=3000` → `PORT=3001` |
| `.env:17` | `CORS_ORIGIN=http://localhost:3000` → `http://localhost:3001` |
| `frontend/vite.config.js:10` | proxy `target: 'http://localhost:3000'` → `http://localhost:3001` |
| `src/config/swagger.ts:14` | `servers[0].url` hardcoded em `http://localhost:3000` → `process.env.API_URL \|\| \`http://localhost:${process.env.PORT \|\| 3000}\`` |

O processo root em `/app` foi deixado intocado. A porta 3000 do host continua ocupada por ele.

---

## Nota sobre o Swagger

`swaggerSpec` é gerado uma vez no boot do servidor (`src/app.ts:31` faz `swaggerUi.setup(swaggerSpec)` na inicialização do módulo). `nodemon` **não watch** o `.env`, então a mudança de `PORT` e a nova expressão em `servers[0].url` só passam a valer após **reinício explícito** do backend.

URL canônica da doc: `http://localhost:3001/api-docs` (montada dinamicamente a partir de `PORT` ou do override `API_URL`).

---

## Reinício Pós-Fix

```bash
# terminal 1 — backend
cd /home/projects/pedro/urmovierates && npm run dev

# terminal 2 — frontend
cd /home/projects/pedro/urmovierates/frontend && npm run dev
```

Verificação rápida:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/movies/years
# esperado: 200 (ou 4xx/5xx de regra de negócio, mas não mais connection reset)
```

---

## Para Reverter (se o processo root em `/app` sumir)

1. Matar o backend local em :3001 (`pkill -f "nodemon.*urmovierates"`)
2. Em `.env`, voltar `PORT=3000` e `CORS_ORIGIN=http://localhost:3000`
3. Em `frontend/vite.config.js`, voltar `target: 'http://localhost:3000'`
4. Em `src/config/swagger.ts`, opcional: voltar `servers[0].url` para `http://localhost:${PORT}` simples
5. Reiniciar backend e frontend
