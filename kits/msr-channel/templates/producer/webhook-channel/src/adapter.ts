/**
 * __CHANNEL_DISPLAY_NAME__ Webhook Channel Adapter
 *
 * The simplest channel adapter — receives a JSON webhook payload,
 * normalizes it, and returns a response. No streaming.
 *
 * Use this template when your integration is a simple inbound webhook
 * (e.g., Slack incoming webhook, GitHub webhook, custom HTTP callback).
 */
import { randomUUID } from "node:crypto";
import type { ChannelAdapter } from "@msr/channel-adapter";
import type {
  ChannelType,
  MSRAgentRequest,
  MSRAgentResponse,
  MSRStreamEvent,
} from "@msr/channel-adapter";

/* ── Native Types ─────────────────────────────────────────── */
// TODO: Match these to your webhook's actual payload shape.

export interface WebhookInbound {
  /** Text content from the webhook */
  text: string;
  /** Unique identifier for the webhook source (e.g., Slack channel ID) */
  sourceId: string;
  /** User who triggered the webhook */
  userId?: string;
  /** Webhook signature/token for verification */
  signature?: string;
}

export interface WebhookOutbound {
  /** Response text */
  text: string;
  /** Optional response URL for async replies (e.g., Slack response_url) */
  responseUrl?: string;
}

/* ── Adapter ──────────────────────────────────────────────── */

export class __CHANNEL_NAME__Adapter
  implements ChannelAdapter<WebhookInbound, WebhookOutbound, null>
{
  readonly type = "__CHANNEL_ID__" as ChannelType;
  readonly name = "__CHANNEL_DISPLAY_NAME__";
  readonly supportsStreaming = false;

  pub(raw: WebhookInbound): MSRAgentRequest {
    const requestId = randomUUID();
    return {
      type: "chat",
      requestId,
      message: {
        id: `${requestId}-msg`,
        role: "user",
        content: raw.text,
        timestamp: new Date().toISOString(),
      },
      context: {
        channel: { type: this.type, id: raw.sourceId },
        conversation: { id: raw.sourceId, history: [] },
        user: raw.userId ? { id: raw.userId } : undefined,
      },
      stream: false,
    };
  }

  sub(response: MSRAgentResponse): WebhookOutbound {
    return { text: response.message.content };
  }

  stream(_event: MSRStreamEvent): null {
    return null;
  }
}
