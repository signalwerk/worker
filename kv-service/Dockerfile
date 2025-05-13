FROM node:18-slim

WORKDIR /app

# Install required system dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with rebuild
RUN npm ci

# Copy application code
COPY . .

EXPOSE 3001

CMD ["node", "index.js"] 