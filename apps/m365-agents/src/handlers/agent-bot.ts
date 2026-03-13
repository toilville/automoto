/**
 * Agent Bot — M365 Agents SDK ActivityHandler.
 *
 * Handles messages from M365 channels, sends them to the Azure AI Agent
 * Service via the Foundry REST API, and returns responses as text +
 * Adaptive Cards.
 */
import {
  ActivityHandler,
  CardFactory,
  MessageFactory,
  type TurnContext,
} from "@microsoft/agents-hosting";
import { Activity } from "@microsoft/agents-activity";
import {
  createResearcherCard,
  createPublicationCard,
  createProjectCard,
} from "../cards/adaptive-templates.js";
import { getAgentResponse, type CardData } from "../services/agent-client.js";

export class AgentBot extends ActivityHandler {
  // Per-user conversation history (keyed by conversation ID)
  private history = new Map<string, Array<{ role: "user" | "assistant"; content: string }>>();

  constructor() {
    super();

    this.onMessage(async (context: TurnContext, next) => {
      const userMessage = context.activity.text?.trim();
      if (!userMessage) {
        await next();
        return;
      }

      // Send typing indicator
      await context.sendActivity(new Activity("typing"));

      const convId = context.activity.conversation?.id ?? "default";
      const convHistory = this.history.get(convId) ?? [];

      try {
        const response = await getAgentResponse({
          message: userMessage,
          conversationHistory: convHistory.slice(-20),
        });

        // Update history
        convHistory.push({ role: "user", content: userMessage });
        convHistory.push({ role: "assistant", content: response.text });
        this.history.set(convId, convHistory.slice(-40));

        // Send text response
        await context.sendActivity(response.text);

        // Render Adaptive Cards from structured card data returned by the agent
        for (const cardData of response.cards) {
          const card = buildAdaptiveCard(cardData);
          if (card) {
            await context.sendActivity(
              MessageFactory.attachment(CardFactory.adaptiveCard(card)),
            );
          }
        }
      } catch (error) {
        console.error("[AgentBot] Error processing message:", error);
        await context.sendActivity(
          "⚠️ I'm sorry, the AI research assistant is temporarily unavailable. " +
          "Please try again in a moment. If the issue persists, contact support.",
        );
      }

      await next();
    });

    this.onMembersAdded(async (context, next) => {
      for (const member of context.activity.membersAdded ?? []) {
        if (member.id !== context.activity.recipient?.id) {
          await context.sendActivity(
            "👋 Welcome! I'm the **Research Assistant**.\n\n" +
            "Ask me about research areas, find researchers, browse publications, " +
            "and stay updated with the latest research.\n\n" +
            "Try asking:\n" +
            "- *Find researchers working on machine learning*\n" +
            "- *Show me recent publications on NLP*\n" +
            "- *What research areas are available?*",
          );
        }
      }
      await next();
    });
  }
}

/**
 * Map a CardData object from the agent response to an Adaptive Card
 * using the appropriate template function.
 */
function buildAdaptiveCard(cardData: CardData): Record<string, unknown> | null {
  const m = cardData.metadata;

  switch (cardData.kind) {
    case "researcher":
      return createResearcherCard({
        name: cardData.title,
        role: (m.role ?? m.title) as string | undefined,
        lab: m.lab as string | undefined,
        researchAreas: m.researchAreas as string[] | undefined,
        bio: m.bio as string | undefined,
        avatarUrl: m.avatarUrl as string | undefined,
      });

    case "publication":
      return createPublicationCard({
        title: cardData.title,
        authors: m.authors as string[] | undefined,
        abstract: m.abstract as string | undefined,
        date: m.date as string | undefined,
        url: m.url as string | undefined,
      });

    case "project":
      return createProjectCard({
        title: cardData.title,
        description: m.description as string | undefined,
        people: m.people as string[] | undefined,
        tags: m.tags as string[] | undefined,
        url: m.url as string | undefined,
      });

    default:
      return null;
  }
}
