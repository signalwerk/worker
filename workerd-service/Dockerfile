FROM node:18-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libc6-compat \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install workerd
RUN npm install -g workerd@1.20250510.0

# Copy startup script and watcher script
COPY start.sh /app/start.sh
COPY restart-watcher.sh /app/restart-watcher.sh

# Make scripts executable
RUN chmod +x /app/start.sh /app/restart-watcher.sh

# Copy project files
COPY . .

# Expose the port
EXPOSE 8088

# Start services
CMD ["/app/start.sh"]