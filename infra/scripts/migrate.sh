#!/bin/bash

# urmovierates - Migrate Script
# Executa migrações Prisma

set -e

ENV=${1:-dev}

# Verifica se DATABASE_URL está setado
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL não está definido. Carregando .env..."
    set -a
    source .env
    set +a
fi

echo "Executando migração para ambiente: $ENV"

npx prisma migrate dev --name "$ENV"

echo "✅ Migração concluída"