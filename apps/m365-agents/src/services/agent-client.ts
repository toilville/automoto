/**
 * Foundry Agent Client — non-streaming REST client for Bot Framework.
 *
 * Follows the same SSE-based REST API pattern as the Teams streaming
 * service but collects the full response into a single result object
 * instead of emitting SSE events. Handles the full tool-calling loop:
 *   1. Create thread + add messages
 *   2. Start a streaming run
 *   3. If agent requires tool calls → execute them against the data API
 *   4. Submit tool outputs and continue streaming
 *   5. Repeat until the run completes (up to 5 rounds)
 */
import { DefaultAzureCredential } from "@azure/identity";
import { executeToolCall, type DataClientConfig, type ToolCallRequest } from "@msr/data-client";

/* ── Types ────────────────────────────────────────────────── */

export interface CardData {
  kind: "researcher" | "publication" | "project" | "unknown";
  title: string;
  metadata: Record<string, unknown>;
}

export interface AgentResponse {
  text: string;
  cards: CardData[];
  references: string[];
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/* ── Configuration ────────────────────────────────────────── */

interface FoundryConfig {
  endpoint: string;
  agentId: string;
  apiVersion: string;
  dataApiUrl: string;
}

function getConfig(): FoundryConfig {
  // Endpoint: prefer AZURE_AI_PROJECTS_CONNECTION_STRING (first semicolon segment)
  let endpoint = process.env.FOUNDRY_ENDPOINT;
  const connectionString = process.env.AZURE_AI_PROJECTS_CONNECTION_STRING;
  if (connectionString) {
    endpoint = connectionString.split(";")[0];
  }

  const agentId = process.env.AGENT_ID ?? process.env.FOUNDRY_AGENT_ID;
  const apiVersion = process.env.FOUNDRY_API_VERSION ?? "2024-12-01-preview";
  const dataApiUrl = process.env.DATA_API_URL ?? "http://localhost:7071";

  if (!endpoint) {
    throw new Error(
      "AZURE_AI_PROJECTS_CONNECTION_STRING or FOUNDRY_ENDPOINT is required",
    );
  }
  if (!agentId) {
    throw new Error("AGENT_ID or FOUNDRY_AGENT_ID is required");
  }

  return { endpoint: endpoint.replace(/\/$/, ""), agentId, apiVersion, dataApiUrl };
}

/* ── Credential Management ────────────────────────────────── */

let _credential: DefaultAzureCredential | null = null;

function getCredential(): DefaultAzureCredential {
  if (!_credential) _credential = new DefaultAzureCredential();
  return _credential;
}

async function getAccessToken(): Promise<string> {
  const tokenResponse = await getCredential().getToken(
    "https://cognitiveservices.azure.com/.default",
  );
  return tokenResponse.token;
}

/* ── Agent Thread & Message API ───────────────────────────── */

async function createThread(config: FoundryConfig): Promise<string> {
  const token = await getAccessToken();
  const url = `${config.endpoint}/openai/threads?api-version=${config.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create thread: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

async function addMessage(
  config: FoundryConfig,
  threadId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const token = await getAccessToken();
  const url = `${config.endpoint}/openai/threads/${threadId}/messages?api-version=${config.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role, content }),
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
      Authorization: `Bearer ${token}`,
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
      Authorization: `Bearer ${token}`,
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
  requiresAction?: {
    runId: string;
    toolCalls: ToolCallRequest[];
  };
  text: string;
  usage: AgentResponse["usage"];
  references: string[];
  toolOutputs: string[];
}

/**
 * Parse a single SSE stream from the Foundry Agent, collecting all
 * text deltas and metadata into a single result.
 */
