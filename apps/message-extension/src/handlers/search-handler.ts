/**
 * MSR Research Message Extension — Search Handler
 *
 * Handles composeExtension/query activities from Teams/Outlook compose box.
 * Users type a search query, and we return MSR results as cards they can
 * insert into their message.
 */
import { CardFactory, type TurnContext } from "@microsoft/agents-hosting";
import {
  TeamsActivityHandler,
  type MessagingExtensionQuery,
  type MessagingExtensionResponse,
  type MessagingExtensionAction,
  type MessagingExtensionActionResponse,
  type AppBasedLinkQuery,
} from "@microsoft/agents-hosting-extensions-teams";

const DATA_API_URL = process.env.DATA_API_URL ?? "http://localhost:7071";

export class SearchExtension extends TeamsActivityHandler {
  /**
   * Handle search queries from the compose box.
   * Called when user types in the ME search bar.
   */
  async handleTeamsMessagingExtensionQuery(
    _context: TurnContext,
    query: MessagingExtensionQuery,
  ): Promise<MessagingExtensionResponse> {
    const searchQuery = query.parameters?.[0]?.value ?? "";

    if (!searchQuery || searchQuery.length < 2) {
      return {
        composeExtension: {
          type: "result",
          attachmentLayout: "list",
          attachments: [],
        },
      };
    }

    try {
      const results = await searchMSR(searchQuery);

      const attachments = results.map((result) => {
        // Hero card for preview in search results
        const preview = CardFactory.heroCard(
          result.title ?? "MSR Research",
          result.snippet ?? "",
          undefined,
          undefined,
        );

        // Adaptive card for the actual message content when inserted
        const adaptiveCard = CardFactory.adaptiveCard({
          type: "AdaptiveCard",
          version: "1.5",
          body: [
            {
              type: "TextBlock",
              text: result.title ?? "Microsoft Research",
              weight: "Bolder",
              size: "Medium",
            },
            {
              type: "TextBlock",
              text: result.snippet ?? "",
              wrap: true,
            },
            ...(result.authors
              ? [
                  {
                    type: "TextBlock",
                    text: `Authors: ${result.authors}`,
                    isSubtle: true,
                    size: "Small",
                  },
                ]
              : []),
          ],
          actions: result.url
            ? [
                {
                  type: "Action.OpenUrl",
                  title: "View on Microsoft Research",
                  url: result.url,
                },
              ]
            : [],
        });

        return { ...adaptiveCard, preview };
      });

      return {
        composeExtension: {
          type: "result",
          attachmentLayout: "list",
          attachments,
        },
      };
    } catch (err) {
      console.error("[SearchExtension] Search error:", err);
      return {
        composeExtension: {
          type: "result",
          attachmentLayout: "list",
          attachments: [],
        },
      };
    }
  }

  /**
   * Handle action commands (e.g., "Ask MSR Research" from message context menu).
   */
  async handleTeamsMessagingExtensionSubmitAction(
    _context: TurnContext,
    action: MessagingExtensionAction,
  ): Promise<MessagingExtensionActionResponse> {
    const question = (action.data as Record<string, string>)?.question ?? "";

    if (!question) {
      return {
        composeExtension: {
          type: "result",
          attachmentLayout: "list",
          attachments: [],
        },
      };
    }

    const results = await searchMSR(question);
    const topResult = results[0];

    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.5",
      body: [
        {
          type: "TextBlock",
          text: `MSR Research: ${question}`,
          weight: "Bolder",
          size: "Medium",
        },
        {
          type: "TextBlock",
          text:
            topResult?.snippet ??
            `No results found for "${question}". Try a different search term.`,
          wrap: true,
        },
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "Explore on MSR",
          url: topResult?.url ?? "https://www.microsoft.com/research",
        },
      ],
    });

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [card],
      },
    };
  }

  /**
   * Handle link unfurling for microsoft.com/research URLs.
   */
  async handleTeamsAppBasedLinkQuery(
    _context: TurnContext,
    query: AppBasedLinkQuery,
  ): Promise<MessagingExtensionResponse> {
    const url = query.url ?? "";

    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.5",
      body: [
        {
          type: "TextBlock",
          text: "Microsoft Research",
          weight: "Bolder",
          size: "Medium",
        },
        {
          type: "TextBlock",
          text: `Content from: ${url}`,
          wrap: true,
        },
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View on Microsoft Research",
          url,
        },
      ],
    });

    const preview = CardFactory.heroCard("Microsoft Research", url);

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [{ ...card, preview }],
      },
    };
  }
}

interface SearchResult {
  title?: string;
  snippet?: string;
  url?: string;
  authors?: string;
  type?: string;
}

async function searchMSR(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`${DATA_API_URL}/tools/quick_search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, type: "all", limit: 5 }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: SearchResult[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}
