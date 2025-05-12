FROM node:18-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    procps \
    bash \
    && rm -rf /var/lib/apt/lists/*


COPY package.json package-lock.json* ./

# Install Node.js dependencies
RUN npm ci

# Copy project files
COPY . .

# Expose the workerd and restart service ports
EXPOSE 8088 3002

# Start services
CMD ["node", "index.js"] 