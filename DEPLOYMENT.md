# Production Deployment Guide: Socket.IO with Redis

This guide provides instructions for deploying the BlogStack application with Socket.IO and Redis in a production environment.

## Prerequisites

- Node.js 20.x or later
- Redis server (standalone, Sentinel, or Cluster)
- Load balancer with WebSocket support (e.g., Nginx, HAProxy)
- SSL certificate for secure WebSocket connections

## Deployment Architecture

For high-availability and scalability, we recommend the following architecture:

```
                           ┌─────────────┐
                           │   Load      │
                           │  Balancer   │ (SSL termination)
                           └──────┬──────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
         ┌───────▼──────┐ ┌───────▼──────┐ ┌───────▼──────┐
         │  App Server  │ │  App Server  │ │  App Server  │
         │  (Node.js)   │ │  (Node.js)   │ │  (Node.js)   │
         └───────┬──────┘ └───────┬──────┘ └───────┬──────┘
                 │                │                │
                 └────────────────┼────────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │  Redis Sentinel   │
                        │   or Cluster      │
                        └───────────────────┘
```

## Environment Variables

Configure the following environment variables on your production servers:

```bash
# Required
NODE_ENV=production
REDIS_URL=redis://user:password@your-redis-host:6379 # Simple Redis setup
APP_URL=https://yourdomain.com

# Optional (for Sentinel or Cluster)
REDIS_MASTER_NAME=mymaster # For Sentinel setup
REDIS_PASSWORD=your-password # If Redis requires authentication
```

## Load Balancer Configuration

### Nginx Configuration Example

```nginx
upstream app_servers {
    # Enable sticky sessions using IP hash
    ip_hash;
    server app1.internal:3000;
    server app2.internal:3000;
    server app3.internal:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Regular HTTP requests
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### HAProxy Configuration Example

```
frontend https_frontend
    bind *:443 ssl crt /path/to/cert.pem
    mode http
    option forwardfor

    # WebSocket and HTTP traffic
    acl is_websocket hdr(Upgrade) -i WebSocket
    acl is_websocket hdr_beg(Host) -i ws

    use_backend ws_backend if is_websocket
    default_backend http_backend

backend ws_backend
    mode http
    balance source  # Sticky sessions based on client IP
    option forwardfor
    option http-server-close
    option httpchk GET /health-check
    http-check expect status 200

    server app1 app1.internal:3000 check
    server app2 app2.internal:3000 check
    server app3 app3.internal:3000 check

backend http_backend
    mode http
    balance roundrobin
    option forwardfor
    option httpchk GET /health-check
    http-check expect status 200

    server app1 app1.internal:3000 check
    server app2 app2.internal:3000 check
    server app3 app3.internal:3000 check
```

## Deployment Steps

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Deploy to app servers**:
   Copy the built application to each app server.

3. **Start each instance**:

   ```bash
   NODE_ENV=production REDIS_URL=redis://your-redis-host:6379 npm start
   ```

4. **Monitor performance**:
   Set up monitoring for both Node.js and Redis instances to track performance.

## Health Checks

Create a health check endpoint in your application to verify both the application and Redis connection:

```typescript
app.get("/health-check", async (req, res) => {
  try {
    // Check Redis connection
    const redisPubClient = new Redis(process.env.REDIS_URL);
    await redisPubClient.ping();
    redisPubClient.disconnect();

    res.status(200).send({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).send({ status: "error", message: error.message });
  }
});
```

## Scaling Considerations

- **Memory Usage**: Monitor Redis memory usage. Configure `maxmemory` and an appropriate eviction policy.
- **Connection Limits**: Redis has a default connection limit. Adjust `maxclients` based on your expected load.
- **Node.js Instances**: Each Node.js instance maintains connections to Redis. Scale gradually and monitor.

## Troubleshooting

### Connection Issues

If clients cannot connect:

1. Verify WebSocket support in your load balancer
2. Check for correct proxy headers
3. Ensure timeouts are set appropriately for long-lived connections

### Redis Issues

If Redis becomes a bottleneck:

1. Consider upgrading to Redis Cluster for horizontal scaling
2. Monitor `connected_clients` and `blocked_clients` metrics
3. Use Redis Sentinel for high availability

## Security Best Practices

1. Always use SSL/TLS for WebSocket connections
2. Set strong Redis passwords and use ACLs if available
3. Consider using Redis AUTH and enabling protected mode
4. Implement rate limiting for Socket.IO connections
5. Use a private subnet for Redis, only accessible by app servers
