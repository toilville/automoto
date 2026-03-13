import express from "express";
import cors from "cors";

const app = express();
const PORT = parseInt(process.env.PORT || "7072", 10);
const DATA_API_URL = process.env.DATA_API_URL || "http://localhost:7071";
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;

app.use(cors());
app.use(express.json());

// ---------- Auth middleware ----------

interface TokenPayload {
  tid?: string;
  aud?: string;
  exp?: number;
}

function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  // Skip auth when Azure AD is not configured (local dev)
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = decodeJwtPayload(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  if (payload.tid !== AZURE_TENANT_ID) {
    res.status(403).json({ error: "Token tenant mismatch" });
    return;
  }

  if (payload.aud !== AZURE_CLIENT_ID && payload.aud !== `api://${AZURE_CLIENT_ID}`) {
    res.status(403).json({ error: "Token audience mismatch" });
    return;
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    res.status(401).json({ error: "Token expired" });
    return;
  }

  next();
}

// ---------- Proxy helper ----------

async function proxyGet(path: string, query?: Record<string, string>): Promise<unknown> {
  const url = new URL(path, DATA_API_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Data service responded with ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

async function proxyPost(path: string, body: unknown): Promise<unknown> {
  const url = new URL(path, DATA_API_URL);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Data service responded with ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

// ---------- Routes ----------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "automoto-power-platform", dataApiUrl: DATA_API_URL });
});

app.get("/api/search", authMiddleware, async (req, res) => {
  try {
    const { query, type, limit } = req.query as Record<string, string>;
    const data = await proxyGet("/api/search", { query, type, limit });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch search results", detail: String(err) });
  }
});

app.get("/api/researchers/:name", authMiddleware, async (req, res) => {
  try {
    const data = await proxyGet(`/api/researchers/${encodeURIComponent(req.params.name)}`);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch researcher", detail: String(err) });
  }
});

app.get("/api/publications", authMiddleware, async (req, res) => {
  try {
    const { query, limit } = req.query as Record<string, string>;
    const data = await proxyGet("/api/publications", { query, limit });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch publications", detail: String(err) });
  }
});

app.get("/api/research-areas", authMiddleware, async (req, res) => {
  try {
    const data = await proxyGet("/api/research-areas");
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch research areas", detail: String(err) });
  }
});

app.post("/api/agent/chat", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    const data = await proxyPost("/api/agent/chat", { message });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to get agent response", detail: String(err) });
  }
});

// ---------- Start ----------

app.listen(PORT, () => {
  console.log(`Power Platform connector running on http://localhost:${PORT}`);
  console.log(`Proxying to data service at ${DATA_API_URL}`);
});
