# Sessão de Implementação: Sistema de Autenticação JWT

**Data:** 2025-06-01 a 2025-06-02
**Projeto:** urmovierates

---

## Resumo das Alterações

### Backend - Sistema de Autenticação

#### Novos arquivos criados:

| Arquivo | Descrição |/
|---------|-----------|
| `src/utils/jwt.ts` | Helpers para gerar e verificar tokens JWT |
| `src/utils/crypto.ts` | Utilitário para gerar tokens seguros (crypto.randomBytes) |
| `src/services/authService.ts` | Lógica central de autenticação (register, login, forgot, reset) |
| `src/controllers/authController.ts` | Handlers HTTP para endpoints de auth |
| `src/middlewares/authValidators.ts` | Validações de input (express-validator) |
| `src/middlewares/authMiddleware.ts` | Middleware JWT (authenticate, optionalAuth, requireRole) |
| `src/routes/authRoutes.ts` | Definição das rotas /api/auth/* |

#### Arquivos modificados:

| Arquivo | Alteração |
|---------|----------|
| `prisma/schema.prisma` | Adicionado modelo `PasswordResetToken` |
| `src/types/index.ts` | Adicionados DTOs de autenticação |
| `src/app.ts` | Registradas rotas de autenticação |

### Frontend - Páginas de Auth e Perfil

#### Novos arquivos criados:

| Arquivo | Descrição |
|---------|-----------|
| `frontend/src/pages/LoginPage.jsx` | Página de login com formulário |
| `frontend/src/pages/RegisterPage.jsx` | Página de cadastro |
| `frontend/src/pages/ProfilePage.jsx` | Página de gerenciamento de conta |

#### Arquivos modificados:

| Arquivo | Alteração |
|---------|----------|
| `frontend/src/App.jsx` | Adicionadas rotas /login, /register, /profile |
| `frontend/src/services/api.js` | Adicionado authAPI + interceptor para Bearer token |
| `frontend/src/context/AuthContext.jsx` | Substituído demo por autenticação real |
| `frontend/src/components/layout/Layout.jsx` | Adicionado botão de perfil + logout |
| `frontend/src/components/review/ReviewForm.jsx` | Mostra login prompt se não autenticado |

---

## Endpoints Implementados

### POST /api/auth/register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"123456","name":"Nome"}'
```
- Valida email e senha (mín 6 caracteres)
- Verifica se email já existe
- Hash bcrypt com salt rounds 10
- Retorna usuário sem password

### POST /api/auth/login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"123456"}'
```
- Valida credenciais
- Compara senha com bcrypt
- Gera JWT (24h por padrão)
- Retorna token + dados usuário

### POST /api/auth/forgot-password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com"}'
```
- Busca usuário por email
- Gera token de 32 bytes hex
- Expira em 15 minutos
- Em dev: retorna token no response
- Em prod: deveria enviar email

### POST /api/auth/reset-password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"...","password":"novasenha123"}'
```
- Valida token
- Verifica expiração
- Hash nova senha
- Invalida token utilizado
- Impede reutilização

---

## Middleware de Autenticação

Disponível em `src/middlewares/authMiddleware.ts`:

```typescript
// Protege rotas - exige token válido
app.use('/api/protected', authenticate, routeHandler)

// Opcional - continua mesmo sem token
app.use('/api optional', optionalAuth, routeHandler)

// Role-based access
app.delete('/api/admin', authenticate, requireRole('ADMIN'), adminHandler)
```

**JwtPayload:**
```typescript
interface JwtPayload {
  userId: string;
  email: string;
  role: string; // 'USER' | 'ADMIN'
}
```

---

## Problemas Resolvidos

### 1. Prisma Client desatualizado
- **Problema:** Schema atualizado mas Prisma client não regenerou
- **Solução:** Executar `npx prisma generate` dentro do container Docker

### 2. Import path incorreto no ReviewForm
- **Problema:** `../context/AuthContext` resolvia para `components/context`
- **Solução:** Corrigido para `../../context/AuthContext`

### 3. Container não atualizava arquivos
- **Problema:** Volume não mapeava diretório prisma
- **Solução:** Adicionado mapeamento em docker-compose.yml:
```yaml
volumes:
  - ../../prisma:/app/prisma
```

### 4. Nome ignorado no registro
- **Problema:** Controller não passava name para service
- **Solução:** Atualizado authController para extrair e passar name

---

## Estrutura de Arquivos

```
urmovierates/
├── src/
│   ├── routes/authRoutes.ts          # Rotas /api/auth/*
│   ├── controllers/authController.ts # Handlers HTTP
│   ├── services/authService.ts       # Lógica de negócio
│   ├── middlewares/
│   │   ├── authMiddleware.ts          # JWT middleware
│   │   └── authValidators.ts          # Validações
│   ├── utils/
│   │   ├── jwt.ts                    # JWT helpers
│   │   └── crypto.ts                 # Token generation
│   └── types/index.ts                # Auth DTOs
├── prisma/schema.prisma              # PasswordResetToken model
└── frontend/src/
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   └── ProfilePage.jsx
    ├── context/AuthContext.jsx       # Auth real (não demo)
    └── services/api.js              # authAPI + interceptor
```

---

## Variáveis de Ambiente (JWT)

O sistema usa as variáveis já existentes no `.env`:

```env
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=24h
```

---

## Navegação do Frontend

Após login, o Layout mostra:
```
[Início] [👤 Perfil (João)] [🚪 Sair] [❤️ Favoritos]
```

Quando deslogado:
```
[Início] [🔑 Entrar] [❤️ Favoritos]
```

---

## Fluxo de Autenticação no Frontend

1. **Register:** `AuthContext.register(email, password)` → POST /auth/register → auto-login
2. **Login:** `AuthContext.login(email, password)` → POST /auth/login → salva token + user no localStorage
3. **Logout:** `AuthContext.logout()` → remove token + user do localStorage
4. **Request:** api interceptor lê token do localStorage → adiciona `Authorization: Bearer <token>`

---

## Validações Implementadas

| Campo | Regra |
|-------|-------|
| email | Válido, não vazio |
| password | Mínimo 6 caracteres |
| name (register) | Opcional |
| token (reset) | Não vazio, válido, não expirado |

---

## Testes Realizados

```bash
# Register com nome
curl -X POST http://localhost:3000/api/auth/register \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User"}'
# → {"data":{"email":"test@example.com","name":"Test User","role":"USER"}}

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"pass123"}'
# → {"data":{"token":"eyJ...","user":{...}}}

# Forgot (dev mode retorna token)
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -d '{"email":"test@example.com"}'
# → {"message":"Password reset token generated","token":"..."}

# Reset
curl -X POST http://localhost:3000/api/auth/reset-password \
  -d '{"token":"...","password":"newpass456"}'
# → {"message":"Password reset successful"}
```

---

## Issues em Aberto

1. **Excluir conta** - O botão existe na ProfilePage mas a implementação backend não existe
2. **Email em produção** - O forgot-password não envia email real, apenas retorna token em dev
3. **Refrescar token** - Não implementado (token expira em 24h)

---

## Notas para Futuras Implementações

- Considerar adicionar refresh token flow
- Implementar envio real de email com nodemailer ou similar
- Adicionar rate limiting para prevenir brute force
- Considerar adicionar verificação de email