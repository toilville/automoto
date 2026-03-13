/**
 * Index route — Teams tab content.
 *
 * Renders the chat experience inside a Teams personal tab.
 * Wraps the shared @automoto/chat-ui components with:
 *   - ChannelProvider (TEAMS_CHANNEL config for host-native adaptive cards)
 *   - ChatAdapterProvider (adapter with /api/chat endpoint + Teams context)
 *   - TeamsProvider (from root.tsx, provides theme/user info)
 */
import { useEffect, useMemo, useState } from "react";
import {
  ChatAdapterProvider,
  ChatContainer,
  ChannelProvider,
  TEAMS_CHANNEL,
  type ChatAdapter,
  type ChannelConfig,
} from "@automoto/chat-ui";
import { useTeamsContext } from "~/lib/teams-context";

export default function TeamsTab() {
  const teamsCtx = useTeamsContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for Teams SDK initialization before rendering chat
    if (teamsCtx.initialized) {
      setReady(true);
    }
  }, [teamsCtx.initialized]);

  const adapter: ChatAdapter = useMemo(
    () => ({
      endpoint: "/api/chat",
      getContext: () => ({
        scope: "msr_homepage" as const,
        userId: teamsCtx.userObjectId,
      }),
      getHeaders: () => {
        const headers: Record<string, string> = {};
        if (teamsCtx.userObjectId) {
          headers["x-teams-user-id"] = teamsCtx.userObjectId;
        }
        return headers;
      },
    }),
    [teamsCtx.userObjectId],
  );

  // Channel config — Teams uses SDK rendering for now (host rendering
  // can be enabled later by providing renderAdaptiveCard).
  const channelConfig: ChannelConfig = useMemo(
    () => ({
      ...TEAMS_CHANNEL,
      cards: {
        ...TEAMS_CHANNEL.cards,
        // Use SDK renderer in tab context; switch to "host" when a
        // Teams task-module bridge is implemented.
        adaptiveCardRenderer: "sdk" as const,
      },
    }),
    [],
  );

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  return (
    <ChannelProvider config={channelConfig}>
      <ChatAdapterProvider adapter={adapter}>
        <ChatContainer />
      </ChatAdapterProvider>
    </ChannelProvider>
  );
}
