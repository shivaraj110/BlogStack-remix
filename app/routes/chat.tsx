import { useState } from "react";
import ChatRoom from "~/components/ChatRoom";
import SocketInitializer from "~/components/SocketInitializer";
import { useUser } from "@clerk/remix";

export default function ChatTestPage() {
  const [roomName, setRoomName] = useState("");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const { isSignedIn, isLoaded } = useUser();

  const handleJoinRoom = () => {
    if (roomName.trim()) {
      setActiveRoom(roomName.trim());
    }
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <SocketInitializer />

      <h1 className="text-2xl font-bold mb-6">Chat Room Test</h1>

      {!isLoaded ? (
        <div className="text-center p-8">Loading...</div>
      ) : !isSignedIn ? (
        <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700">
            Please sign in to use the chat functionality.
          </p>
        </div>
      ) : (
        <div>
          {!activeRoom ? (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Join a Room</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Join Room
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[70vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Room: {activeRoom}</h2>
                <button
                  onClick={handleLeaveRoom}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Leave Room
                </button>
              </div>
              <div className="flex-1">
                <ChatRoom roomName={activeRoom} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
