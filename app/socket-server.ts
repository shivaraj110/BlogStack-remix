import { Server as SocketIOServer } from "socket.io";
import type { Server } from "node:http";
import { prisma } from "./.server/db";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

// Define TypeScript interfaces for better type safety
interface UserConnection {
  userId: string;
  socketIds: Set<string>;
}

interface MessageData {
  senderId: string;
  receiverId: string;
  content: string;
  conversationId?: number;
}

interface TypingData {
  conversationId: number;
  userId: string;
}

interface ReadData {
  userId: string;
  conversationId: number;
}

// Add new interfaces for edit and delete operations
interface EditMessageData {
  messageId: number;
  content: string;
  conversationId: number;
  userId: string;
}

interface DeleteMessageData {
  messageId: number;
  conversationId: number;
  userId: string;
}

// Add new interface for friend requests
interface FriendRequestData {
  fromUserId: string;
  toUserId: string;
}

// Socket.IO server instance
let io: SocketIOServer | null = null;

// Store user connections with Map for better performance
const userConnections = new Map<string, Set<string>>();

/**
 * Get all socket IDs for a specific user
 */
const getUserSocketIds = (userId: string): string[] => {
  return Array.from(userConnections.get(userId) || []);
};

/**
 * Add a socket connection to a user's session
 */
const addUserSocket = (userId: string, socketId: string): void => {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)?.add(socketId);
  console.log(`User ${userId} connected with socket ${socketId}`);
  console.log(
    `User ${userId} has ${userConnections.get(userId)?.size} active connections`
  );
};

/**
 * Remove a socket connection from a user's session
 * @returns boolean indicating if this was the user's last connection
 */
const removeUserSocket = (socketId: string, userId: string): boolean => {
  const sockets = userConnections.get(userId);
  if (!sockets) return true;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    userConnections.delete(userId);
    return true; // Last connection removed
  }
  return false; // User still has other connections
};

/**
 * Find or create a conversation between two users
 */
async function findOrCreateConversation(userId1: string, userId2: string) {
  try {
    // Try to find existing conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { users: { some: { identifier: userId1 } } },
          { users: { some: { identifier: userId2 } } },
        ],
      },
    });

    if (existingConversation) {
      return { conversation: existingConversation, isNew: false };
    }

    // Verify both users exist
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { identifier: userId1 } }),
      prisma.user.findUnique({ where: { identifier: userId2 } }),
    ]);

    if (!user1 || !user2) {
      throw new Error(`One or both users not found: ${userId1}, ${userId2}`);
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [{ identifier: userId1 }, { identifier: userId2 }],
        },
      },
    });

    return { conversation: newConversation, isNew: true };
  } catch (error) {
    console.error("Error in findOrCreateConversation:", error);
    throw error;
  }
}

/**
 * Initialize Socket.IO server
 */
