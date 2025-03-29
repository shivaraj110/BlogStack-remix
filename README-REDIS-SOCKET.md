# Redis Socket.IO Adapter for Production

This project uses Redis as a Socket.IO adapter for horizontal scaling in production. This allows multiple server instances to communicate with each other, making the application scalable across multiple nodes.

## Implementation Details

We use the following packages:

- `@socket.io/redis-adapter`: The official Socket.IO adapter for Redis
- `ioredis`: A robust, full-featured Redis client that is more reliable and offers better performance than the standard redis package

## Why Redis?

When running Socket.IO in production with multiple server instances (horizontal scaling), you need a way for all instances to communicate with each other. Redis acts as a message broker between these instances, ensuring that events emitted on one server are properly broadcast to all connected clients, even if they're connected to different server instances.

## Why ioredis?

We've chosen ioredis over the standard redis package for the following benefits:

- Built-in reconnection with backoff strategy
- Better error handling
- Support for Sentinel and Cluster
- Promise-based API alongside callbacks
- More comprehensive TypeScript support
- Active maintenance and community support

## Setup Instructions

### 1. Provision a Redis Instance

You have several options for Redis:

- Managed Redis services (Redis Cloud, AWS ElastiCache, Azure Cache for Redis, etc.)
- Self-hosted Redis on your infrastructure
- Docker container for local development

### 2. Configure Environment Variables

Make sure to set the following environment variables in your production environment:

```
NODE_ENV=production
REDIS_URL=redis://user:password@your-redis-host:6379
APP_URL=https://your-domain.com
```

- `NODE_ENV`: Must be set to "production" to enable the Redis adapter
- `REDIS_URL`: Connection string for your Redis instance
- `APP_URL`: Your application's URL for CORS settings

### 3. Deployment Considerations

#### Sticky Sessions

For best performance, configure your load balancer to use sticky sessions (session affinity). This ensures that a client's requests are routed to the same server instance where they established their WebSocket connection.

#### Health Checks

Set up health checks on your load balancer to ensure traffic is only routed to healthy instances.

#### Scaling

When scaling horizontally:

1. Add more application instances as needed
2. Redis will handle the communication between them
3. Make sure all instances can access the Redis server

## Troubleshooting

If you encounter issues with Socket.IO in production:

1. Check Redis connection logs in your application
2. Verify that all environment variables are correctly set
3. Ensure your Redis instance is accessible from all application instances
4. Monitor Redis memory usage - if it gets too high, messages might be dropped

## Local Development with Redis

To test Redis adapter locally:

1. Run Redis in Docker:

   ```bash
   docker run --name redis -p 6379:6379 -d redis
   ```

2. Set environment variables:

   ```bash
   NODE_ENV=production
   REDIS_URL=redis://localhost:6379
   ```

3. Start your application and test with multiple instances to verify proper communication.

## Additional Resources

- [Socket.IO Redis Adapter Documentation](https://socket.io/docs/v4/redis-adapter/)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Documentation](https://redis.io/documentation)
