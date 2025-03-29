import { useSocket } from "~/hooks/useSocket";
import { useUser } from "@clerk/remix";
import { useEffect, useRef, useState } from "react";
import { notifyNewMessage } from "~/utils/notifications";
import { useLocation } from "@remix-run/react";

/**
 * Component that initializes and monitors the socket connection
 * Renders nothing but ensures socket connection is established
 */
export default function SocketInitializer() {
  const { socket, connected, connecting, reconnect } = useSocket();
  const { isSignedIn, isLoaded, user } = useUser();
  const hasLoggedRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxAutomaticRetries = 3;
  const location = useLocation();

  // Setup message listener
  useEffect(() => {
    if (socket && connected && user) {
      // Listen for private messages
      socket.on("private_message_received", (data: any) => {
        // Only create notification if message is from someone else
        if (data.senderId !== user.id) {
          const conversationId = data.conversationId;
          const message = data.content;
          const senderName = data.senderName || "New message";

          // Get the current conversation ID from the URL if we're in a conversation
          const currentPath = location.pathname;
          const conversationMatch = currentPath.match(
            /\/dashboard\/messages\/(\d+)/
          );
          const currentConversationId = conversationMatch
            ? parseInt(conversationMatch[1])
            : null;

          // Only show notification if user is not currently viewing this conversation
          if (currentConversationId !== conversationId) {
            notifyNewMessage(message, conversationId, senderName);
          }
        }
      });

      return () => {
        socket.off("private_message_received");
      };
    }
  }, [socket, connected, user, location.pathname]);

  // Automatically try to reconnect if we lose connection
  useEffect(() => {
    if (
      isSignedIn &&
      isLoaded &&
      user &&
      !connected &&
      !connecting &&
      retryCount < maxAutomaticRetries
    ) {
      // Only attempt auto-reconnect if not already connecting and we haven't
      // exceeded the maximum retry attempts
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }

      console.log(
        `Socket disconnected, attempting automatic reconnect (${
          retryCount + 1
        }/${maxAutomaticRetries})...`
      );

      retryTimerRef.current = setTimeout(() => {
        reconnect();
        setRetryCount((prev) => prev + 1);
      }, 5000); // Wait 5 seconds before reconnecting
    }

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [
    connected,
    connecting,
    isSignedIn,
    isLoaded,
    user,
    reconnect,
    retryCount,
  ]);

  // Reset retry count when connection established
  useEffect(() => {
    if (connected && retryCount > 0) {
      setRetryCount(0);
    }
  }, [connected, retryCount]);

  // Log connection status changes
  useEffect(() => {
    const logWithTimestamp = (message: string) => {
      const timestamp = new Date().toISOString().split("T")[1].substring(0, 8);
      console.log(`[${timestamp}] Socket: ${message}`);
    };

    // Only log once when component mounts to avoid console spam
    if (!hasLoggedRef.current && isLoaded) {
      hasLoggedRef.current = true;
      logWithTimestamp("Socket initializer running");
      logWithTimestamp(
        `User status: ${isSignedIn ? "Signed in" : "Not signed in"}`
      );
      logWithTimestamp(`User ID: ${user?.id || "unknown"}`);
      logWithTimestamp(`Socket connected: ${connected ? "Yes" : "No"}`);
      logWithTimestamp(`Socket exists: ${!!socket ? "Yes" : "No"}`);
    }

    // But do log connection status changes
    if (hasLoggedRef.current) {
      if (connected) {
        logWithTimestamp(`Socket connected with ID: ${socket?.id}`);
      } else if (connecting) {
        logWithTimestamp("Socket connecting...");
      } else if (!connecting && socket) {
        logWithTimestamp("Socket disconnected");
      }
    }
  }, [isLoaded, isSignedIn, connected, connecting, socket, user?.id]);

  // This component doesn't render anything, it just manages the socket connection
  return null;
}
