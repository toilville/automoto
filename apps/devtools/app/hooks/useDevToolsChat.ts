/**
 * useDevToolsChat — Chat hook that intercepts SSE events and logs them
 * to the DevTools store for inspection.
 *
 * Wraps the same fetch+SSE pattern as useChatService but captures every
 * event, request, and response for the devtools panels.
 */
import { useState, useCallback, useRef } from "react";
import { getDevToolsState } from "~/store/devtools-store.js";
import type { ChannelType } from "@automoto/channel-adapter";
import type { ChatMessage as ChatMessageType } from "@automoto/chat-ui";

let counter = 0;
function uid() {
  return `dt-${Date.now()}-${++counter}`;
}

export interface UseDevToolsChatReturn {
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  abort: () => void;
}

export function useDevToolsChat(
  channel: ChannelType,
  _gatewayUrl?: string,
): UseDevToolsChatReturn {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    abort();
    setMessages([]);
    setError(null);
  }, [abort]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const store = getDevToolsState();
      const requestId = uid();
      const startTime = Date.now();

      // Add user message
      const userMsg: ChatMessageType = {
        id: uid(),
        content: message,
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      // Build request body for Foundry agent
      const conversationHistory = messages
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const requestBody = {
        message,
        conversationHistory,
        stream: true,
      };

      // Log request to store
      store.addRequest({
        id: requestId,
        timestamp: startTime,
        channel,
        request: requestBody,
        events: [],
      });

      store.addConsoleEntry({
        id: uid(),
        timestamp: startTime,
        level: "info",
        source: "chat",
        message: `→ POST /api/chat [${channel}] — "${message.slice(0, 60)}"`,
      });

      // Placeholder assistant message
      const assistantId = uid();
      const assistantMsg: ChatMessageType = {
        id: assistantId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        abortRef.current = new AbortController();
        const timeoutId = setTimeout(() => abortRef.current?.abort(), 60000);

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: abortRef.current.signal,
        });

        clearTimeout(timeoutId);

        // Log response status
        const headersObj: Record<string, string> = {};
        response.headers.forEach((v, k) => (headersObj[k] = v));

        store.updateRequest(requestId, {
          status: response.status,
          headers: headersObj,
        });

        if (!response.ok) {
          const errBody = await response
            .json()
            .catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(
            (errBody as { error?: string }).error || `HTTP ${response.status}`,
          );
        }

        if (!response.body) throw new Error("No response stream");

        // Consume SSE stream — intercept every event for devtools
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let eventIndex = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            const elapsed = Date.now() - startTime;

            // Log every SSE event to the devtools store
            const devToolsEvent = {
              id: uid(),
              timestamp: Date.now(),
              elapsed,
              event: event as Record<string, unknown>,
              channel,
              requestId,
            };
            store.addEvent(devToolsEvent);

            // Also attach to the request's events
            store.updateRequest(requestId, {
              events: [
                ...(getDevToolsState().requests.find((r) => r.id === requestId)
                  ?.events || []),
                devToolsEvent,
              ],
            });

            // Process event for the chat pane
            const eventType = event.type as string;
            switch (eventType) {
              case "text_delta":
              case "chunk":
                fullContent += (event.delta || event.chunk || "") as string;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m,
                  ),
                );
                break;

              case "done":
                fullContent =
                  (event.fullResponse as string) || fullContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m,
                  ),
                );
                break;

              case "error":
                throw new Error(event.message as string);
            }

            eventIndex++;
          }
        }

        // Finalize request log
        store.updateRequest(requestId, {
          durationMs: Date.now() - startTime,
          response: { fullContent, eventCount: eventIndex },
        });

        store.addConsoleEntry({
          id: uid(),
          timestamp: Date.now(),
          level: "info",
          source: "chat",
          message: `✓ ${channel} responded in ${Date.now() - startTime}ms (${eventIndex} events)`,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        setError(errorMessage);

        store.addConsoleEntry({
          id: uid(),
          timestamp: Date.now(),
          level: "error",
          source: "chat",
          message: `✗ ${channel} error: ${errorMessage}`,
        });

        store.updateRequest(requestId, {
          durationMs: Date.now() - startTime,
          status: 0,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${errorMessage}` }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [channel, abort, messages],
  );

  return { messages, isLoading, error, sendMessage, clearMessages, abort };
}
