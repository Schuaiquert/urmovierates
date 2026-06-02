# ADR-003 — Escolha do Express.js como Framework

**Status:** Aceito  
**Data:** 2026-05-19

### Decisão

Utilizar **Express.js 4.x** como framework HTTP.

### Contexto

Precisa-se de um framework que:
- Seja minimalista e flexível
- Tenha vasto ecossistema de middlewares
- Seja amplamente documentado
- Possua baixa curva de entrada

### Considerações

**Prós:**
- Ecossistema maduro com milhares de middlewares
- Curva de aprendizado baixa
- Flexível para arquitetura em camadas
- Performance adequada para APIs REST

**Contras:**
- Não impõe estrutura → risco de desorganização
- Necessário configurar muitas things manualmente
- Sem validação nativa

### Consequências

- Middlewares: cors, helmet, compression, morgan
- Validação via express-validator ou zod
- Estrutura em camadas: Routes → Controllers → Services → Repositories
- Erro 404 para rotas não encontradas, erro 500 para exceções não tratadas