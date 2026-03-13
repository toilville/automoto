/**
 * Normalized Channel Endpoint — /api/v1/:channel
 *
 * Single endpoint that accepts requests from ANY channel, normalizes them
 * through the typed adapter system, and returns responses in the channel's
 * native format.
 *
 * Flow:
 *   1. Inbound:  Channel-native request → adapter.pub() → MSRAgentRequest
 *   2. Process:  MSRAgentRequest → Agent Backend (Foundry / data API)
 *   3. Outbound: MSRAgentResponse → adapter.sub() / adapter.stream() → Channel-native response
 *
 * This replaces per-channel proxy routes with a single typed pipeline.
 */
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import {
  getAdapter,
  listAdapters,
  type ChannelType,
  type MSRAgentRequest,
  type MSRAgentResponse,
  type MSRStreamEvent,
} from "@automoto/channel-adapter";

const DATA_API_URL = process.env.DATA_API_URL ?? "http://localhost:7071";
const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT ?? "";
const FOUNDRY_AGENT_ID = process.env.FOUNDRY_AGENT_ID ?? "";
const FOUNDRY_API_VERSION = process.env.FOUNDRY_API_VERSION ?? "2024-12-01-preview";

/* ── Agent Backend Call ───────────────────────────────────── */

/**
 * Calls the MSR data API search tool (the common denominator backend).
 * In production, this would call the Foundry Agent for full AI responses;
 * here we use the data API directly as the universal backend.
 */
async function callAgentBackend(
  request: MSRAgentRequest,
): Promise<MSRAgentResponse> {
  const query = request.message.content;

  // Call data API for search results
  const searchRes = await fetch(`${DATA_API_URL}/tools/quick_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, type: "all", limit: 5 }),
  });

  const searchData = (await searchRes.json()) as {
    results?: Array<{
      title?: string;
      snippet?: string;
      url?: string;
      type?: string;
    }>;
  };

  const results = searchData.results ?? [];

  // Build canonical response
  const responseText = results.length > 0
    ? results
        .map((r) => `**${r.title ?? "Untitled"}**\n${r.snippet ?? ""}\n${r.url ?? ""}`)
        .join("\n\n")
    : `No results found for "${query}". Try a different search term.`;

  return {
    requestId: request.requestId,
    message: {
      id: `resp-${request.requestId}`,
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
    },
    cards: results.map((r, i) => ({
      id: `card-${i}`,
      kind: "publication" as const,
      title: r.title ?? "Untitled",
      data: { snippet: r.snippet, type: r.type },
      url: r.url,
    })),
    references: results
      .filter((r) => r.url)
      .map((r, i) => ({
        id: `ref-${i}`,
        title: r.title ?? "Reference",
        url: r.url,
        snippet: r.snippet,
        type: "search_result" as const,
      })),
    toolCalls: [
      { toolName: "quick_search", status: "completed" as const, result: { count: results.length } },
    ],
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    finishReason: "stop",
    suggestedActions: [
      { id: "sa-1", label: "Search publications", type: "action", payload: "publications" },
      { id: "sa-2", label: "Find researchers", type: "action", payload: "researchers" },
      { id: "sa-3", label: "Browse research areas", type: "action", payload: "areas" },
    ],
  };
}

/**
 * Calls the agent backend and streams MSRStreamEvents back.
 * Uses the data API for context, then synthesizes stream events.
 */
async function* streamAgentBackend(
  request: MSRAgentRequest,
): AsyncGenerator<MSRStreamEvent> {
  yield { type: "tool_start", requestId: request.requestId, toolName: "quick_search" };

  // Fetch from data API
  const searchRes = await fetch(`${DATA_API_URL}/tools/quick_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: request.message.content, type: "all", limit: 5 }),
  });

  const searchData = (await searchRes.json()) as {
    results?: Array<{ title?: string; snippet?: string; url?: string; type?: string }>;
  };
  const results = searchData.results ?? [];

  yield { type: "tool_end", requestId: request.requestId, toolName: "quick_search", result: { count: results.length } };

  // Stream text deltas (simulate chunked response)
  const fullText = results.length > 0
    ? results.map((r) => `**${r.title ?? "Untitled"}**\n${r.snippet ?? ""}`).join("\n\n")
    : `No results found for "${request.message.content}".`;

  const chunks = fullText.match(/.{1,80}/g) ?? [fullText];
  for (let i = 0; i < chunks.length; i++) {
    yield { type: "text_delta", requestId: request.requestId, delta: chunks[i], index: i };
  }

  // Send references
  if (results.length > 0) {
    yield {
      type: "reference",
      requestId: request.requestId,
      references: results
        .filter((r) => r.url)
        .map((r, i) => ({
          id: `ref-${i}`,
          title: r.title ?? "Reference",
          url: r.url,
          snippet: r.snippet,
          type: "search_result" as const,
        })),
    };
  }

  // Send cards
  for (const [i, r] of results.entries()) {
    yield {
      type: "card",
      requestId: request.requestId,
      card: {
        id: `card-${i}`,
        kind: "publication" as const,
        title: r.title ?? "Untitled",
        data: { snippet: r.snippet, type: r.type },
        url: r.url,
      },
    };
  }

  yield { type: "done", requestId: request.requestId, finishReason: "stop", fullResponse: fullText };
}

