/**
 * Index route — Full-page chat experience.
 * Loads UI text from chat-settings.yaml at request time (SSR).
 * Uses @automoto/chat-ui with a ChatAdapter pointing to the local /api/chat proxy.
 */
import { useEffect, useMemo } from "react";
import {
  ChatAdapterProvider,
  ChatContainer,
  ChannelProvider,
  WEB_CHANNEL,
  type ChatAdapter,
} from "@automoto/chat-ui";
import { loadChatUiText } from "~/services/chat-settings.server";
import { useHydrated } from "~/hooks/useHydrated";
import { useLoaderData } from "react-router";
import { useAnalyticsOptional } from "@automoto/analytics/react";

export async function loader() {
  const uiText = await loadChatUiText();
  return { uiText };
}

export default function Index() {
  const { uiText } = useLoaderData<typeof loader>();
  const hydrated = useHydrated();
  const analytics = useAnalyticsOptional();

  useEffect(() => {
    analytics?.trackPageView({ name: "chat_home" });
  }, [analytics]);

  const adapter: ChatAdapter = useMemo(
    () => ({
      endpoint: "/api/chat",
      getContext: () => ({
        scope: "event_discovery" as const,
      }),
    }),
    [],
  );

  if (!hydrated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  return (
    <ChannelProvider config={WEB_CHANNEL}>
      <ChatAdapterProvider adapter={adapter}>
        <ChatContainer uiText={uiText} />
      </ChatAdapterProvider>
    </ChannelProvider>
  );
}
