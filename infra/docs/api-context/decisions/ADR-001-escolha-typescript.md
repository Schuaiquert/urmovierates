# ADR-001 — Escolha do TypeScript

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Utilizar **TypeScript 5.x** como linguagem principal do projeto.

### Contexto

Precisa-se de uma linguagem que ofereça:
- Tipagem estática para reduzir erros em tempo de execução
- Melhor suporte a IDEs e tooling
- Compatibilidade com o ecossistema Node.js

### Considerações

**Prós:**
- Tipagem estática catching erros durante desenvolvimento
- Autocomplete superior em IDEs
- Refactoring mais seguro
- Documentação via tipos

**Contras:**
- Curva de aprendizado para devs sem experiência TS
- Processo de build adicional (compilação)
- Configuração inicial

### Consequências

- Build pipeline inclui `tsc` (TypeScript compiler)
- Strict mode habilitado para máxima segurança de tipos
- Definições de tipos em `src/types/`