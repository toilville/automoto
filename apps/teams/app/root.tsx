/**
 * Root layout for the Teams app.
 *
 * Wraps the app in Teams SDK context, analytics, and Fluent UI theming.
 * Reads the Teams theme and maps it to the appropriate Fluent theme.
 */
import { useEffect } from "react";
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
  webDarkTheme,
  teamsHighContrastTheme,
  teamsDarkTheme,
} from "@fluentui/react-components";
import type { LinksFunction, MetaFunction } from "react-router";
import { TeamsProvider, useTeamsContext, teamsThemeToFluentTheme } from "~/lib/teams-context";

import rootStyles from "~/styles/root.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: rootStyles },
];

export const meta: MetaFunction = () => [
  { title: "MSR Assistant — Teams" },
  { name: "description", content: "Microsoft Research AI assistant embedded in Teams" },
];

function AppShell() {
  const teamsCtx = useTeamsContext();
  const themeVariant = teamsThemeToFluentTheme(teamsCtx.theme);

  const theme =
    themeVariant === "dark" ? teamsDarkTheme
      : themeVariant === "contrast" ? teamsHighContrastTheme
        : webLightTheme;

  return (
    <FluentProvider theme={theme}>
      <Outlet />
    </FluentProvider>
  );
}

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
    <TeamsProvider>
      <AppShell />
    </TeamsProvider>
  );
}
