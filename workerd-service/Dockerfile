FROM node:18-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    procps \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Install workerd
RUN npm install -g workerd@1.20250510.0

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

EXPOSE 8088 3042

# Start services
CMD ["node", "index.js"] 