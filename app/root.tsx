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

export function Layout({ children }: { children: React.ReactNode }) {
const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Define a function to check if the 'dark' class exists
    const checkDarkTheme = () => {
      if (typeof document !== 'undefined') {
        const darkClassExists = document.querySelector('.dark') !== null;
        setIsDark(darkClassExists);
      }
    };

    // Call the function once on component mount
    checkDarkTheme();

    // Optional: Set up a MutationObserver if the 'dark' class might change dynamically
    const observer = new MutationObserver(checkDarkTheme);
    observer.observe(document.documentElement, { attributes: true, subtree: true });

    // Cleanup observer on unmount
    return () => observer.disconnect();
  }, []);


return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body
        className={` 
             ${isDark ?  "bg-[url(../public/bgd.png)]" :"bg-[url(../public/bg.jpg)]"  } 
         bg-cover bg-fixed bg-no-repeat`}
      >
        <div></div>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function App() {
  return <Outlet />;
}

export default ClerkApp(App);
