#!/bin/bash

# urmovierates - Setup Script
# Executa o setup inicial do projeto

set -e

echo "=========================================="
echo "  urmovierates - Setup Inicial"
echo "=========================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 20+ primeiro.${NC}"
    exit 1
fi

# Verifica Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado. Instale Docker primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js e Docker OK${NC}"

# Verifica docker-compose
if command -v docker-compose &> /dev/null; then
    DC="docker-compose"
elif docker compose version &> /dev/null; then
    DC="docker compose"
else
    echo -e "${RED}❌ docker-compose não encontrado.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ docker-compose OK${NC}"

# Copia .env se não existir
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env criado${NC}"
else
    echo -e "${GREEN}✅ .env já existe${NC}"
fi

# Instala dependências
echo -e "${YELLOW}📦 Instalando dependências npm...${NC}"
npm install

echo -e "${GREEN}✅ Dependências instaladas${NC}"

# Sobe containers
echo -e "${YELLOW}🐳 Subindo containers Docker...${NC}"
cd docker/dev
$DC up -d
cd ../..

# Aguarda PostgreSQL ficar disponível
echo -e "${YELLOW}⏳ Aguardando PostgreSQL...${NC}"
sleep 5

# Executa migrações
echo -e "${YELLOW}🔄 Executando migrações Prisma...${NC}"
npx prisma migrate dev --name init

# Popula banco
echo -e "${YELLOW}🌱 Populando banco com seed...${NC}"
npx ts-node prisma/seed.ts

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  🎉 Setup concluído com sucesso!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Para iniciar o desenvolvimento:"
echo "  cd docker/dev && $DC up"
echo "  (ou) npm run dev"
echo ""
echo "Acesse:"
echo "  - API:       http://localhost:3000"
echo "  - Prisma:    npx prisma studio"