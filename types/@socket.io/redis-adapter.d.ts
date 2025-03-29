declare module "@socket.io/redis-adapter" {
  import { Adapter } from "socket.io-adapter";
  import Redis from "ioredis";

  export function createAdapter(
    pubClient: Redis,
    subClient: Redis,
    opts?: {
      key?: string;
      requestsTimeout?: number;
    }
  ): Adapter;
}
