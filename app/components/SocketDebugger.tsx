import { useSocket } from "~/hooks/useSocket";
import { useUser } from "@clerk/remix";
import { useState, useEffect } from "react";

export default function SocketDebugger() {
  const { socket, connected, connecting, reconnect } = useSocket();
  const { isSignedIn, isLoaded, user } = useUser();
  const [logs, setLogs] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [socketUrl, setSocketUrl] = useState<string>("");
  const [pingStatus, setPingStatus] = useState<string>("--");
  const [lastActivity, setLastActivity] = useState<string>("--");

  // Calculate socket URL once when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const getSocketUrl = (): string => {
        if (window.location.hostname !== "localhost") {
          return window.location.origin.replace(
            /^http/,
            window.location.protocol === "https:" ? "wss" : "ws"
          );
        }
        const socketPort = localStorage.getItem("socketPort") || "8081";
        return `http://localhost:${socketPort}`;
      };

      setSocketUrl(getSocketUrl());
    }
  }, []);

  // Monitor socket events and update logs
  useEffect(() => {
    const addLog = (message: string) => {
      setLogs((prev) => [
        ...prev.slice(-19),
        `${new Date().toISOString().split("T")[1].slice(0, 8)}: ${message}`,
      ]);
      setLastActivity(new Date().toLocaleTimeString());
    };

    // Log initial state
    if (isLoaded) {
      addLog(`User loaded: ${isSignedIn ? "Signed in" : "Not signed in"}`);
      if (user) {
        addLog(`User ID: ${user.id}`);
      }
    }

    // Track connection changes
    if (connected) {
      addLog(`Socket connected! Socket ID: ${socket?.id}`);
      setPingStatus("Connected");
    } else if (connecting) {
      addLog("Socket connecting...");
      setPingStatus("Connecting");
    } else if (socket) {
      addLog("Socket disconnected");
      setPingStatus("Disconnected");
      setConnectionAttempts((prev) => prev + 1);
    }

    // Listen for socket events
    if (socket) {
      const onConnect = () => {
        addLog(`Socket connected event fired`);
        setPingStatus("Connected");
      };

      const onDisconnect = (reason: string) => {
        addLog(`Socket disconnected: ${reason}`);
        setPingStatus("Disconnected");
      };

      const onConnectError = (error: Error) => {
        addLog(`Connection error: ${error.message}`);
        setPingStatus("Error");
      };

      const onError = (error: any) => {
        addLog(`Socket error: ${error.message || JSON.stringify(error)}`);
      };

      const onReconnect = (attempt: number) => {
        addLog(`Reconnection successful after attempt #${attempt}`);
        setPingStatus("Connected");
      };

      const onReconnectAttempt = (attempt: number) => {
        addLog(`Attempting to reconnect: attempt #${attempt}`);
        setPingStatus("Connecting");
      };

      const onReconnectError = (error: Error) => {
        addLog(`Reconnection error: ${error.message}`);
      };

      const onReconnectFailed = () => {
        addLog(`Reconnection failed after all attempts`);
        setPingStatus("Failed");
      };

      // Set up ping/pong to check connection health
      const pingInterval = setInterval(() => {
        if (connected) {
          const start = Date.now();
          socket.emit("ping", null, () => {
            const duration = Date.now() - start;
            setPingStatus(`${duration}ms`);
          });
        }
      }, 5000);

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);
      socket.on("error", onError);
      socket.on("reconnect", onReconnect);
      socket.on("reconnect_attempt", onReconnectAttempt);
      socket.on("reconnect_error", onReconnectError);
      socket.on("reconnect_failed", onReconnectFailed);

      return () => {
        clearInterval(pingInterval);
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
        socket.off("error", onError);
        socket.off("reconnect", onReconnect);
        socket.off("reconnect_attempt", onReconnectAttempt);
        socket.off("reconnect_error", onReconnectError);
        socket.off("reconnect_failed", onReconnectFailed);
      };
    }
  }, [socket, connected, connecting, isLoaded, isSignedIn, user]);

  // Handle manual reconnection
  const handleForceReconnect = () => {
    if (socket) {
      setLogs((prev) => [
        ...prev.slice(-19),
        `${new Date()
          .toISOString()
          .split("T")[1]
          .slice(0, 8)}: Manual reconnection triggered`,
      ]);
      reconnect();
    }
  };

  // Toggle debugger visibility
  const toggleVisibility = () => {
    setVisible(!visible);
  };

  return (
    <div className="fixed bottom-0 right-0 z-50">
      {!visible ? (
        <button
          onClick={toggleVisibility}
          className="bg-blue-600 text-white p-2 rounded m-2 text-xs shadow-lg flex items-center"
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              connected
                ? "bg-green-400"
                : connecting
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
          ></div>
          Socket Debugger
        </button>
      ) : (
        <div className="bg-gray-900 text-white w-80 h-96 rounded shadow-lg overflow-hidden flex flex-col">
          <div className="bg-gray-800 p-2 flex justify-between items-center">
            <div className="font-semibold">WebSocket Debugger</div>
            <button
              onClick={toggleVisibility}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="overflow-auto flex-1 p-2 text-xs font-mono">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300 mb-1">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 italic">No logs yet...</div>
            )}
          </div>

          <div className="p-3 bg-gray-800 border-t border-white/20 flex flex-col gap-2">
            <div className="grid grid-cols-2 text-xs gap-1">
              <div className="text-white/60">User:</div>
              <div className="text-white">
                {isSignedIn
                  ? user?.username || user?.id?.substring(0, 8)
                  : "Not signed in"}
              </div>

              <div className="text-white/60">Status:</div>
              <div
                className={`${
                  connected
                    ? "text-green-400"
                    : connecting
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {connected
                  ? "Connected"
                  : connecting
                  ? "Connecting"
                  : "Disconnected"}
              </div>

              <div className="text-white/60">Connection attempts:</div>
              <div className="text-white">{connectionAttempts}</div>

              <div className="text-white/60">Ping:</div>
              <div className="text-white">{pingStatus}</div>

              <div className="text-white/60">Last activity:</div>
              <div className="text-white">{lastActivity}</div>

              <div className="text-white/60">URL:</div>
              <div className="text-white text-xs truncate">{socketUrl}</div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleForceReconnect}
                className={`flex-1 py-1 px-2 rounded text-xs ${
                  connected
                    ? "bg-gray-600 text-white/70"
                    : "bg-blue-600 text-white"
                } ${connecting ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={connecting}
              >
                {connecting ? "Connecting..." : "Reconnect"}
              </button>

              <button
                onClick={() => setLogs([])}
                className="flex-1 bg-gray-700 text-white text-xs py-1 px-2 rounded hover:bg-gray-600"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
