/**
 * __CHANNEL_DISPLAY_NAME__ Channel Adapter
 *
 * Normalizes __CHANNEL_DISPLAY_NAME__ native payloads to/from the
 * canonical MSR Agent Protocol (pub/sub/stream).
 *
 * TODO: Replace the placeholder native types with your platform's actual types.
 */
import { randomUUID } from "node:crypto";
import type { ChannelAdapter } from "@automoto/channel-adapter";
import type {
  ChannelType,
  MSRAgentRequest,
  MSRAgentResponse,
  MSRMessage,
  MSRStreamEvent,
} from "@automoto/channel-adapter";

/* ── Native Types ─────────────────────────────────────────── */
// TODO: Replace these with your platform's actual request/response shapes.

export interface __CHANNEL_NAME__Inbound {
  /** The user's message text */
  text: string;
  /** Conversation or thread identifier from your platform */
  conversationId: string;
  /** User identifier from your platform */
  userId?: string;
  /** Any additional platform-specific metadata */
  metadata?: Record<string, unknown>;
}

export interface __CHANNEL_NAME__Outbound {
  /** Response text to send back to the platform */
  text: string;
  /** Optional rich attachments in your platform's format */
  attachments?: unknown[];
}

/** Streaming chunk type — set to `null` if your platform doesn't support streaming */
export type __CHANNEL_NAME__StreamChunk = string; // SSE string, or null for non-streaming

/* ── Adapter ──────────────────────────────────────────────── */

export class __CHANNEL_NAME__Adapter
  implements
    ChannelAdapter<
      __CHANNEL_NAME__Inbound,
      __CHANNEL_NAME__Outbound,
      __CHANNEL_NAME__StreamChunk
    >
{
  // TODO: Add your channel type to ChannelType in packages/channel-adapter/src/protocol.ts
  readonly type = "__CHANNEL_ID__" as ChannelType;
  readonly name = "__CHANNEL_DISPLAY_NAME__";

  // TODO: Set to true if your platform supports SSE/WebSocket streaming
  readonly supportsStreaming = false;

  /**
   * msr.pub — Normalize an inbound platform-native request into a canonical MSRAgentRequest.
   *
   * This is called when a message arrives FROM your platform.
   * Map your platform's fields to the canonical format.
   */
  pub(raw: __CHANNEL_NAME__Inbound): MSRAgentRequest {
    const requestId = randomUUID();
    const now = new Date().toISOString();

    const message: MSRMessage = {
      id: `${requestId}-msg`,
      role: "user",
      content: raw.text,
      timestamp: now,
    };

    return {
      type: "chat",
      requestId,
      message,
      context: {
        channel: { type: this.type, id: raw.conversationId },
        conversation: { id: raw.conversationId, history: [] },
        user: raw.userId ? { id: raw.userId } : undefined,
      },
      stream: this.supportsStreaming,
    };
  }

  /**
   * msr.sub — Format a canonical MSRAgentResponse into your platform's native format.
   *
   * This is called when the agent produces a COMPLETE response.
   * Map the canonical response to whatever your platform expects.
   */
  sub(response: MSRAgentResponse): __CHANNEL_NAME__Outbound {
    // TODO: Map cards, references, suggestedActions to your platform's format
    return {
      text: response.message.content,
      attachments:
        response.cards.length > 0
          ? response.cards.map((card) => ({
              title: card.title,
              kind: card.kind,
              data: card.data,
              url: card.url,
            }))
          : undefined,
    };
  }

  /**
   * msr.stream — Format a canonical MSRStreamEvent into your platform's streaming format.
   *
   * This is called for EACH streaming chunk during real-time responses.
   * Return null to skip an event type your platform doesn't handle.
   *
   * Only used if supportsStreaming is true.
   */
  stream(event: MSRStreamEvent): __CHANNEL_NAME__StreamChunk | null {
    // TODO: Implement streaming if your platform supports it.
    // See WebAdapter or GitHubCopilotAdapter for SSE examples.
    switch (event.type) {
      case "text_delta":
        return `data: ${JSON.stringify({ text: event.delta })}\n\n`;
      case "done":
        return `data: [DONE]\n\n`;
      default:
        return null;
    }
  }
}
