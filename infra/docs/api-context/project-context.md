# Contexto do Projeto — urmovierates

**Versão:** 1.0.0  
**Data:** 2026-05-19  
**Responsável:** Pedro

---

## 1. Propósito

Sistema REST API para avaliação de filmes, permitindo que usuários registrem suas avaliações e administradores gerenciem o catálogo de filmes.

---

## 2. Escopo Funcional

### 2.1 Atores

| Ator | Descrição |
|------|-----------|
| **Usuário (leitura)** | Pode visualizar filmes e avaliações |
| **Usuário (avaliador)** | Pode registrar e editar suas próprias avaliações |
| **Administrador** | Pode adicionar, editar e excluir filmes |

### 2.2 Funcionalidades Core

- [ ] Cadastro e autenticação de usuários (JWT)
- [ ] CRUD completo de filmes (admin only para create/update/delete)
- [ ] Sistema de avaliações (1-5 estrelas + texto)
- [ ] Listagem e busca de filmes
- [ ] Perfil de usuário com histórico de avaliações

### 2.3 Funcionalidades Futuras

- [ ] IA para geração automática de sinopses
- [ ] Recomendação de filmes baseados em preferências
- [ ] Integração com APIs externas (TMDB, OMDb)

---

## 3. Arquitetura

### 3.1 Stack

```
Runtime      → Node.js 20 LTS
Linguagem    → TypeScript 5.x
Framework    → Express.js 4.x
ORM          → Prisma
Banco       → PostgreSQL 16
Cache       → Redis
Container   → Docker + Docker Compose
```

### 3.2 Arquitetura em Camadas

```
┌─────────────────────────────────────────┐
│            Routes (Rotas)                │
├─────────────────────────────────────────┤
│         Controllers (Controladores)      │
├─────────────────────────────────────────┤
│         Services (Lógica de Negócio)     │
├─────────────────────────────────────────┤
│      Models / Repository (Dados)         │
├─────────────────────────────────────────┤
│           Prisma / PostgreSQL            │
└─────────────────────────────────────────┘
```

### 3.3 Módulos de IA

O diretório `src/ai/` contém módulos para:
- Geração de contexto para assistentes de IA
- Auxílio na documentação automática
- Assistentes virtuais para suporte

---

## 4. Multiambiente Docker

| Ambiente | Imagem Base | Porta | Variáveis |
|----------|-------------|-------|-----------|
| dev | node:20-alpine | 3000 | `.env.dev` |
| staging | node:20-alpine | 3001 | `.env.staging` |
| prod | node:20-alpine | 3002 | `.env.prod` |

---

## 5. Progresso

| Fase | Status | Data |
|------|--------|------|
| Estrutura de pastas | ✅ Completo | 2026-05-19 |
| Documentação inicial | ✅ Completo | 2026-05-19 |
| Configuração Docker | ✅ Completo | 2026-05-19 |
| Schema Prisma + Seed | ✅ Completo | 2026-05-19 |
| Scripts auxiliares | ✅ Completo | 2026-05-19 |
| Setup TypeScript | ✅ Completo | 2026-05-19 |
| CRUD Filmes | 🔜 Próximo | - |
| Sistema Auth | 🔜 Próximo | - |
| Avaliações | 🔜 Próximo | - |

---

## 6. Notas Técnicas

- Erros são logados em `src/logs/error.log`
- Atividades administrativas em `src/logs/activity.log`
- Documentação gerada em `docs/`
- Contexto de IA em `docs/api-context/`