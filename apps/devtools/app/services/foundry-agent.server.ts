/**
 * Foundry Agent Client — server-only service for DevTools.
 *
 * Sends chat requests to an Azure AI Foundry agent and streams responses
 * back as SSE events. Handles the full tool-calling loop.
 *
 * Copied from apps/chat/app/services/foundry-agent.server.ts with
 * minimal modifications for the devtools context.
 */
import { DefaultAzureCredential } from "@azure/identity";
import { executeToolCall, type DataClientConfig, type ToolCallRequest } from "@msr/data-client";
import type { ChatRequest, StreamEvent, TokenUsage, CarouselCard } from "~/models/types";

/* ── Configuration ────────────────────────────────────────── */

interface FoundryConfig {
  endpoint: string;
  agentId: string;
  apiVersion: string;
  dataApiUrl: string;
}

function getConfig(): FoundryConfig {
  const endpoint = process.env.FOUNDRY_ENDPOINT;
  const agentId = process.env.FOUNDRY_AGENT_ID;
  const apiVersion = process.env.FOUNDRY_API_VERSION || "2024-12-01-preview";
  const dataApiUrl = process.env.DATA_API_URL || "http://localhost:7071";

  if (!endpoint) throw new Error("FOUNDRY_ENDPOINT is required");
  if (!agentId) throw new Error("FOUNDRY_AGENT_ID is required");

  return { endpoint, agentId, apiVersion, dataApiUrl };
}

/* ── Credential Management ────────────────────────────────── */

let credential: DefaultAzureCredential | null = null;

function getCredential(): DefaultAzureCredential {
  if (!credential) {
    credential = new DefaultAzureCredential();
  }
  return credential;
}

async function getAccessToken(): Promise<string> {
  const tokenResponse = await getCredential().getToken(
    "https://cognitiveservices.azure.com/.default",
  );
  return tokenResponse.token;
}

/* ── Agent Thread & Message API ───────────────────────────── */

interface ThreadMessage {
  role: "user" | "assistant";
  content: string;
}

async function createThread(config: FoundryConfig): Promise<string> {
  const token = await getAccessToken();
  const url = `${config.endpoint}/openai/threads?api-version=${config.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create thread: ${response.status} ${errorText}`);
  }

  const data = await response.json() as { id: string };
  return data.id;
}

async function addMessage(
  config: FoundryConfig,
  threadId: string,
  message: ThreadMessage,
): Promise<void> {
  const token = await getAccessToken();
  const url = `${config.endpoint}/openai/threads/${threadId}/messages?api-version=${config.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: message.role,
      content: message.content,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add message: ${response.status} ${errorText}`);
  }
}

async function createStreamingRun(
  config: FoundryConfig,
  threadId: string,
): Promise<Response> {
  const token = await getAccessToken();
  const url = `${config.endpoint}/openai/threads/${threadId}/runs?api-version=${config.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistant_id: config.agentId,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create run: ${response.status} ${errorText}`);
  }

  return response;
}

async function submitToolOutputsStreaming(
  config: FoundryConfig,
  threadId: string,
  runId: string,
  toolOutputs: Array<{ tool_call_id: string; output: string }>,
): Promise<Response> {
  const token = await getAccessToken();
  const url = `${config.endpoint}/openai/threads/${threadId}/runs/${runId}/submit_tool_outputs?api-version=${config.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tool_outputs: toolOutputs,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit tool outputs: ${response.status} ${errorText}`);
  }

  return response;
}

/* ── SSE Stream Parser ────────────────────────────────────── */

interface StreamParseResult {
  events: StreamEvent[];
  requiresAction?: {
    runId: string;
    toolCalls: ToolCallRequest[];
  };
  fullResponse: string;
  chunkIndex: number;
  usage: TokenUsage;
  references: string[];
  cards: CarouselCard[];
}

