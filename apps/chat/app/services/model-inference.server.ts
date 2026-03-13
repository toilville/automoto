/**
 * Model Inference API Service — server-only.
 *
 * Provides direct access to Azure AI model inference endpoints via
 * @azure/ai-inference SDK. Used for lightweight completions that don't
 * need the full agent pipeline (e.g., summarization, classification).
 */
import type { Client } from "@azure-rest/core-client";
import { DefaultAzureCredential } from "@azure/identity";

/* ── Configuration ────────────────────────────────────────── */

interface ModelInferenceConfig {
  endpoint: string;
  model: string;
}

function getConfig(): ModelInferenceConfig {
  const endpoint = process.env.MODEL_INFERENCE_ENDPOINT;
  const model = process.env.MODEL_INFERENCE_MODEL || "gpt-4.1";

  if (!endpoint) throw new Error("MODEL_INFERENCE_ENDPOINT is required");

  return { endpoint, model };
}

/* ── Client Singleton ─────────────────────────────────────── */

let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (!client) {
    // Dynamic import to avoid bundling on client
    const { default: createClient } = await import("@azure-rest/ai-inference");
    const credential = new DefaultAzureCredential();
    const config = getConfig();
    client = createClient(config.endpoint, credential);
  }
  return client;
}

/* ── Public API ────────────────────────────────────────────── */

export interface CompletionResult {
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Run a simple chat completion (non-streaming).
 * Use for quick classification or summarization tasks that bypass the agent.
 */
export async function complete(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { max_tokens?: number; temperature?: number },
): Promise<CompletionResult> {
  const modelClient = await getClient();
  const config = getConfig();

  const response = await modelClient.path("/chat/completions").post({
    body: {
      model: config.model,
      messages,
      max_tokens: options?.max_tokens ?? 1024,
      temperature: options?.temperature ?? 0.3,
    },
  });

  if (response.status !== "200") {
    throw new Error(`Model inference failed: ${response.status}`);
  }

  const body = response.body as {
    choices: Array<{
      message: { content: string };
      finish_reason: string;
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };

  const choice = body.choices[0];
  return {
    content: choice.message.content,
    finishReason: choice.finish_reason,
    usage: body.usage
      ? {
          promptTokens: body.usage.prompt_tokens,
          completionTokens: body.usage.completion_tokens,
          totalTokens: body.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Generate embeddings for a text string.
 */
export async function embed(text: string): Promise<number[]> {
  const modelClient = await getClient();

  const response = await modelClient.path("/embeddings").post({
    body: {
      input: [text],
      model: "text-embedding-3-small",
    },
  });

  if (response.status !== "200") {
    throw new Error(`Embedding failed: ${response.status}`);
  }

  const body = response.body as {
    data: Array<{ embedding: number[] }>;
  };
  return body.data[0].embedding;
}
