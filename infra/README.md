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
| dev | 3000 | Desenvolvimento local |
| staging | 3001 | Homologação |
| prod | 3002 | Produção |

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
├── docs/               # Documentação completa
├── docker/             # Dockerfiles por ambiente
├── scripts/            # Scripts auxiliares
└── public/             # Arquivos estáticos
```
