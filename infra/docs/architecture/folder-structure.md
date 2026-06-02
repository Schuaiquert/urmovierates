# Estrutura de Pastas — urmovierates

```
urmovierates/
│
├── README.md                         # Visão geral do projeto
├── package.json                      # Dependências npm
├── tsconfig.json                     # Configuração TypeScript
├── .env.example                      # Exemplo de variáveis de ambiente
│
├── src/                             # Código fonte principal
│   ├── config/                      # Configurações por ambiente
│   │   ├── index.ts                 # Exporta configurações unificadas
│   │   ├── database.ts              # Configuração do banco de dados
│   │   ├── redis.ts                 # Configuração do Redis
│   │   ├── jwt.ts                   # Configuração JWT
│   │   └── env/
│   │       ├── dev.ts               # Variáveis ambiente dev
│   │       ├── staging.ts           # Variáveis ambiente staging
│   │       └── prod.ts              # Variáveis ambiente prod
│   │
│   ├── controllers/                 # Controladores HTTP
│   │   ├── movieController.ts       # CRUD de filmes
│   │   ├── userController.ts        # Cadastro/autenticação
│   │   ├── reviewController.ts      # Avaliações
│   │   └── adminController.ts       # Funções administrativas
│   │
│   ├── middlewares/                 # Middlewares Express
│   │   ├── auth.ts                  # Autenticação JWT
│   │   ├── admin.ts                 # Verificação admin
│   │   ├── errorHandler.ts          # Tratamento de erros
│   │   ├── validator.ts              # Validação de entrada
│   │   └── rateLimiter.ts          # Limitação de requisições
│   │
│   ├── models/                      # Modelos de dados / ORM
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Schema do Prisma
│   │   │   └── migrations/          # Migrações do banco
│   │   └── repositories/            # Repositories (padrão Repository)
│   │       ├── movieRepository.ts
│   │       ├── userRepository.ts
│   │       └── reviewRepository.ts
│   │
│   ├── routes/                      # Definição de rotas da API
│   │   ├── index.ts                 # Rotas principais
│   │   ├── movieRoutes.ts          # Rotas de filmes
│   │   ├── userRoutes.ts           # Rotas de usuários
│   │   └── reviewRoutes.ts          # Rotas de avaliações
│   │
│   ├── services/                    # Lógica de negócio
│   │   ├── movieService.ts         # Regras de filmes
│   │   ├── userService.ts          # Regras de usuários
│   │   ├── authService.ts          # Autenticação
│   │   └── reviewService.ts         # Regras de avaliações
│   │
│   ├── types/                      # Definições TypeScript
│   │   ├── express.d.ts             # Extensões para Request/Response
│   │   ├── movie.ts                # Tipos de filme
│   │   ├── user.ts                 # Tipos de usuário
│   │   └── review.ts               # Tipos de avaliação
│   │
│   ├── utils/                      # Utilitários
│   │   ├── logger.ts               # Winston logger
│   │   ├── hash.ts                 # Bcrypt utilities
│   │   ├── response.ts            # Respostas padronizadas
│   │   └── date.ts                 # Utilitários de data
│   │
│   ├── ai/                         # Módulo de Inteligência Artificial
│   │   ├── contextGenerator.ts     # Gera contexto para LLMs
│   │   ├── assistant.ts          # Assistente virtual
│   │   ├── docsGenerator.ts       # Geração automática de docs
│   │   └── prompts/
│   │       ├── system.md          # Prompts de sistema
│   │       └── templates.md       # Templates para IA
│   │
│   ├── logs/                      # Logs de aplicação
│   │   ├── error.log              # Erros da aplicação
│   │   ├── activity.log           # Log de atividades/admin
│   │   └── access.log             # Log de acessos
│   │
│   ├── app.ts                     # Configuração principal do Express
│   └── server.ts                  # Entry point da aplicação
│
├── tests/                         # Testes automatizados
│   ├── unit/                      # Testes unitários
│   ├── integration/              # Testes de integração
│   └── e2e/                       # Testes end-to-end
│
├── docs/                          # Documentação completa
│   ├── api-context/
│   │   ├── project-context.md    # Este arquivo
│   │   ├── architecture.md       # Decisões arquiteturais
│   │   ├── user-stories.md       # Histórias de usuário
│   │   └── decisions/           # ADRs (Architecture Decision Records)
│   │       └── 001-tech-stack.md
│   │
│   ├── architecture/
│   │   ├── layers.md             # Arquitetura em camadas
│   │   ├── docker.md             # Configuração Docker
│   │   └── database.md           # Modelagem do banco
│   │
│   ├── user-stories/
│   │   ├── US001-cadastro-usuario.md
│   │   ├── US002-login.md
│   │   ├── US003-visualizar-filmes.md
│   │   ├── US004-avaliacao.md
│   │   └── US005-admin-filmes.md
│   │
│   └── decisions/
│       ├── 001-escolha-typescript.md
│       ├── 002-escolha-prisma.md
│       └── 003-escolha-express.md
│
├── docker/                        # Configurações Docker
│   ├── dev/
│   │   ├── Dockerfile            # Dockerfile ambiente dev
│   │   └── docker-compose.yml   # Compose dev
│   ├── staging/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   └── prod/
│       ├── Dockerfile
│       └── docker-compose.yml
│
├── scripts/                       # Scripts auxiliares
│   ├── setup.sh                   # Script de setup inicial
│   ├── migrate.sh                # Executa migrações Prisma
│   ├── seed.sh                   # Seed do banco de dados
│   └── docker-up.sh              # Sobe containers
│
└── public/                        # Arquivos estáticos
    └── uploads/                   # Uploads de imagens
```

---

## Detalhamento dos Módulos

### `src/config/`
Centraliza todas as configurações da aplicação, separando por ambiente (dev/staging/prod).

### `src/controllers/`
Recebem requisições HTTP, validam entrada e chamam services. Cada controller segue o padrão REST.

### `src/middlewares/`
- `auth.ts` — Verifica token JWT
- `admin.ts` — Verifica se usuário é administrador
- `errorHandler.ts` — Centraliza tratamento de erros
- `rateLimiter.ts` — Protege contra DDoS/bot

### `src/models/`
- `schema.prisma` — Define o modelo de dados
- `repositories/` — Abstração de acesso a dados

### `src/services/`
Contém toda a lógica de negócio independente do protocolo HTTP.

### `src/ai/`
Módulo dedicado para funcionalidades de IA:
- Geração de contexto para que assistentes entendam o projeto
- Documentação automática
- Assistentes de suporte

### `src/logs/`
- `error.log` — Todos os erros da aplicação
- `activity.log` — Ações administrativas (create/update/delete de filmes)
- `access.log` — Métricas de acesso