async function parseStreamSegment(
  response: Response,
  initialText = "",
): Promise<StreamParseResult> {
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = initialText;
  const usage: AgentResponse["usage"] = {};
  const references: string[] = [];
  const toolOutputs: string[] = [];
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

        // Message delta — accumulate text chunks
        if (eventName === "thread.message.delta") {
          const delta = payload.delta as Record<string, unknown> | undefined;
          const content = delta?.content as Array<Record<string, unknown>> | undefined;
          if (content) {
            for (const part of content) {
              if (part.type === "text") {
                const textObj = part.text as Record<string, unknown>;
                const chunk = textObj?.value as string;
                if (chunk) text += chunk;
              }
            }
          }
        }

        // Run requires action — agent needs tool outputs
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

        // Run completed — extract token usage
        if (eventName === "thread.run.completed") {
          const runUsage = payload.usage as Record<string, number> | undefined;
          if (runUsage) {
            usage.promptTokens = runUsage.prompt_tokens;
            usage.completionTokens = runUsage.completion_tokens;
            usage.totalTokens = runUsage.total_tokens;
          }
        }

        // Message completed — extract citation annotations
        if (eventName === "thread.message.completed") {
          const content = payload.content as Array<Record<string, unknown>> | undefined;
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

  return { requiresAction, text, usage, references, toolOutputs };
}

/* ── Card Extraction ──────────────────────────────────────── */

/**
 * Try to extract structured card data from tool call outputs.
 * Tool results may contain JSON with researcher, publication, or project info.
 */
function extractCardsFromToolOutput(toolName: string, output: string): CardData[] {
  const cards: CardData[] = [];
  try {
    const data = JSON.parse(output);
    const items = Array.isArray(data) ? data : data?.results ?? data?.items ?? [data];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      if (toolName.includes("researcher") || item.researchAreas || item.lab) {
        cards.push({
          kind: "researcher",
          title: item.name ?? item.displayName ?? "Researcher",
          metadata: item,
        });
      } else if (toolName.includes("publication") || item.abstract || item.authors) {
        cards.push({
          kind: "publication",
          title: item.title ?? "Publication",
          metadata: item,
        });
      } else if (toolName.includes("project") || item.projectId) {
        cards.push({
          kind: "project",
          title: item.title ?? item.name ?? "Project",
          metadata: item,
        });
      }
    }
  } catch {
    // Output wasn't JSON — skip card extraction
  }
  return cards;
}

/* ── Public API ────────────────────────────────────────────── */

const MAX_TOOL_ROUNDS = 5;

/**
 * Send a message to the Foundry Agent and return the completed response.
 *
 * Creates a thread, adds conversation history + current message, starts a
 * streaming run, parses SSE events, handles tool-calling loops, and collects
 * everything into a single AgentResponse object.
 */
export async function getAgentResponse(params: {
  message: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AgentResponse> {
  const config = getConfig();

  // 1. Create thread and populate with conversation history
  const threadId = await createThread(config);

  for (const msg of params.conversationHistory.slice(-20)) {
    await addMessage(config, threadId, msg.role, msg.content);
  }

  await addMessage(config, threadId, "user", params.message);

  // 2. Start the streaming run
  let agentResponse = await createStreamingRun(config, threadId);

  let fullText = "";
  let finalUsage: AgentResponse["usage"] = {};
  const allReferences: string[] = [];
  const allCards: CardData[] = [];

  // 3. Tool-calling loop
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await parseStreamSegment(agentResponse, fullText);

    fullText = result.text;
    if (result.usage.totalTokens) finalUsage = result.usage;
    allReferences.push(...result.references);

    // If no tool calls needed, we're done
    if (!result.requiresAction) break;

    // Execute tool calls against the data service API in parallel
    const toolCalls = result.requiresAction.toolCalls;
    const dataConfig: DataClientConfig = { baseUrl: config.dataApiUrl };

    const toolOutputs = await Promise.all(
      toolCalls.map(async (tc) => {
        const output = await executeToolCall(dataConfig, tc);
        // Extract structured card data from tool outputs
        allCards.push(...extractCardsFromToolOutput(tc.name, output));
        return { tool_call_id: tc.id, output };
      }),
    );

    // Submit tool outputs and continue streaming
    agentResponse = await submitToolOutputsStreaming(
      config,
      threadId,
      result.requiresAction.runId,
      toolOutputs,
    );
  }

  return {
    text: fullText || "No response from agent.",
    cards: allCards,
    references: allReferences,
    usage: finalUsage,
  };
}
