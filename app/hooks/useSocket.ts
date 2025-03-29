import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@clerk/remix";

/**
 * Get the WebSocket URL based on environment
 */
const getSocketUrl = (): string => {
  if (typeof window === "undefined") {
    return ""; // Server-side rendering, return empty
  }

  // For production, use same hostname but with ws protocol
  if (window.location.hostname !== "localhost") {
    // Log the original origin for debugging
    console.log("Original origin:", window.location.origin);
    console.log("Protocol:", window.location.protocol);

    // Fix the protocol replacement to guarantee we get exactly wss:// or ws://
    let url;
    if (window.location.protocol === "https:") {
      url = window.location.origin.replace(/^https?:\/\//, "wss://");
    } else {
      url = window.location.origin.replace(/^https?:\/\//, "ws://");
    }

    console.log(`Using production WebSocket URL: ${url}`);
    return url;
  }

  // For development, try to get port from localStorage or try common ports
  try {
    const socketPort = localStorage.getItem("socketPort");
    if (socketPort) {
      console.log(`Using WebSocket port from localStorage: ${socketPort}`);
      return `http://localhost:${socketPort}`;
    }
  } catch (err) {
    console.warn("Error accessing localStorage:", err);
  }

  // Default port for WebSocket in development
  console.log("Using default WebSocket port: 8081");
  return "http://localhost:8081";
};

/**
 * Type definitions for socket responses
 */
interface MessageResponse {
  status: "success" | "error";
  messageId?: number;
  conversationId?: number;
  message?: string;
}

interface SocketHookResult {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  sendMessage: (
    receiverId: string,
    content: string,
    conversationId?: number
  ) => Promise<MessageResponse>;
  markAsRead: (conversationId: number) => void;
  sendTypingIndicator: (conversationId: number) => void;
  joinConversation: (conversationId: number) => void;
  reconnect: () => void;
}

/**
 * React hook for WebSocket communication
 */
export function useSocket(): SocketHookResult {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user, isSignedIn } = useUser();
  const connectionAttempts = useRef(0);
  const hasInitialized = useRef(false);
  const maxReconnectionAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize and manage socket connection
  useEffect(() => {
    // Return early if user isn't signed in
    if (!isSignedIn || !user || typeof window === "undefined") {
      console.log(
        "No authenticated user or server-side rendering, not connecting socket"
      );
      return;
    }

    // Prevent multiple initialization attempts
    if (hasInitialized.current && socket && connected) return;

    console.log("Socket hook initializing...");
    hasInitialized.current = true;
    setConnecting(true);

    const SOCKET_URL = getSocketUrl();
    console.log(`Attempting to connect to socket server at: ${SOCKET_URL}`);

    // If we have an existing socket, clean it up first
    if (socket) {
      console.log("Cleaning up existing socket before reconnecting");
      socket.disconnect();
    }

    // Initialize socket connection with connection retry
    const socketInstance = io(SOCKET_URL, {
      reconnectionAttempts: maxReconnectionAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000, // Increased timeout
      autoConnect: true,
      forceNew: true,
      secure: window.location.protocol === "https:",
      transports: ["websocket", "polling"], // Try WebSocket first, fall back to polling
      path: "/socket.io/", // Explicitly set the path
    });

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id);
      setConnected(true);
      setConnecting(false);
      connectionAttempts.current = 0;

      // Identify the user to the server
      socketInstance.emit("user_connected", user.id);
      console.log("Sent user_connected with ID:", user.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);

      // Handle different disconnect reasons
      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect manually
        console.log("Server disconnected the socket, attempting reconnect...");
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      console.error("Socket connection error details:", err);
      setConnected(false);
      setConnecting(false);
      connectionAttempts.current += 1;

      // If we've tried too many times, stop trying automatically
      if (connectionAttempts.current > maxReconnectionAttempts) {
        console.log(
          "Too many failed connection attempts, stopping automatic reconnection"
        );
        socketInstance.disconnect();
      }
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(
        `Socket successfully reconnected after ${attemptNumber} attempts`
      );
    });

    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}...`);
      setConnecting(true);
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.log("Socket reconnection failed after all attempts");
      setConnecting(false);
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      console.log("Cleaning up socket connection");
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
      setConnecting(false);
      hasInitialized.current = false;
    };
  }, [isSignedIn, user?.id]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socket) {
      console.log("Manual reconnection triggered by user");
      connectionAttempts.current = 0;
      setConnecting(true);
      socket.disconnect().connect();
    } else if (isSignedIn && user) {
      // Socket doesn't exist, reset initialization flag to force re-init
      hasInitialized.current = false;
      connectionAttempts.current = 0;

      // Force effect to re-run after a brief delay
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

      reconnectTimeout.current = setTimeout(() => {
        setConnecting(false); // Toggle state to force effect to re-run
      }, 100);
    }
  }, [socket, isSignedIn, user]);

  // Send a private message
  const sendMessage = useCallback(
    (
      receiverId: string,
      content: string,
      conversationId?: number
    ): Promise<MessageResponse> => {
      if (!socket || !connected) {
        console.error("Cannot send message: Socket not connected");
        return Promise.reject({
          status: "error",
          message: "Socket not connected",
        });
      }

      if (!user) {
        console.error("Cannot send message: User not signed in");
        return Promise.reject({
          status: "error",
          message: "User not signed in",
        });
      }

      console.log(
        `Sending message to ${receiverId}${
          conversationId ? ` in conversation ${conversationId}` : ""
        }: ${content.substring(0, 20)}${content.length > 20 ? "..." : ""}`
      );

      return new Promise((resolve, reject) => {
        const messageData = {
          senderId: user.id,
          receiverId,
          content,
          conversationId,
        };

        // Create a timeout for network issues
        const timeoutId = setTimeout(() => {
          console.warn("Message send timeout - no response received");
          reject({
            status: "error",
            message: "Timeout waiting for message confirmation",
          });
        }, 5000);

        socket.emit(
          "private_message",
          messageData,
          (response: MessageResponse) => {
            clearTimeout(timeoutId);

            if (response?.status === "error") {
              console.error("Error sending message:", response.message);
              reject(response);
            } else {
              console.log(
                "Message sent successfully, ID:",
                response?.messageId
              );
              resolve(response);
            }
          }
        );
      });
    },
    [socket, connected, user]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (conversationId: number) => {
      if (!socket || !connected || !user) {
        console.error(
          "Cannot mark as read: Socket not connected or user not signed in"
        );
        return;
      }

      console.log(
        `Marking messages as read in conversation ${conversationId} for user ${user.id}`
      );
      socket.emit("mark_as_read", { userId: user.id, conversationId });
    },
    [socket, connected, user]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (conversationId: number) => {
      if (!socket || !connected || !user) {
        console.error(
          "Cannot send typing indicator: Socket not connected or user not signed in"
        );
        return;
      }

      console.log(
        `Sending typing indicator in conversation ${conversationId} for user ${user.id}`
      );
      socket.emit("typing", { conversationId, userId: user.id });
    },
    [socket, connected, user]
  );

  // Join a specific conversation
  const joinConversation = useCallback(
    (conversationId: number) => {
      if (!socket || !connected) {
        console.error("Cannot join conversation: Socket not connected");
        return;
      }

      console.log(`Joining conversation ${conversationId}`);
      socket.emit("join_conversation", conversationId);
    },
    [socket, connected]
  );

  return {
    socket,
    connected,
    connecting,
    sendMessage,
    markAsRead,
    sendTypingIndicator,
    joinConversation,
    reconnect,
  };
}
