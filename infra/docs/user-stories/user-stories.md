# user-stories — urmovierates

**Projeto:** urmovierates  
**Data:** 2026-05-19

---

## US001 — Cadastro de Usuário

**Como** um visitante  
**Eu quero** me cadastrar no sistema  
**Para que** eu possa acessar minha conta e avaliar filmes

### Critérios de Aceitação

- [ ] Campos obrigatórios: nome, email, senha
- [ ] Email deve ser único no sistema
- [ ] Senha deve ter no mínimo 8 caracteres
- [ ] Senha armazenada com hash bcrypt
- [ ] Retornar token JWT após cadastro

### Regras de Negócio

- Email não pode ser duplicado
- Nome não pode ser vazio

---

## US002 — Login de Usuário

**Como** um usuário cadastrado  
**Eu quero** fazer login no sistema  
**Para que** eu possa acessar minha conta

### Critérios de Aceitação

- [ ] Login com email e senha
- [ ] Retornar token JWT válido
- [ ] Retornar erro 401 se credenciais inválidas

### Regras de Negócio

- Token expira em 24h
- Máximo 5 tentativas de login falhadas → bloqueio de 15 min

---

## US003 — Visualizar Filmes

**Como** um usuário  
**Eu quero** visualizar a lista de filmes  
**Para que** eu possa escolher o que avaliar

### Critérios de Aceitação

- [ ] Listar todos os filmes cadastrados
- [ ] Mostrar título, sinopse, poster, nota média
- [ ] Paginação (10 filmes por página)
- [ ] Busca por título

### Regras de Negócio

- Filmes com status "inativo" não aparecem na listagem pública
- Ordenação padrão: por título (A-Z)

---

## US004 — Registrar Avaliação

**Como** um usuário autenticado  
**Eu quero** avaliar um filme  
**Para que** eu possa compartilhar minha opinião

### Critérios de Aceitação

- [ ] Avaliar com nota de 1 a 5 estrelas
- [ ] Adicionar texto de avaliação (opcional, máx 1000 chars)
- [ ] Uma avaliação por usuário por filme
- [ ] Editar avaliação existente
- [ ] Excluir minha própria avaliação

### Regras de Negócio

- Nota deve ser entre 1 e 5
- Usuário não pode avaliar o mesmo filme twice
- Cálculo de nota média atualizado em tempo real

---

## US005 — Gerenciar Filmes (Admin)

**Como** um administrador  
**Eu quero** gerenciar o catálogo de filmes  
**Para que** eu possa manter o conteúdo atualizado

### Critérios de Aceitação

- [ ] **Criar** filme: título, sinopse, ano, poster, trailer URL
- [ ] **Editar** qualquer informação do filme
- [ ] **Excluir** filme (soft delete — marca como inativo)
- [ ] **Listar** todos os filmes incluindo inativos
- [ ] **Ativar/Desativar** filme

### Regras de Negócio

- Apenas ADMIN pode executar estas operações
- Todas as ações de admin são logadas em `activity.log`
- Exclusão é soft delete (preserva histórico de avaliações)

---

## US006 — Perfil do Usuário

**Como** um usuário autenticado  
**Eu quero** visualizar meu perfil  
**Para que** eu possa ver meu histórico de avaliações

### Critérios de Aceitação

- [ ] Ver meu nome e email
- [ ] Ver lista de minhas avaliações
- [ ] Editar minha senha
- [ ] Editar meu nome

### Regras de Negócio

- Não expor hash da senha em nenhuma circunstância
- Histórico ordenado por data (mais recente primeiro)

---

## US007 — Autenticação de Admin

**Como** um administrador  
**Eu quero** fazer login no sistema  
**Para que** eu possa gerenciar o catálogo

### Critérios de Aceitação

- [ ] Login com credenciais admin
- [ ] Retornar token JWT com role ADMIN
- [ ] Middleware `admin` verifica role antes de permitir ações

### Regras de Negócio

- Admin verificado via campo `role` na tabela Users
- Papel ADMIN é criado manualmente no seed

---

## Matriz de Permissões

| Recurso | Visitante | Usuário | Admin |
|---------|-----------|---------|-------|
| Ver filmes | ✅ | ✅ | ✅ |
| Criar conta | ✅ | — | — |
| Fazer login | ✅ | ✅ | ✅ |
| Registrar avaliação | ❌ | ✅ | ✅ |
| Editar própria avaliação | ❌ | ✅ | ✅ |
| Criar filme | ❌ | ❌ | ✅ |
| Editar filme | ❌ | ❌ | ✅ |
| Excluir filme | ❌ | ❌ | ✅ |
| Ver perfil | ❌ | ✅ | ✅ |