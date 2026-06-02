#!/bin/bash

# urmovierates - Docker Up Script
# Sobe os containers do ambiente especificado

set -e

ENV=${1:-dev}

case $ENV in
    dev)
        COMPOSE_FILE="docker/dev/docker-compose.yml"
        ;;
    staging)
        COMPOSE_FILE="docker/staging/docker-compose.yml"
        ;;
    prod)
        COMPOSE_FILE="docker/prod/docker-compose.yml"
        ;;
    *)
        echo "Uso: $0 [dev|staging|prod]"
        exit 1
        ;;
esac

# Verifica docker-compose
if command -v docker-compose &> /dev/null; then
    DC="docker-compose"
elif docker compose version &> /dev/null; then
    DC="docker compose"
else
    echo "docker-compose não encontrado."
    exit 1
fi

echo "Subindo ambiente: $ENV"
echo "Arquivo: $COMPOSE_FILE"

$DC -f "$COMPOSE_FILE" up -d

echo "✅ Containers iniciados"
echo ""
echo "Ambiente: $ENV"
case $ENV in
    dev)   echo "API: http://localhost:3000" ;;
    staging) echo "API: http://localhost:3001" ;;
    prod)  echo "API: http://localhost:3002" ;;
esac