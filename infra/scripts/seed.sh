#!/bin/bash

# urmovierates - Seed Script
# Popula o banco de dados com dados iniciais

set -e

# Verifica se DATABASE_URL está setado
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL não está definido. Carregando .env..."
    set -a
    source .env
    set +a
fi

echo "Executando seed..."

npx ts-node prisma/seed.ts

echo "✅ Seed concluído"