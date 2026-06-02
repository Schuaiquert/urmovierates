# urmovierates — Gerenciamento de Filmes e Avaliações

Sistema REST API para avaliação de filmes com Node.js, TypeScript e Docker.

## Stack

- **Runtime:** Node.js 20+
- **Linguagem:** TypeScript 5.x
- **Framework:** Express.js 4.x
- **ORM:** Prisma
- **Banco:** PostgreSQL 16
- **Cache:** Redis 7
- **Container:** Docker + Docker Compose

## Ambientes

| Ambiente | Porta | Descrição |
|---------|-------|-----------|
| dev | 3000 | Desenvolvimento local |
| staging | 3001 | Homologação |
| prod | 3002 | Produção |

## Módulos

- **Usuários:** Cadastro, autenticação, perfil
- **Filmes:** CRUD completo (admin only para create/update/delete)
- **Avaliações:** Sistema de notas (1-5 estrelas)

## Estrutura

```
├── src/                # Código fonte
│   ├── config/         # Configurações por ambiente
│   ├── controllers/    # Controladores HTTP
│   ├── middlewares/    # Middlewares (auth, admin, etc)
│   ├── models/         # Prisma schema + repositories
│   ├── routes/        # Definição de rotas
│   ├── services/      # Lógica de negócio
│   ├── types/         # Definições TypeScript
│   ├── utils/         # Utilitários
│   ├── ai/            # Módulo de IA
│   └── logs/          # Logs de erros e atividades
├── tests/              # Testes automatizados
├── docs/               # Documentação completa
│   ├── api-context/    # Contexto para IA
│   ├── architecture/   # Decisões arquiteturais
│   ├── user-stories/   # Histórias de usuário
│   └── decisions/      # ADRs
├── docker/             # Dockerfiles por ambiente
└── scripts/            # Scripts auxiliares
```

## Contato

- **Responsável:** Pedro