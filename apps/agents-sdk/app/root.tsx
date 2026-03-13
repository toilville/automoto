/**
 * Root layout — Azure AI Agents SDK app.
 */
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import {
  FluentProvider,
  webLightTheme,
} from "@fluentui/react-components";
import type { LinksFunction, MetaFunction } from "react-router";

import rootStyles from "~/styles/root.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: rootStyles },
];

export const meta: MetaFunction = () => [
  { title: "MSR Agent — Azure AI SDK" },
  { name: "description", content: "Chat with Microsoft Research using the Azure AI Agent Service SDK" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <Outlet />
    </FluentProvider>
  );
}
