FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm install --production

# Copia e compila código fonte
COPY . .
RUN npx prisma generate
RUN npm run build

# Remove código fonte, mantém apenas dist
RUN rm -rf src tests

# Expõe porta
EXPOSE 3002

# Start produção
CMD ["npm", "run", "start"]