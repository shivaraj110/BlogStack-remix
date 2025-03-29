import { Server } from "socket.io";
import Redis from "ioredis";
import type { Server as HttpServer } from "node:http";

// Define interfaces
interface RoomMessage {
  roomName: string;
  message: string;
  sender: string;
  timestamp: Date;
}

// The main class for socket services
class SocketService {
  private _io: Server;
  private _pub: Redis;
  private _sub: Redis;
  private _activeRooms: Map<string, Set<string>>;

  constructor(httpServer: HttpServer) {
    console.log("Starting socket service...");

    this._io = new Server(httpServer, {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? process.env.APP_URL || false
            : "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    // Define Redis config
    const redisOptions = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 5,
      connectTimeout: 10000,
      tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    };

    // Initialize Redis clients
    try {
      this._pub = new Redis(redisOptions);
      this._sub = new Redis(redisOptions);
      this._activeRooms = new Map();

      // Error handlers
      this._pub.on("error", (err: Error) =>
        console.error("Redis Pub Error:", err)
      );
      this._sub.on("error", (err: Error) =>
        console.error("Redis Sub Error:", err)
      );

      // Connection success handlers
      this._pub.on("connect", () =>
        console.log("Redis Pub connected successfully")
      );
      this._sub.on("connect", () =>
        console.log("Redis Sub connected successfully")
      );

      // Subscribe to general messages channel
      this._sub.subscribe("MESSAGES");
    } catch (error) {
      console.error("Failed to initialize Redis clients:", error);
      throw new Error("Redis initialization failed");
    }
  }

  public getIo() {
    return this._io;
  }

  private handleRoomMessage(channel: string, message: string) {
    try {
      const roomName = channel.split(":")[1];
      this._io.to(roomName).emit("roomMessage", message);
    } catch (error) {
      console.error("Error handling room message:", error);
    }
  }

  // Initialize the listeners
  public initListeners() {
    console.log("Initializing socket listeners...");

    this._io.on("connection", (socket) => {
      console.log("New connection:", socket.id);

      socket.on("message", async (message: string) => {
        console.log("message received : " + message);
        this._pub.publish("MESSAGES", JSON.stringify({ message }));
      });

      // Handle joining rooms
      socket.on("joinRoom", async (roomName: string) => {
        try {
          // Leave previous rooms if any
          socket.rooms.forEach((room) => {
            if (room !== socket.id) {
              socket.leave(room);
              this._sub.unsubscribe(`ROOM:${room}`);
            }
          });

          // Join new room
          socket.join(roomName);
          console.log("client " + socket.id + " joined the room " + roomName);

          this._sub.subscribe(`ROOM:${roomName}`);

          // Track active users in room
          if (!this._activeRooms.has(roomName)) {
            this._activeRooms.set(roomName, new Set());
          }
          this._activeRooms.get(roomName)?.add(socket.id);

          // Notify room of new user
          this._io.to(roomName).emit("userJoined", {
            userId: socket.id,
            timestamp: Date.now(),
            room_name: roomName,
          });
        } catch (error) {
          console.error(`Error joining room ${roomName}:`, error);
          socket.emit("error", "Failed to join room");
        }
      });

      // Handle room messages
      socket.on("roomMessage", async (data: RoomMessage) => {
        try {
          const { roomName, message } = data;
          console.log("room message received : " + message);

          if (!socket.rooms.has(roomName)) {
            socket.emit("error", "You must join the room first");
            return;
          }

          const messageData = {
            message,
            sender: socket.id,
            timestamp: Date.now(),
          };

          await this._pub.publish(
            `ROOM:${roomName}`,
            JSON.stringify(messageData)
          );
        } catch (error) {
          console.error("Error sending room message:", error);
          socket.emit("error", "Failed to send message");
        }
      });

      // Handle leaving rooms
      socket.on("leaveRoom", (roomName: string) => {
        socket.leave(roomName);
        this._sub.unsubscribe(`ROOM:${roomName}`);
        this._activeRooms.get(roomName)?.delete(socket.id);

        this._io.to(roomName).emit("userLeft", {
          userId: socket.id,
          timestamp: Date.now(),
        });
        console.log(`user ${socket.id} left the room ${roomName}`);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        this._activeRooms.forEach((users, roomName) => {
          if (users.has(socket.id)) {
            users.delete(socket.id);
            this._io.to(roomName).emit("userLeft", {
              userId: socket.id,
              timestamp: Date.now(),
            });
          }
        });
        console.log("User disconnected:", socket.id);
      });
    });

    // Handle Redis messages
    this._sub.on("message", (channel: string, message: string) => {
      if (channel === "MESSAGES") {
        this._io.emit("message", message);
        console.log("Message sent to all servers!");
      } else if (channel.startsWith("ROOM:")) {
        this.handleRoomMessage(channel, message);
      }
    });
  }
}

export default SocketService;
