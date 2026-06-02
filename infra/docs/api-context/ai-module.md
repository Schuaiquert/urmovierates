# Módulo de IA — src/ai/

**Projeto:** urmovierates  
**Data:** 2026-05-19

---

## Visão Geral

O diretório `src/ai/` contém módulos dedicados para funcionalidades de inteligência artificial, incluindo geração de contexto para assistentes, documentação automática e assistentes virtuais.

---

## Estrutura

```
src/ai/
├── contextGenerator.ts    # Gera contexto estruturado para LLMs
├── assistant.ts          # Assistente virtual de suporte
├── docsGenerator.ts       # Geração automática de documentação
└── prompts/
    ├── system.md         # Prompts de sistema
    └── templates.md     # Templates para prompts
```

---

## contextGenerator.ts

Gera contexto estruturado do projeto para que LLMs (Claude, GPT, etc.) possam entender o projeto rapidamente.

**Output:** Markdown estruturado com:
- Visão geral do projeto
- Stack tecnológico
- Modelos de dados
- Endpoints da API
- Regras de negócio
- Status atual

**Uso:**
```typescript
import { generateContext } from './contextGenerator';

const context = await generateContext();
// Retorna string markdown com contexto completo
```

---

## assistant.ts

Assistente virtual que pode responder perguntas sobre o sistema, ajudar devs novos, e fornecer suporte contextual.

**Capacidades:**
- Explicar o projeto
- Guiar setup local
- Responder dúvidas sobre arquitetura
- Sugerir melhores práticas

---

## docsGenerator.ts

Gera documentação automaticamente baseando-se em:
- Schema do Prisma
- Rotas definidas
- Services implementados

**Output:** Arquivos markdown organizados na pasta `docs/`

---

## prompts/

### system.md

Prompts de sistema para configurar o comportamento dos assistentes.

### templates.md

Templates reutilizáveis para prompts de geração de documentação.

---

## Integrações Futuras

- [ ] Integração com OpenAI API para sinopses automáticas
- [ ] Recomendação de filmes via ML
- [ ] Análise de sentimentos em avaliações