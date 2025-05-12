FROM node:18-slim

WORKDIR /app

# Install essential packages for restarting containers
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["node", "index.js"] 