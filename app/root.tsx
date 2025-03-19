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
import React, { useEffect, useState } from "react";

export const meta: MetaFunction = () => [
  {
    charset: "utf-8",
    title: "BlogStack",
    viewport: "width=device-width,initial-scale=1",
  },
];

export const loader: LoaderFunction = (args: LoaderFunctionArgs) => {
  return rootAuthLoader(args, clerkEnv);
};

function App() {
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

export default ClerkApp(App);