async function parseStreamSegment(
  response: Response,
  initialFullResponse = "",
  initialChunkIndex = 0,
): Promise<StreamParseResult> {
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullResponse = initialFullResponse;
  let chunkIndex = initialChunkIndex;
  const usage: TokenUsage = {};
  const cards: CarouselCard[] = [];
  const references: string[] = [];
  const events: StreamEvent[] = [];
  let currentEvent = "";
  let requiresAction: StreamParseResult["requiresAction"];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }

        if (line === "data: [DONE]") {
          currentEvent = "";
          continue;
        }

        if (!line.startsWith("data: ")) {
          continue;
        }

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(line.slice(6));
        } catch {
          currentEvent = "";
          continue;
        }

        const eventName = currentEvent;
        currentEvent = "";

        if (eventName === "thread.message.delta") {
          const delta = payload.delta as Record<string, unknown> | undefined;
          const content = delta?.content as Array<Record<string, unknown>> | undefined;
          if (content) {
            for (const part of content) {
              if (part.type === "text") {
                const textObj = part.text as Record<string, unknown>;
                const chunk = textObj?.value as string;
                if (chunk) {
                  fullResponse += chunk;
                  events.push({
                    type: "chunk",
                    chunk,
                    id: `chunk-${chunkIndex}`,
                    index: chunkIndex++,
                  });
                }
              }
            }
          }
        }

        if (eventName === "thread.run.step.delta") {
          const stepDelta = payload.delta as Record<string, unknown> | undefined;
          const stepDetails = stepDelta?.step_details as Record<string, unknown> | undefined;
          if (stepDetails?.type === "tool_calls") {
            const toolCalls = stepDetails.tool_calls as Array<Record<string, unknown>> | undefined;
            if (toolCalls) {
              for (const call of toolCalls) {
                const fn = call.function as Record<string, unknown> | undefined;
                if (fn?.name) {
                  events.push({
                    type: "tool_call",
                    toolName: fn.name as string,
                    status: "started",
                  });
                }
              }
            }
          }
        }

        if (eventName === "thread.run.requires_action") {
          const runId = payload.id as string;
          const requiredAction = payload.required_action as Record<string, unknown> | undefined;
          if (requiredAction?.type === "submit_tool_outputs") {
            const submitObj = requiredAction.submit_tool_outputs as Record<string, unknown>;
            const toolCalls = submitObj?.tool_calls as Array<Record<string, unknown>> | undefined;
            if (toolCalls && toolCalls.length > 0) {
              requiresAction = {
                runId,
                toolCalls: toolCalls.map((tc) => {
                  const fn = tc.function as Record<string, unknown>;
                  return {
                    id: tc.id as string,
                    name: fn.name as string,
                    arguments: fn.arguments as string,
                  };
                }),
              };
            }
          }
        }

        if (eventName === "thread.run.completed") {
          const runUsage = payload.usage as Record<string, number> | undefined;
          if (runUsage) {
            usage.promptTokens = runUsage.prompt_tokens;
            usage.completionTokens = runUsage.completion_tokens;
            usage.totalTokens = runUsage.total_tokens;
          }
        }

        if (eventName === "thread.message.completed") {
          const content = (payload.content as Array<Record<string, unknown>> | undefined);
          if (content) {
            for (const part of content) {
              if (part.type === "text") {
                const textObj = part.text as Record<string, unknown>;
                const annotations = textObj?.annotations as Array<Record<string, unknown>> | undefined;
                if (annotations) {
                  for (const ann of annotations) {
                    if (ann.type === "file_citation" || ann.type === "url_citation") {
                      const ref = (ann.text as string) || (ann.url as string) || "";
                      if (ref) references.push(ref);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { events, requiresAction, fullResponse, chunkIndex, usage, references, cards };
}

/* ── Public API ────────────────────────────────────────────── */

const MAX_TOOL_ROUNDS = 5;

export async function streamAgentResponse(
  request: ChatRequest,
): Promise<ReadableStream<Uint8Array>> {
  const config = getConfig();
  const encoder = new TextEncoder();

  const threadId = await createThread(config);

  for (const msg of request.conversationHistory) {
    await addMessage(config, threadId, msg);
  }

  await addMessage(config, threadId, {
    role: "user",
    content: request.message,
  });

  return new ReadableStream({
    async start(controller) {
      const emit = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        let agentResponse = await createStreamingRun(config, threadId);

        let fullResponse = "";
        let chunkIndex = 0;
        let finalUsage: TokenUsage = {};
        let allReferences: string[] = [];
        const allCards: CarouselCard[] = [];

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const result = await parseStreamSegment(
            agentResponse,
            fullResponse,
            chunkIndex,
          );

          for (const event of result.events) {
            emit(event);
          }

          fullResponse = result.fullResponse;
          chunkIndex = result.chunkIndex;
          if (result.usage.totalTokens) finalUsage = result.usage;
          allReferences = [...allReferences, ...result.references];
          allCards.push(...result.cards);

          if (!result.requiresAction) break;

          const toolCalls = result.requiresAction.toolCalls;
          const dataConfig: DataClientConfig = { baseUrl: config.dataApiUrl };
          const toolOutputs = await Promise.all(
            toolCalls.map(async (tc) => {
              const output = await executeToolCall(dataConfig, tc);
              emit({
                type: "tool_call",
                toolName: tc.name,
                status: "completed",
              });
              return { tool_call_id: tc.id, output };
            }),
          );

          agentResponse = await submitToolOutputsStreaming(
            config,
            threadId,
            result.requiresAction.runId,
            toolOutputs,
          );
        }

        if (allReferences.length > 0) {
          emit({ type: "references", references: allReferences });
        }
        if (allCards.length > 0) {
          emit({ type: "cards", cards: allCards });
        }
        if (finalUsage.totalTokens) {
          emit({ type: "usage", usage: finalUsage });
        }
        emit({ type: "done", finishReason: "stop", fullResponse });
      } catch (error) {
        emit({
          type: "error",
          message: error instanceof Error ? error.message : "Agent stream failed",
          code: "AGENT_ERROR",
        });
      } finally {
        controller.close();
      }
    },
  });
}
