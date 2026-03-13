/**
 * __CHANNEL_DISPLAY_NAME__ Channel Adapter (Bot Framework)
 *
 * Normalizes Bot Framework Activity payloads to/from the canonical MSR Agent Protocol.
 * Based on the existing BotFrameworkAdapter pattern.
 *
 * Use this template when your platform speaks the Bot Framework protocol
 * (Teams, M365 Agents, Copilot Studio, or any Bot Framework-compatible service).
 */
import { randomUUID } from "node:crypto";
import type { ChannelAdapter } from "@msr/channel-adapter";
import type {
  ChannelType,
  MSRAgentRequest,
  MSRAgentResponse,
  MSRCard,
  MSRStreamEvent,
} from "@msr/channel-adapter";

/* ── Native Types (Bot Framework Activity) ────────────────── */

export interface BotFrameworkInbound {
  text: string;
  conversationId: string;
  memberId?: string;
  type:
    | "message"
    | "composeExtension/query"
    | "composeExtension/submitAction";
  // TODO: Add additional Activity fields your platform sends
}

export interface BotFrameworkOutbound {
  text: string;
  attachments?: Array<{ contentType: string; content: unknown }>;
  // TODO: Add platform-specific response fields
}

/* ── Adapter ──────────────────────────────────────────────── */

export class __CHANNEL_NAME__Adapter
  implements ChannelAdapter<BotFrameworkInbound, BotFrameworkOutbound, null>
{
  // TODO: Add your channel type to ChannelType in packages/channel-adapter/src/protocol.ts
  readonly type = "__CHANNEL_ID__" as ChannelType;
  readonly name = "__CHANNEL_DISPLAY_NAME__";
  readonly supportsStreaming = false;

  /**
   * msr.pub — Normalize a Bot Framework Activity into a canonical MSRAgentRequest.
   */
  pub(raw: BotFrameworkInbound): MSRAgentRequest {
    const requestId = randomUUID();
    const now = new Date().toISOString();

    const requestType =
      raw.type === "composeExtension/query"
        ? ("search" as const)
        : raw.type === "composeExtension/submitAction"
          ? ("action" as const)
          : ("chat" as const);

    return {
      type: requestType,
      requestId,
      message: {
        id: `${requestId}-msg`,
        role: "user",
        content: raw.text,
        timestamp: now,
      },
      context: {
        channel: { type: this.type, id: raw.conversationId },
        conversation: { id: raw.conversationId, history: [] },
        user: raw.memberId ? { id: raw.memberId } : undefined,
      },
      stream: false,
    };
  }

  /**
   * msr.sub — Format a canonical MSRAgentResponse as Bot Framework reply.
   */
  sub(response: MSRAgentResponse): BotFrameworkOutbound {
    const attachments: Array<{ contentType: string; content: unknown }> = [];

    for (const card of response.cards) {
      attachments.push({
        contentType: "application/vnd.microsoft.card.adaptive",
        content: toAdaptiveCard(card),
      });
    }

    // Map suggested actions to Adaptive Card action buttons
    if (response.suggestedActions && response.suggestedActions.length > 0) {
      attachments.push({
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          version: "1.5",
          body: [],
          actions: response.suggestedActions.map((a) => ({
            type: a.url ? "Action.OpenUrl" : "Action.Submit",
            title: a.label,
            ...(a.url
              ? { url: a.url }
              : { data: { action: a.id, payload: a.payload } }),
          })),
        },
      });
    }

    return {
      text: response.message.content,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
  }

  stream(_event: MSRStreamEvent): null {
    return null;
  }
}

/* ── Adaptive Card Helpers ────────────────────────────────── */

function toAdaptiveCard(card: MSRCard): unknown {
  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: card.title,
        weight: "Bolder",
        size: "Medium",
      },
      ...(card.data["description"]
        ? [
            {
              type: "TextBlock",
              text: String(card.data["description"]),
              wrap: true,
            },
          ]
        : []),
    ],
    ...(card.url
      ? {
          actions: [
            { type: "Action.OpenUrl", title: "Open", url: card.url },
          ],
        }
      : {}),
  };
}
