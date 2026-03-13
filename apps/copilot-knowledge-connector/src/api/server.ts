/**
 * Copilot Knowledge Connector — API server.
 *
 * Serves the OpenAPI endpoints that Microsoft 365 Copilot calls
 * to retrieve knowledge for grounding AI responses.
 *
 * Endpoints:
 *   GET /api/search          — Search across all content
 *   GET /api/researchers/:name — Get researcher details
 *   GET /api/publications    — Browse publications
 *   GET /api/research-areas  — List research areas
 *   GET /api/health          — Health check
 */
import express from "express";

const app = express();
const port = parseInt(process.env.PORT ?? "8080", 10);
const DATA_API_URL = process.env.DATA_API_URL ?? "http://localhost:7071";

/**
 * Proxy a request to the data API, with error handling.
 */
async function proxyToDataApi(path: string, query: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(path, DATA_API_URL);
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Data API returned ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/* ── Search ───────────────────────────────────────────────── */

app.get("/api/search", async (req, res) => {
  try {
    const { query, contentType, limit } = req.query as Record<string, string>;
    if (!query) {
      res.status(400).json({ error: "query parameter is required" });
      return;
    }

    const data = await proxyToDataApi("/api/search", {
      q: query,
      type: contentType ?? "all",
      limit: limit ?? "10",
    });

    res.json(data);
  } catch (err) {
    console.error("[search]", err);
    res.status(502).json({ error: "Failed to search content" });
  }
});

/* ── Researchers ──────────────────────────────────────────── */

app.get("/api/researchers/:name", async (req, res) => {
  try {
    const data = await proxyToDataApi(`/api/researchers/${encodeURIComponent(req.params.name)}`);
    res.json(data);
  } catch (err) {
    console.error("[researcher]", err);
    res.status(404).json({ error: "Researcher not found" });
  }
});

/* ── Publications ─────────────────────────────────────────── */

app.get("/api/publications", async (req, res) => {
  try {
    const { topic, author, year, limit } = req.query as Record<string, string>;
    const data = await proxyToDataApi("/api/publications", {
      topic: topic ?? "",
      author: author ?? "",
      year: year ?? "",
      limit: limit ?? "10",
    });
    res.json(data);
  } catch (err) {
    console.error("[publications]", err);
    res.status(502).json({ error: "Failed to fetch publications" });
  }
});

/* ── Research Areas ───────────────────────────────────────── */

app.get("/api/research-areas", async (_req, res) => {
  try {
    const data = await proxyToDataApi("/api/research-areas");
    res.json(data);
  } catch (err) {
    console.error("[research-areas]", err);
    res.status(502).json({ error: "Failed to fetch research areas" });
  }
});

/* ── Health ───────────────────────────────────────────────── */

app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    app: "copilot-knowledge-connector",
    timestamp: new Date().toISOString(),
    dataApi: DATA_API_URL,
  });
});

/* ── Start ────────────────────────────────────────────────── */

app.listen(port, () => {
  console.log(`[Copilot Knowledge Connector] Listening on port ${port}`);
  console.log(`  Data API: ${DATA_API_URL}`);
  console.log(`  Endpoints:`);
  console.log(`    GET /api/search?query=...`);
  console.log(`    GET /api/researchers/:name`);
  console.log(`    GET /api/publications`);
  console.log(`    GET /api/research-areas`);
  console.log(`    GET /api/health`);
});
