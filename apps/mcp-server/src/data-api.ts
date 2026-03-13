/**
 * Data API client with error sanitization and Azure managed identity auth.
 *
 * Uses DefaultAzureCredential for outbound auth when DATA_API_SCOPE is set.
 * All errors are sanitized — full details logged to stderr only.
 *
 * Environment variables:
 *   DATA_API_URL   — Backend endpoint (default: http://localhost:7071)
 *   DATA_API_SCOPE — Azure AD scope for DefaultAzureCredential (optional; skips auth if unset)
 */

import type { AccessToken, TokenCredential } from "@azure/identity";

let credential: TokenCredential | null = null;
let cachedToken: AccessToken | null = null;

/** Lazily load and cache DefaultAzureCredential. */
async function acquireToken(scope: string): Promise<string | null> {
  // Re-use cached token with a 5-minute safety buffer
  if (cachedToken && cachedToken.expiresOnTimestamp > Date.now() + 300_000) {
    return cachedToken.token;
  }

  if (!credential) {
    const { DefaultAzureCredential } = await import("@azure/identity");
    credential = new DefaultAzureCredential();
  }

  cachedToken = await credential.getToken(scope);
  return cachedToken?.token ?? null;
}

/**
 * Call the Data API with automatic auth and sanitized errors.
 *
 * - Attaches a bearer token when `DATA_API_SCOPE` is configured.
 * - Logs full error details to stderr; throws a generic message to callers.
 */
export async function callDataApi(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string>;
  } = {},
): Promise<unknown> {
  const baseUrl = process.env.DATA_API_URL || "http://localhost:7071";
  const scope = process.env.DATA_API_SCOPE;

  const url = new URL(path, baseUrl);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {};
  if (options.body) headers["Content-Type"] = "application/json";

  if (scope) {
    const token = await acquireToken(scope);
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    // Log details server-side only — never surface to MCP clients
    const body = await res.text();
    console.error(
      `[MCP Server] Data API error: ${res.status} ${res.statusText} — ${url.pathname}`,
      body.slice(0, 500),
    );
    throw new Error(`Data API request failed (HTTP ${res.status})`);
  }

  return res.json();
}

/** Reset cached credentials — exposed for testing only. */
export function _resetCredentials(): void {
  credential = null;
  cachedToken = null;
}
