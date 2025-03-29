/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { PassThrough } from "node:stream";
import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToPipeableStream } from "react-dom/server";
import { initSocketServer } from "./socket-server";
import { createServer } from "node:http";

const ABORT_DELAY = 5_000;
const SOCKET_PORT = 8081;
const FALLBACK_PORTS = [8082, 8083, 8084, 8085]; // Fallback ports to try if main port is busy

// Initialize Socket.IO server only in development mode
export let io: Awaited<ReturnType<typeof initSocketServer>> | null = null;
// Export the socket port for client-side code to access
export let activeSocketPort = SOCKET_PORT;

// Start WebSocket server in development mode only
if (process.env.NODE_ENV === "development") {
  try {
    const httpServer = createServer();

    // Use async IIFE to handle async socket initialization
    (async () => {
      try {
        io = await initSocketServer(httpServer);
        console.log("Socket.IO server initialized successfully");

        // Use port 8081 for the WebSocket server
        const startServer = (port: number, fallbacks: number[] = []) => {
          httpServer
            .listen(port, () => {
              console.log(`📱 WebSocket server running on port ${port}`);
              activeSocketPort = port;
              console.log(`Active socket port set to: ${activeSocketPort}`);

              // Write the port to a file that will be loaded by the client
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem("socketPort", String(port));
                  console.log(`Socket port ${port} saved to localStorage`);
                } catch (err) {
                  console.warn("Cannot save socket port to localStorage:", err);
                }
              } else {
                console.log("Running on server, skipping localStorage update");
                // In server environment, we can't use localStorage
                // The client will get the port from the useSocket hook logic
              }
            })
            .on("error", (err: any) => {
              console.error(
                `Error starting WebSocket server on port ${port}:`,
                err
              );
              if (err.code === "EADDRINUSE" && fallbacks.length > 0) {
                console.log(
                  `⚠️ Port ${port} is busy, trying ${fallbacks[0]}...`
                );
                startServer(fallbacks[0], fallbacks.slice(1));
              } else {
                console.error("Failed to start WebSocket server:", err);
              }
            });
        };

        startServer(SOCKET_PORT, FALLBACK_PORTS);
      } catch (error) {
        console.error("Failed to initialize Socket.IO server:", error);
      }
    })();
  } catch (err) {
    console.error("Failed to start WebSocket server:", err);
  }
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  // Check if the user agent might be a bot
  const userAgent = request.headers.get("user-agent") || "";
  const isBotLike =
    /bot|crawler|spider|googlebot|chrome-lighthouse|baidu|bing|google|yahoo|lighthouse/i.test(
      userAgent
    );

  return isBotLike
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
