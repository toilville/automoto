/**
 * Authentication and CORS middleware for the MCP SSE transport.
 *
 * Validates Entra ID (Azure AD) bearer tokens on incoming HTTP requests.
 * Disabled for stdio transport (inherits local machine security).
 *
 * Environment variables:
 *   MCP_AUTH_ENABLED    — "true" (default for SSE) or "false"
 *   AZURE_TENANT_ID     — Entra ID tenant for issuer validation
 *   MCP_AUTH_AUDIENCE    — Expected token audience (app registration ID)
 *   MCP_ALLOWED_ORIGINS  — Comma-separated allowed CORS origins ("*" for all)
 */

import type { IncomingMessage, ServerResponse } from "node:http";

/* ── Configuration ──────────────────────────────────────────── */

export interface AuthConfig {
  enabled: boolean;
  tenantId?: string;
  audience?: string;
  allowedOrigins: string[];
}

export function loadAuthConfig(): AuthConfig {
  return {
    enabled: process.env.MCP_AUTH_ENABLED !== "false",
    tenantId: process.env.AZURE_TENANT_ID,
    audience: process.env.MCP_AUTH_AUDIENCE,
    allowedOrigins: process.env.MCP_ALLOWED_ORIGINS
      ? process.env.MCP_ALLOWED_ORIGINS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  };
}

/* ── JWT helpers ────────────────────────────────────────────── */

export interface JwtPayload {
  exp?: number;
  iss?: string;
  aud?: string;
  sub?: string;
  tid?: string;
  [key: string]: unknown;
}

/** Decode a JWT payload without signature verification. */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

/** Validate standard JWT claims against the auth configuration. */
export function validateClaims(
  payload: JwtPayload,
  config: AuthConfig,
): { valid: boolean; reason?: string } {
  if (payload.exp != null && Date.now() / 1000 > payload.exp) {
    return { valid: false, reason: "Token expired" };
  }

  if (config.tenantId) {
    const v1 = `https://sts.windows.net/${config.tenantId}/`;
    const v2 = `https://login.microsoftonline.com/${config.tenantId}/v2.0`;
    if (payload.iss !== v1 && payload.iss !== v2) {
      return { valid: false, reason: "Invalid token issuer" };
    }
  }

  if (config.audience && payload.aud !== config.audience) {
    return { valid: false, reason: "Invalid token audience" };
  }

  return { valid: true };
}

/* ── HTTP middleware ─────────────────────────────────────────── */

/** Extract bearer token from the Authorization header. */
export function extractBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

/**
 * Authenticate an incoming HTTP request.
 * Returns `true` if authorized; sends an error response and returns `false` otherwise.
 */
export function authenticateRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: AuthConfig,
): boolean {
  if (!config.enabled) return true;

  const token = extractBearerToken(req);
  if (!token) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Bearer",
    });
    res.end(JSON.stringify({ error: "Authentication required" }));
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid token format" }));
    return false;
  }

  const result = validateClaims(payload, config);
  if (!result.valid) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: result.reason }));
    return false;
  }

  return true;
}

/* ── CORS ───────────────────────────────────────────────────── */

/**
 * Apply CORS headers and handle preflight requests.
 * Returns `true` if the request was a preflight (OPTIONS) and has been fully handled.
 *
 * When `allowedOrigins` is empty, no CORS headers are set (same-origin only).
 * Set `MCP_ALLOWED_ORIGINS=*` to allow all origins.
 */
export function handleCors(
  req: IncomingMessage,
  res: ServerResponse,
  config: AuthConfig,
): boolean {
  const origin = req.headers.origin;

  if (origin && config.allowedOrigins.length > 0) {
    const allowed =
      config.allowedOrigins.includes("*") ||
      config.allowedOrigins.includes(origin);

    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type",
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}
