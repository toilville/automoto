/**
 * useChatService — Client-side hook that sends messages to /api/chat
 * and consumes the SSE stream, updating message state incrementally.
 */
import { useState, useCallback, useRef } from "react";
import type {
  ChatMessage,
  ChatRequest,
  StreamEvent,
  PageContext,
  CarouselCard,
  TokenUsage,
} from "~/models/types";
import { useAnalyticsOptional } from "@automoto/analytics/react";

export interface UseChatServiceOptions {
  pageContext?: PageContext;
  stream?: boolean;
}

export interface UseChatServiceReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, action?: ChatRequest["action"]) => Promise<void>;
  clearMessages: () => void;
}

let messageCounter = 0;

function generateId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

const MAX_HISTORY_TURNS = 40;

export function useChatService(options?: UseChatServiceOptions): UseChatServiceReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const analytics = useAnalyticsOptional();

  const sendMessage = useCallback(async (
    message: string,
    action?: ChatRequest["action"],
  ) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      content: message,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const sendTimestamp = performance.now();

    analytics?.trackEvent({
      name: "chat_message_sent",
      properties: {
        messageLength: message.length,
        action: action ?? "chat",
        historyLength: messages.length,
      },
    });

    // Build conversation history (last N turns)
    const history = messages
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));

    const body: ChatRequest = {
      message,
      conversationHistory: history,
      action,
      pageContext: options?.pageContext,
      stream: options?.stream !== false,
    };

    // Create assistant message placeholder
    const assistantId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      responseType: "agent",
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error((errorBody as { error?: string }).error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream");
      }

      // Consume SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let cards: CarouselCard[] = [];
      let ragSources: string[] = [];
      let usage: TokenUsage | undefined;
      let finishReason = "stop";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          let event: StreamEvent;
          try {
            event = JSON.parse(line.slice(6)) as StreamEvent;
          } catch {
            continue;
          }

          switch (event.type) {
            case "chunk":
              fullContent += event.chunk;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullContent } : m,
                ),
              );
              break;

            case "references":
              ragSources = [...ragSources, ...event.references];
              break;

            case "cards":
              cards = [...cards, ...event.cards];
              break;

            case "usage":
              usage = event.usage;
              break;

            case "done":
              finishReason = event.finishReason;
              fullContent = event.fullResponse || fullContent;
              break;

            case "error":
              throw new Error(event.message);
          }
        }
      }

      // Finalize assistant message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: fullContent,
                referencedCards: cards.length > 0 ? cards : undefined,
                ragSources: ragSources.length > 0 ? ragSources : undefined,
                usage,
                finishReason,
              }
            : m,
        ),
      );

      analytics?.trackEvent({
        name: "chat_response_received",
        properties: {
          responseLength: fullContent.length,
          cardCount: cards.length,
          ragSourceCount: ragSources.length,
          finishReason,
          durationMs: Math.round(performance.now() - sendTimestamp),
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
        },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;

      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);

      analytics?.trackEvent({
        name: "chat_error",
        properties: {
          error: errorMessage,
          durationMs: Math.round(performance.now() - sendTimestamp),
        },
      });

      // Update assistant message with error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Sorry, I encountered an error. Please try again.",
                refusal: true,
                refusalReason: "error",
                responseType: "error",
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, options?.pageContext, options?.stream]);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);

    analytics?.trackEvent({
      name: "chat_reset",
      properties: { previousMessageCount: messages.length },
    });
  }, [analytics, messages.length]);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
