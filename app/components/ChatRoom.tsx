import { useState, useEffect, useRef } from "react";
import { useSocket } from "~/hooks/useSocket";
import { useUser } from "@clerk/remix";

interface Message {
  message: string;
  sender: string;
  timestamp: number;
  isCurrentUser?: boolean;
}

interface ChatRoomProps {
  roomName: string;
}

export default function ChatRoom({ roomName }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { socket, connected, joinRoom, leaveRoom, sendRoomMessage } =
    useSocket();

  // Join the room when component mounts
  useEffect(() => {
    if (connected && socket) {
      joinRoom(roomName);

      // Listen for room messages
      socket.on("roomMessage", (messageData: string) => {
        try {
          const parsedData = JSON.parse(messageData);
          const newMessage: Message = {
            message: parsedData.message,
            sender: parsedData.sender,
            timestamp: parsedData.timestamp,
            isCurrentUser: parsedData.sender === socket.id,
          };

          setMessages((prev) => [...prev, newMessage]);
        } catch (error) {
          console.error("Error parsing message data:", error);
        }
      });

      // Listen for user joined events
      socket.on("userJoined", ({ userId, timestamp, room_name }) => {
        if (room_name === roomName) {
          const joinMessage: Message = {
            message: `${
              userId === socket.id ? "You" : "Someone"
            } joined the room`,
            sender: "system",
            timestamp,
          };

          setMessages((prev) => [...prev, joinMessage]);
        }
      });

      // Listen for user left events
      socket.on("userLeft", ({ userId, timestamp }) => {
        const leaveMessage: Message = {
          message: `${userId === socket.id ? "You" : "Someone"} left the room`,
          sender: "system",
          timestamp,
        };

        setMessages((prev) => [...prev, leaveMessage]);
      });

      return () => {
        // Leave room and remove listeners when component unmounts
        leaveRoom(roomName);
        socket.off("roomMessage");
        socket.off("userJoined");
        socket.off("userLeft");
      };
    }
  }, [connected, socket, roomName, joinRoom, leaveRoom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !connected) return;

    try {
      await sendRoomMessage(roomName, inputMessage.trim());
      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm">
      <div className="p-3 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">{roomName}</h2>
        <div className="text-sm text-gray-500">
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 ${
                msg.sender === "system"
                  ? "text-center text-gray-500 text-sm"
                  : msg.isCurrentUser
                  ? "flex justify-end"
                  : "flex justify-start"
              }`}
            >
              {msg.sender !== "system" && (
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    msg.isCurrentUser
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <div>{msg.message}</div>
                  <div
                    className={`text-xs mt-1 ${
                      msg.isCurrentUser ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {msg.sender === "system" && (
                <div className="py-2 text-sm text-gray-500">{msg.message}</div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t">
        <div className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!connected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!connected || !inputMessage.trim()}
            className="px-4 py-2 text-white bg-blue-500 rounded-r-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