export async function initSocketServer(server: Server) {
  if (io) return io;

  console.log("Initializing Socket.IO server...");

  // Create new Socket.IO server with secure configuration
  io = new SocketIOServer(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.APP_URL || false
          : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 10000,
    cookie:
      process.env.NODE_ENV === "production"
        ? { name: "io", secure: true }
        : false,
    maxHttpBufferSize: 1e6, // 1MB
  });

  // Set up Redis adapter for production or when testing Redis in development
  if (
    process.env.NODE_ENV === "production" ||
    process.env.TEST_REDIS === "true"
  ) {
    console.log("Redis adapter configuration starting...");
    try {
      // Redis configuration (similar to your original implementation)
      const redisOptions = {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379"),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000); // Retry with backoff
          return delay;
        },
        maxRetriesPerRequest: 5,
        connectTimeout: 10000,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      };

      console.log(
        `Connecting to Redis at: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
      );
      console.log(
        `Redis TLS enabled: ${process.env.REDIS_TLS === "true" ? "Yes" : "No"}`
      );

      // Create Redis clients for pub/sub using ioredis
      const pubClient = new Redis(redisOptions);
      const subClient = pubClient.duplicate();

      // Handle Redis connection events
      pubClient.on("connect", () => {
        console.log("Redis pub client connected successfully");
      });

      subClient.on("connect", () => {
        console.log("Redis sub client connected successfully");
      });

      // Handle Redis connection errors
      pubClient.on("error", (err: Error) => {
        console.error("Redis pub client error:", err);
      });

      subClient.on("error", (err: Error) => {
        console.error("Redis sub client error:", err);
      });

      // Apply Redis adapter to Socket.IO server
      io.adapter(createAdapter(pubClient, subClient));
      console.log("Socket.IO now using Redis adapter for scaling");
    } catch (error) {
      console.error("Failed to initialize Redis adapter:", error);
      console.warn("Falling back to in-memory adapter");
    }
  } else {
    console.log("Using default in-memory adapter (not using Redis)");
  }

  // Set up connection handler
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    let currentUserId: string | null = null;

    // Handle user connection
    socket.on("user_connected", async (userId: string) => {
      try {
        if (!userId) {
          socket.emit("error", { message: "Invalid user ID" });
          return;
        }

        currentUserId = userId;
        addUserSocket(userId, socket.id);

        // Notify other users about online status
        socket.broadcast.emit("user_status", { userId, status: "online" });

        // Join conversation rooms
        await joinUserConversations(socket, userId);
      } catch (error) {
        console.error(`Error in user_connected handler:`, error);
        socket.emit("error", { message: "Failed to initialize connection" });
      }
    });

    // Handle private message
    socket.on(
      "private_message",
      async (data: MessageData, callback: (response: any) => void) => {
        try {
          const { senderId, receiverId, content, conversationId } = data;

          if (!senderId || !receiverId || !content) {
            const response = {
              status: "error",
              message: "Invalid message data",
            };
            if (typeof callback === "function") callback(response);
            return;
          }

          console.log(
            `Handling message from ${senderId} to ${receiverId}: ${content.substring(
              0,
              20
            )}${content.length > 20 ? "..." : ""}`
          );

          // Find or create conversation
          let targetConversation;
          let isNewConversation = false;

          if (!conversationId) {
            const result = await findOrCreateConversation(senderId, receiverId);
            targetConversation = result.conversation;
            isNewConversation = result.isNew;
          } else {
            targetConversation = { id: conversationId };
          }

          // Join conversation room if new
          if (isNewConversation) {
            await handleNewConversationRoom(
              socket,
              targetConversation.id,
              senderId,
              receiverId
            );
          }

          // Save message to database
          const message = await prisma.message.create({
            data: {
              content,
              senderId,
              receiverId,
              conversationId: targetConversation.id,
            },
            include: {
              sender: {
                select: {
                  name: true,
                  pfpUrl: true,
                },
              },
            },
          });

          console.log(`Created message in DB with ID: ${message.id}`);

          // Update conversation's timestamp
          await prisma.conversation.update({
            where: { id: targetConversation.id },
            data: { updatedAt: new Date() },
          });

          // Prepare message for broadcast
          const messageToSend = {
            ...message,
            conversationId: targetConversation.id,
          };

          // Broadcast to conversation room
          const roomName = `conversation:${targetConversation.id}`;
          io?.to(roomName).emit("message_received", messageToSend);
          console.log(`Broadcasted message to room ${roomName}`);

          // Return success response
          if (typeof callback === "function") {
            callback({
              status: "success",
              messageId: message.id,
              conversationId: targetConversation.id,
            });
          }
        } catch (error) {
          console.error("Error sending private message:", error);
          socket.emit("error", { message: "Failed to send message" });

          if (typeof callback === "function") {
            callback({ status: "error", message: "Failed to send message" });
          }
        }
      }
    );

    // Handle typing indicator
    socket.on("typing", (data: TypingData) => {
      try {
        const { conversationId, userId } = data;
        const roomName = `conversation:${conversationId}`;

        // Emit typing event to the conversation room
        socket.to(roomName).emit("user_typing", { conversationId, userId });
      } catch (error) {
        console.error("Error handling typing event:", error);
      }
    });

    // Handle read message status update
    socket.on("mark_as_read", async (data: ReadData) => {
      try {
        const { userId, conversationId } = data;

        // Mark messages as read
        await prisma.message.updateMany({
          where: {
            conversationId,
            receiverId: userId,
            read: false,
          },
          data: {
            read: true,
          },
        });

        // Broadcast read status to conversation room
        const roomName = `conversation:${conversationId}`;
        socket.to(roomName).emit("messages_read", { userId, conversationId });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to update read status" });
      }
    });

    // Handle joining a specific conversation
    socket.on("join_conversation", (conversationId: number) => {
      try {
        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Handle message editing
    socket.on("edit_message", async (data: EditMessageData) => {
      try {
        const { messageId, content, conversationId, userId } = data;

        // Verify the message exists and belongs to the user
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            senderId: userId,
            conversationId,
          },
        });

        if (!message) {
          console.error(
            `Message ${messageId} not found or not owned by user ${userId}`
          );
          socket.emit("error", { message: "Cannot edit this message" });
          return;
        }

        // Update the message content
        await prisma.message.update({
          where: { id: messageId },
          data: { content },
        });

        console.log(`Message ${messageId} edited by user ${userId}`);

        // Broadcast the edit to all users in the conversation
        const roomName = `conversation:${conversationId}`;
        io?.to(roomName).emit("message_edited", {
          messageId,
          content,
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("Error editing message:", error);
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    // Handle message deletion
    socket.on("delete_message", async (data: DeleteMessageData) => {
      try {
        const { messageId, conversationId, userId } = data;

        // Verify the message exists and belongs to the user
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            senderId: userId,
            conversationId,
          },
        });

        if (!message) {
          console.error(
            `Message ${messageId} not found or not owned by user ${userId}`
          );
          socket.emit("error", { message: "Cannot delete this message" });
          return;
        }

        // Delete the message
        await prisma.message.delete({
          where: { id: messageId },
        });

        console.log(`Message ${messageId} deleted by user ${userId}`);

        // Broadcast the deletion to all users in the conversation
        const roomName = `conversation:${conversationId}`;
        io?.to(roomName).emit("message_deleted", {
          messageId,
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // Handle friend requests
    socket.on("send_friend_request", async (data: FriendRequestData) => {
      try {
        const { fromUserId, toUserId } = data;

        // Check if users exist
        const [sender, receiver] = await Promise.all([
          prisma.user.findUnique({ where: { identifier: fromUserId } }),
          prisma.user.findUnique({ where: { identifier: toUserId } }),
        ]);

        if (!sender || !receiver) {
          socket.emit("error", { message: "One or both users not found" });
          return;
        }

        // Check if friend request already exists
        const existingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: fromUserId, receiverId: toUserId },
              { senderId: toUserId, receiverId: fromUserId },
            ],
          },
        });

        if (existingRequest) {
          socket.emit("error", { message: "Friend request already exists" });
          return;
        }

        // Create friend request
        const friendRequest = await prisma.friendRequest.create({
          data: {
            senderId: fromUserId,
            receiverId: toUserId,
            status: "PENDING",
          },
        });

        // Notify the receiver
        const receiverSockets = getUserSocketIds(toUserId);
        receiverSockets.forEach((socketId) => {
          io?.to(socketId).emit("friend_request_received", {
            requestId: friendRequest.id,
            fromUserId,
            fromUserName: sender.name,
          });
        });

        // Confirm to sender
        socket.emit("friend_request_sent", {
          requestId: friendRequest.id,
          toUserId,
          status: "PENDING",
        });
      } catch (error) {
        console.error("Error handling friend request:", error);
        socket.emit("error", { message: "Failed to send friend request" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      try {
        if (currentUserId) {
          const isLastConnection = removeUserSocket(socket.id, currentUserId);

          if (isLastConnection) {
            // Only broadcast offline status if this was the last connection
            socket.broadcast.emit("user_status", {
              userId: currentUserId,
              status: "offline",
            });
            console.log(
              `User ${currentUserId} went offline (all connections closed)`
            );
          } else {
            console.log(
              `User ${currentUserId} still has other active connections`
            );
          }
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  return io;
}

/**
 * Get the existing Socket.IO server instance
 */
export function getSocketServer() {
  return io;
}

/**
 * Join a user to all their conversation rooms
 */
async function joinUserConversations(socket: any, userId: string) {
  try {
    const userConversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: {
            identifier: userId,
          },
        },
      },
      select: { id: true },
    });

    // Join all conversation rooms
    userConversations.forEach((conversation) => {
      const roomName = `conversation:${conversation.id}`;
      socket.join(roomName);
    });

    console.log(
      `User ${userId} joined ${userConversations.length} conversation rooms`
    );
    return userConversations.length;
  } catch (error) {
    console.error(`Error joining user conversations:`, error);
    throw error;
  }
}

/**
 * Handle joining a new conversation room
 */
async function handleNewConversationRoom(
  socket: any,
  conversationId: number,
  senderId: string,
  receiverId: string
) {
  try {
    const roomName = `conversation:${conversationId}`;

    // Join sender socket
    socket.join(roomName);
    console.log(
      `Sender socket ${socket.id} joined new conversation room ${roomName}`
    );

    // Join receiver's sockets if they're online
    getUserSocketIds(receiverId).forEach((receiverSocketId) => {
      const receiverSocket = io?.sockets.sockets.get(receiverSocketId);
      if (receiverSocket) {
        receiverSocket.join(roomName);
        console.log(
          `Receiver socket ${receiverSocketId} joined new conversation room ${roomName}`
        );
      }
    });

    // Notify receiver about new conversation
    getUserSocketIds(receiverId).forEach((receiverSocketId) => {
      io?.to(receiverSocketId).emit("new_conversation", {
        conversationId,
        withUserId: senderId,
      });
    });
  } catch (error) {
    console.error(`Error handling new conversation room:`, error);
    throw error;
  }
}
