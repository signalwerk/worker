FROM node:18-slim

WORKDIR /app

# Install essential packages for restarting containers
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

    # Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

EXPOSE 3000

# Start services
CMD ["node", "index.js"] 