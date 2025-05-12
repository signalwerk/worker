# Worker Manager

A Docker Compose setup for managing Workerd workers with an admin interface and a standalone KV service.

## Services

This Docker Compose setup includes the following services:

1. **Worker Admin** - A Node.js service that provides an admin interface to manage workers.
2. **KV Service** - A standalone service that provides a key-value store for workers.
3. **Workerd** - The service that runs the Workerd runtime.

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Setup

1. Clone this repository.
2. Create the required directory structure:

```bash
mkdir -p admin/views/layouts admin/views/partials admin/templates kv-service workerd-service
```

3. Set up your environment variables by creating a `.env` file:

```
API_KEY=your_secure_api_key
```

4. Start the services:

```bash
docker-compose up -d
```

## Usage

Once the services are running, you can access:

- Admin Interface: http://localhost:3000
- KV Service API: http://localhost:3001
- Workerd: http://localhost:8088

### Security

The admin interface is secured by an API key that is set in the environment variables. You will be prompted to enter this key when accessing the admin interface. After successful authentication, the key is stored in a secure HTTP-only cookie.

### Admin Interface

The admin interface allows you to:

- View all workers
- Create new workers
- Edit existing workers
- Edit worker code with a built-in code editor
- Delete workers

When you make changes to workers, the system will:
1. Update the configuration files
2. Generate a new capnp configuration using Handlebars
3. Directly restart the workerd container to apply the changes

### KV Service API

The KV Service provides a RESTful API:

- `GET /kv/:key` - Get a value by key
- `POST /kv/:key` - Set a value (requires API key)
- `DELETE /kv/:key` - Delete a value (requires API key)
- `GET /kv` - List all keys (requires API key)

Authentication is done via the `X-API-Key` header.

## API

The admin interface provides a RESTful API:

- `GET /api/workers` - Get all workers
- `GET /api/workers/:name` - Get a specific worker
- `GET /api/workers/:name/code` - Get a worker's code
- `PUT /api/workers/:name/code` - Update a worker's code
- `POST /api/workers` - Create a new worker
- `PUT /api/workers/:name` - Update a worker
- `DELETE /api/workers/:name` - Delete a worker

Authentication is done via the `X-API-Key` header.

## Architecture

This system uses three Docker containers working together:

1. **worker-admin**: Provides a web interface and API for managing workers. Generates capnp configuration files based on worker data. This service also handles restarting the workerd container when changes are made.
2. **kv-service**: Provides key-value storage for workers.
3. **workerd**: Runs the Cloudflare Workers runtime using the generated configuration.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.

npx workerd serve config.capnp 


curl -X POST http://localhost:8088 -d "Hello2"


curl http://localhost:8088/w1