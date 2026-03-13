/**
 * Root layout for MSR Channel DevTools.
 * Wraps the app in FluentProvider with dark theme (dev tools convention).
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
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components";
import type { LinksFunction, MetaFunction } from "react-router";

import rootStyles from "~/styles/root.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: rootStyles },
];

export const meta: MetaFunction = () => [
  { title: "MSR Channel DevTools" },
  {
    name: "description",
    content: "Developer tools for testing and debugging MSR Agent channels",
  },
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
    <FluentProvider theme={webDarkTheme}>
      <Outlet />
    </FluentProvider>
  );
}
