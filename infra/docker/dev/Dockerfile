FROM node:20

WORKDIR /app

# Instala dependências do sistema (OpenSSL para Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Instala dependências globais
RUN npm install -g typescript ts-node nodemon

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia código fonte
COPY . .

# Gera cliente Prisma
RUN npx prisma generate

# Expõe porta
EXPOSE 3000

# Watch mode com nodemon
CMD ["npm", "run", "dev"]