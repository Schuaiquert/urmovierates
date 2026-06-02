FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia código fonte
COPY . .

# Gera cliente Prisma
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expõe porta
EXPOSE 3001

# Start produção
CMD ["npm", "run", "start"]