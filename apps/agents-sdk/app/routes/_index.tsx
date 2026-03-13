/**
 * Index route — Azure AI Agents SDK chat experience.
 * Uses ChannelProvider with AGENTS_SDK_CHANNEL preset.
 */
import { useMemo } from "react";
import {
  ChatAdapterProvider,
  ChatContainer,
  ChannelProvider,
  AGENTS_SDK_CHANNEL,
  type ChatAdapter,
} from "@automoto/chat-ui";

export default function AgentChat() {
  const adapter: ChatAdapter = useMemo(
    () => ({
      endpoint: "/api/chat",
      getContext: () => ({ scope: "msr_homepage" as const }),
    }),
    [],
  );

  return (
    <ChannelProvider config={AGENTS_SDK_CHANNEL}>
      <ChatAdapterProvider adapter={adapter}>
        <ChatContainer />
      </ChatAdapterProvider>
    </ChannelProvider>
  );
}