/* ── Router ───────────────────────────────────────────────── */

export function normalizedRouter(): Router {
  const router = createRouter();

  router.use((_req, _res, next) => {
    // body parsing for this sub-router only (gateway may not have it globally)
    next();
  });

  /**
   * GET /api/v1/adapters — List all registered channel adapters
   */
  router.get("/adapters", (_req: Request, res: Response) => {
    res.json({
      adapters: listAdapters(),
      protocol: {
        pub: "POST /api/v1/:channel — Inbound: channel-native → canonical",
        sub: "Response body — Outbound: canonical → channel-native",
        stream: "SSE — Real-time: canonical events → channel-native chunks",
      },
    });
  });

  /**
   * POST /api/v1/:channel — Universal normalized endpoint
   *
   * Accepts a request in the channel's native format, normalizes it via
   * the typed adapter, calls the agent backend, and returns the response
   * in the channel's native format.
   *
   * Query params:
   *   ?stream=true  — Force streaming response (if channel supports it)
   *
   * Examples:
   *   POST /api/v1/web         { message: "find ML papers", conversationHistory: [] }
   *   POST /api/v1/m365-agents { text: "find ML papers", conversationId: "123" }
   *   POST /api/v1/mcp-server  { tool: "search_research", arguments: { query: "ML" } }
   *   POST /api/v1/github-cli  { command: "search", args: ["ML papers"], flags: {} }
   */
  router.post("/:channel", async (req: Request, res: Response) => {
    const channelType = req.params.channel as ChannelType;

    // Get the typed adapter
    let adapter;
    try {
      adapter = getAdapter(channelType);
    } catch {
      res.status(400).json({
        error: "Unknown channel",
        channel: channelType,
        available: listAdapters().map((a) => a.type),
      });
      return;
    }

    // msr.pub — Normalize inbound request
    let canonicalRequest: MSRAgentRequest;
    try {
      canonicalRequest = adapter.pub(req.body);
    } catch (err) {
      res.status(422).json({
        error: "Failed to parse channel request",
        channel: channelType,
        details: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    const wantStream = adapter.supportsStreaming &&
      (req.query.stream === "true" || canonicalRequest.stream);

    try {
      if (wantStream) {
        // msr.stream — Stream response in channel-native format
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();

        for await (const event of streamAgentBackend(canonicalRequest)) {
          const chunk = adapter.stream(event);
          if (chunk !== null) {
            res.write(typeof chunk === "string" ? chunk : JSON.stringify(chunk));
          }
        }

        res.end();
      } else {
        // msr.sub — Complete response in channel-native format
        const canonicalResponse = await callAgentBackend(canonicalRequest);
        const nativeResponse = adapter.sub(canonicalResponse);
        res.json(nativeResponse);
      }
    } catch (err) {
      console.error(`[Normalized] Error processing ${channelType} request:`, err);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Agent backend error",
          channel: channelType,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } else {
        res.end();
      }
    }
  });

  return router;
}
