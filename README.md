# Distributed Token Bucket Rate Limiter

A Redis-backed distributed rate limiter for Node.js and Express APIs using the **Token Bucket algorithm**, **Redis Lua scripts**, and **Docker**.

The project limits requests on a per-client basis, supports controlled bursts, automatically refills tokens over time, and returns standard HTTP rate-limit information when requests are accepted or rejected.

## Features

- Token Bucket rate-limiting algorithm
- Redis-backed shared state
- Atomic token operations using Redis Lua scripts
- Per-client rate limiting using IP address
- Configured for 10 requests of burst capacity
- Token refill rate of 1 token per second
- HTTP `429 Too Many Requests` responses
- `X-RateLimit-Limit` header
- `X-RateLimit-Remaining` header
- `Retry-After` header
- Automatic Redis key expiration after 1 hour
- Dockerized Node.js application
- Docker Compose setup for Node.js + Redis

## Architecture

```text
                    HTTP Request
                         |
                         v
                +------------------+
                |  Express Server  |
                +------------------+
                         |
                         v
                +------------------+
                |  Rate Limiter    |
                |   Middleware     |
                +------------------+
                         |
                         v
                +------------------+
                |   Redis Lua      |
                |     Script       |
                +------------------+
                         |
              +----------+----------+
              |                     |
              v                     v
       Token Available       No Token Available
              |                     |
              v                     v
          HTTP 200              HTTP 429
```

Redis stores the token bucket state for each client, allowing multiple application instances to share the same rate-limit state.

## How the Token Bucket Works

Each client gets a bucket with:

- **Capacity:** 10 tokens
- **Refill rate:** 1 token per second
- **Cost per request:** 1 token

A new client starts with a full bucket.

When a request arrives:

1. The client's bucket is retrieved from Redis.
2. Tokens are refilled based on the elapsed time.
3. The bucket is capped at its maximum capacity.
4. If at least one token is available, one token is consumed.
5. If no token is available, the request is rejected with HTTP `429`.

Because tokens accumulate up to the bucket capacity, the system allows short bursts while still controlling the long-term request rate.

## Why Redis?

Redis is used to store rate-limit state because it provides:

- Fast in-memory operations
- Shared state across application instances
- Atomic operations
- Built-in key expiration
- Simple integration with Node.js

Using local application memory would make the limiter unreliable when multiple instances of the API are running because each instance would maintain its own independent bucket.

## Why Redis Lua?

The token refill and consumption process involves multiple operations.

Without atomic execution, concurrent requests could potentially:

```text
Request A -> Read tokens
Request B -> Read tokens
Request A -> Consume token
Request B -> Consume token
```

This can result in incorrect rate-limit state.

The Redis Lua script performs the refill, availability check, token consumption, and state update as one atomic Redis operation.

## API

### GET `/`

Returns a successful response when the client has an available token.

```http
GET /
```

Example successful response:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
```

```json
{
  "message": "Request Allowed."
}
```

### Rate Limit Exceeded

When the bucket is empty:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
Retry-After: 1
```

```json
{
  "error": "Too many requests.",
  "retryAfter": 1
}
```

## Project Structure

```text
src/
├── server.js          # Express application and server startup
├── redis.js           # Redis client and connection
├── tokenBucket.js     # Token bucket algorithm and Lua script
└── rateLimiter.js     # Express rate-limiting middleware
```

## Running with Docker

### Prerequisites

- Docker
- Docker Compose

### Start the application

```bash
docker compose up --build
```

The application will be available at:

```text
http://localhost:3000
```

Redis runs as a separate Docker container and is connected to the application through the Docker Compose network.

### Stop the application

```bash
docker compose down
```

## Running Without Docker

Install dependencies:

```bash
npm install
```

Start Redis locally and run:

```bash
node src/server.js
```

The application expects Redis at:

```text
redis://localhost:6379
```

The Redis connection can also be configured using the `REDIS_URL` environment variable.

## Testing

Send a request:

```bash
curl -i http://localhost:3000/
```

The response includes the current rate-limit information.

To test rate limiting, send multiple requests quickly. Once the bucket is exhausted, the API returns:

```text
HTTP/1.1 429 Too Many Requests
```

with a `Retry-After` header indicating approximately how long the client should wait before retrying.

## Technologies Used

- Node.js
- Express.js
- Redis
- Lua
- Docker
- Docker Compose

## Future Scaling Considerations

For a production deployment, the system could be extended with:

- Redis Cluster for larger-scale deployments
- API-key or user-based rate limiting
- Reverse-proxy integration
- Rate-limit monitoring and metrics
- Distributed observability
- Configurable bucket capacity and refill rates
- Redis connection pooling and script caching

## License

This project is available for educational and portfolio purposes.
