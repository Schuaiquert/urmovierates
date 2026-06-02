# ADR-004 — Estrutura de Pastas

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Adotar estrutura de pastas **baseada em features/camadas** com separação clara de responsabilidades.

### Contexto

O projeto necessita de:
- Escalabilidade para múltiplos módulos
- Testabilidade facilitada
- Documentação organizada
- Contexto dedicado para IA

### Considerações

**Prós:**
- Separação clara de responsabilidades (SoC)
- Easy to locate files by context
- Modularização natural
- Pasta `docs/` dedicada para documentação

**Contras:**
- Estrutura mais verbosa que flat structure
- Overhead inicial para projetos pequenos

### Consequências

- Código fonte em `src/`
- Documentação em `docs/`
- Módulo de IA em `src/ai/`
- Logs em `src/logs/`
- Docker configs isolados por ambiente em `docker/{env}/`