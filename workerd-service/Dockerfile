FROM node:18-slim

WORKDIR /app

# Install dependencies needed for workerd
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install workerd
RUN npm install -g workerd@1.20250510.0

# Verify workerd is installed and available
RUN which workerd

# Copy project files
COPY . .

# Expose the port
EXPOSE 8088

# Start workerd
CMD ["sh", "-c", "/usr/local/bin/workerd serve /app/DATA/config.capnp"]