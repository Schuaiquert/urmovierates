# Logs

Este diretório contém os logs da aplicação.

## Arquivos

- `error.log` — Erros da aplicação (Winston)
- `activity.log` — Log de atividades admin (create/update/delete filmes)
- `access.log` — Log de acessos HTTP (Morgan)

## Formato

### error.log

```
[YYYY-MM-DD HH:mm:ss] LEVEL: mensagem
```

### activity.log

```
[YYYY-MM-DD HH:mm:ss] [ADMIN] userId: xxx | action: CREATE_MOVIE | target: movieId: xxx
```

## Rotação

Logs são rotacionados diariamente ( Winston DailyRotateFile ou logrotate ).
Tamanho máximo: 10MB por arquivo, mantidos por 14 dias.