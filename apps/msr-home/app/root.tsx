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
} from "@fluentui/react-components";
import type { LinksFunction, MetaFunction } from "react-router";
import { ChatSettingsProvider, useChatSettings } from "~/contexts/ChatSettingsContext";
import { AnalyticsProvider } from "@msr/analytics/react";
import { getAnalytics, initializeAnalytics } from "~/lib/analytics";

import rootStyles from "~/styles/root.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: rootStyles },
];

export const meta: MetaFunction = () => [
  { title: "Microsoft Research Assistant" },
  { name: "description", content: "AI-powered assistant for exploring Microsoft Research — discover research areas, researchers, publications, and more" },
];

const analytics = getAnalytics();

function AppShell() {
  const { settings } = useChatSettings();
  const theme = settings.theme === "dark" ? webDarkTheme : webLightTheme;

  useEffect(() => {
    initializeAnalytics();
    return () => {
      analytics.teardown();
    };
  }, []);

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
    <AnalyticsProvider manager={analytics}>
      <ChatSettingsProvider>
        <AppShell />
      </ChatSettingsProvider>
    </AnalyticsProvider>
  );
}
