import type {
  MetaFunction,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import "./tailwind.css";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
// Import ClerkApp
import { ClerkApp } from "@clerk/remix";
import { clerkEnv } from "./env.server";
import { useEffect, useState } from "react";

// Simple function to check if a user agent string likely belongs to a bot
function isBotUserAgent(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /googlebot/i,
    /bingbot/i,
    /yahoo/i,
    /baidu/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /slurp/i,
    /lighthouse/i,
    /chrome-lighthouse/i,
    /headless/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /selenium/i,
    /puppeteer/i,
    /playwright/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

export const loader = (args: LoaderFunctionArgs) => {
  const userAgent = args.request.headers.get("user-agent") || "";

  if (isBotUserAgent(userAgent)) {
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }

  return rootAuthLoader(args, clerkEnv);
};

function AppComponent() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDarkMode =
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = window.document.documentElement;
      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
        localStorage.setItem("theme", "dark");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  }, [isDark, mounted]);

  return (
    <html lang="en" className={mounted ? (isDark ? "dark" : "light") : ""}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-300">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Create the wrapped app as a separate constant
const App = ClerkApp(AppComponent);

// Export the wrapped app as the default export
export default App;
