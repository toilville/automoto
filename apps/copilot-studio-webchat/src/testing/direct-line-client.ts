export interface ChannelAccount {
  id?: string;
  name?: string;
  role?: string;
}

export interface Attachment {
  contentType?: string;
  content?: unknown;
}

export interface Activity {
  id?: string;
  type?: string;
  text?: string;
  name?: string;
  from?: ChannelAccount;
  attachments?: Attachment[];
  channelData?: unknown;
  value?: unknown;
  timestamp?: string;
}

interface ActivitySet {
  activities?: Activity[];
  watermark?: string;
}

interface StartConversationResponse {
  conversationId?: string;
  token?: string;
}

const POLL_INTERVAL_MS = 1000;
const SETTLE_WINDOW_MS = 1500;
const USER_ID = "dl_test_runner";

export class DirectLineTestClient {
  private readonly watermarks = new Map<string, string | undefined>();

  constructor(
    private token: string,
    private domain: string,
  ) {
    this.domain = normalizeDomain(domain);
  }

  async startConversation(): Promise<string> {
    const response = await this.requestJson<StartConversationResponse>(
      `${this.domain}/v3/directline/conversations`,
      {
        method: "POST",
      },
    );

    if (!response.conversationId) {
      throw new Error("Direct Line did not return a conversationId.");
    }

    if (response.token) {
      this.token = response.token;
    }

    this.watermarks.set(response.conversationId, undefined);
    return response.conversationId;
  }

  async sendMessage(conversationId: string, text: string): Promise<void> {
    await this.requestJson(
      `${this.domain}/v3/directline/conversations/${conversationId}/activities`,
      {
        method: "POST",
        body: JSON.stringify({
          type: "message",
          from: {
            id: USER_ID,
            role: "user",
            name: "CLI Test Runner",
          },
          text,
          textFormat: "plain",
          locale: "en-US",
        }),
      },
    );
  }

  async waitForResponse(
    conversationId: string,
    timeoutMs = 30000,
  ): Promise<Activity[]> {
    const deadline = Date.now() + timeoutMs;
    const collected: Activity[] = [];
    let firstResponseAt: number | undefined;

    while (Date.now() < deadline) {
      const watermark = this.watermarks.get(conversationId);
      const query = watermark ? `?watermark=${encodeURIComponent(watermark)}` : "";
      const response = await this.requestJson<ActivitySet>(
        `${this.domain}/v3/directline/conversations/${conversationId}/activities${query}`,
        {
          method: "GET",
        },
      );

      this.watermarks.set(conversationId, response.watermark);

      const botActivities = (response.activities ?? []).filter((activity) => {
        const role = activity.from?.role?.toLowerCase();
        const fromId = activity.from?.id?.toLowerCase();
        return role !== "user" && fromId !== USER_ID;
      });

      if (botActivities.length > 0) {
        collected.push(...botActivities);
        firstResponseAt ??= Date.now();

        const hasTerminalActivity = botActivities.some(
          (activity) => activity.type === "endOfConversation",
        );

        if (
          hasTerminalActivity ||
          Date.now() - firstResponseAt >= SETTLE_WINDOW_MS
        ) {
          return collected;
        }
      }

      await delay(POLL_INTERVAL_MS);
    }

    return collected;
  }

  async endConversation(conversationId: string): Promise<void> {
    this.watermarks.delete(conversationId);
  }

  private async requestJson<T>(
    url: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `Direct Line request failed (${response.status} ${response.statusText}) for ${url}: ${text.slice(0, 200)}`,
      );
    }

    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }
}

function normalizeDomain(domain: string): string {
  return domain
    .replace(/\/v3\/directline\/?$/i, "")
    .replace(/\/+$/, "");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
