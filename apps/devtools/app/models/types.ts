/**
 * Minimal types for the DevTools chat API route.
 * Mirrors the subset of apps/chat types needed for Foundry streaming.
 */

export interface ChatRequest {
  message: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  stream?: boolean;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface CarouselCard {
  id: string;
  cardKind: string;
  title: string;
  [key: string]: unknown;
}

/** SSE events streamed from server → client. */
export type StreamEvent =
  | { type: "chunk"; chunk: string; id: string; index: number }
  | { type: "references"; references: string[] }
  | { type: "cards"; cards: CarouselCard[] }
  | { type: "tool_call"; toolName: string; status: "started" | "completed"; result?: unknown }
  | { type: "usage"; usage: TokenUsage }
  | { type: "done"; finishReason: string; fullResponse: string }
  | { type: "error"; message: string; code?: string };
