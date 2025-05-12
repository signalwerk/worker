FROM node:18-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

COPY package*.json ./

# Install dependencies and force rebuild of better-sqlite3
RUN npm ci --build-from-source

COPY . .

EXPOSE 3001

CMD ["node", "index.js"] 