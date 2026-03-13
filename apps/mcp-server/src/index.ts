/**
 * Automoto MCP Server — Model Context Protocol server for Automoto.
 *
 * Exposes Automoto tools (search, researchers, publications, RAG) and resources
 * via the MCP protocol so any MCP-compatible client can access them:
 *   - Claude Desktop
 *   - VS Code Copilot (MCP support)
 *   - Cursor
 *   - Custom MCP clients
 *
 * Supports both stdio (default, for desktop clients) and SSE transports.
 *
 * Usage:
 *   DATA_API_URL=http://localhost:7071 npx tsx src/index.ts
 *
 * Claude Desktop config (~/.claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "msr": {
 *         "command": "node",
 *         "args": ["path/to/mcp-server/dist/index.js"],
 *         "env": { "DATA_API_URL": "http://localhost:7071" }
 *       }
 *     }
 *   }
 */
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import http from "node:http";

const DATA_API_URL = process.env.DATA_API_URL ?? "http://localhost:7071";

/* ── Data API Helper ──────────────────────────────────────── */

async function callDataApi(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string> } = {},
): Promise<unknown> {
  const url = new URL(path, DATA_API_URL);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Data API error ${res.status}: ${text}`);
  }

  return res.json();
}

/* ── MCP Server Setup ─────────────────────────────────────── */

const server = new McpServer({
  name: "automoto",
  version: "0.1.0",
});

/* ── Tools ────────────────────────────────────────────────── */

server.tool(
  "search_research",
  "Search across all Automoto content — publications, people, projects, and news. Returns the most relevant results for a query.",
  {
    query: z.string().describe("Search query (e.g., 'machine learning fairness')"),
    contentType: z.enum(["publication", "researcher", "project", "all"]).optional().describe("Filter by content type"),
    limit: z.number().optional().describe("Max results to return (default: 10)"),
  },
  async ({ query, contentType, limit }) => {
    const data = await callDataApi("/tools/quick_search", {
      method: "POST",
      body: { query, type: contentType ?? "all", limit: limit ?? 10 },
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "find_researchers",
  "Find people in Automoto by name, topic, lab, or focus area.",
  {
    query: z.string().describe("Researcher name, topic, or research area"),
    lab: z.string().optional().describe("Filter by lab (e.g., 'Automoto Redmond')"),
    limit: z.number().optional().describe("Max results (default: 10)"),
  },
  async ({ query, lab, limit }) => {
    const data = await callDataApi("/tools/quick_search", {
      method: "POST",
      body: { query, type: "researcher", lab, limit: limit ?? 10 },
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "browse_publications",
  "Search and browse Automoto publications by topic, author, or date.",
  {
    topic: z.string().optional().describe("Research topic or keyword"),
    author: z.string().optional().describe("Author name"),
    year: z.number().optional().describe("Publication year"),
    limit: z.number().optional().describe("Max results (default: 10)"),
  },
  async ({ topic, author, year, limit }) => {
    const query = [topic, author, year?.toString()].filter(Boolean).join(" ");
    const data = await callDataApi("/tools/quick_search", {
      method: "POST",
      body: { query: query || "recent publications", type: "publication", limit: limit ?? 10 },
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "get_research_areas",
  "List all focus areas and labs at Automoto.",
  {},
  async () => {
    const data = await callDataApi("/tools/quick_search", {
      method: "POST",
      body: { query: "research areas", type: "all", limit: 50 },
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "get_latest_news",
  "Fetch recent news, highlights, and blog posts from Automoto.",
  {
    limit: z.number().optional().describe("Max results (default: 10)"),
  },
  async ({ limit }) => {
    const data = await callDataApi("/tools/quick_search", {
      method: "POST",
      body: { query: "latest news highlights", type: "all", limit: limit ?? 10 },
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "search_rag_collection",
  "Semantic search within the Automoto RAG knowledge base. Use for grounded, citation-backed answers.",
  {
    query: z.string().describe("Semantic search query"),
    collectionId: z.string().optional().describe("Specific RAG collection to search"),
    maxResults: z.number().optional().describe("Max results (default: 5)"),
  },
  async ({ query, collectionId, maxResults }) => {
    const data = await callDataApi("/mcp/rag-search", {
      method: "POST",
      body: { query, collectionId, maxResults: maxResults ?? 5 },
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  "list_rag_collections",
  "List all available RAG knowledge collections and their source counts.",
  {},
  async () => {
    const data = await callDataApi("/mcp/rag-collections");
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
);

/* ── Resources ────────────────────────────────────────────── */

server.resource(
  "rag-collections",
  "automoto://rag/collections",
  { description: "List of all RAG knowledge collections available for grounding" },
  async (uri) => {
    const data = await callDataApi("/mcp/rag-collections");
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      }],
    };
  },
);

server.resource(
  "rag-sources",
  "automoto://rag/sources",
  { description: "List of all RAG data sources (documents, APIs, etc.)" },
  async (uri) => {
    const data = await callDataApi("/mcp/rag-sources");
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      }],
    };
  },
);

server.resource(
  "research-area",
  new ResourceTemplate("automoto://research-areas/{areaId}", { list: undefined }),
  { description: "Details about a specific research area" },
  async (uri: URL, variables) => {
    const areaId = String(variables.areaId);
    const data = await callDataApi("/tools/quick_search", {
      method: "POST",
      body: { query: areaId, type: "all", limit: 5 },
    });
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      }],
    };
  },
);

/* ── Prompts ──────────────────────────────────────────────── */

server.prompt(
  "research-overview",
  "Get a comprehensive overview of an Automoto topic",
  { topic: z.string().describe("Research topic to explore") },
  ({ topic }) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Give me a comprehensive overview of Automoto's work on "${topic}". Include:\n1. Key people and their contributions\n2. Important publications\n3. Active projects\n4. Related focus areas\n\nUse the search_research and browse_publications tools to find current information.`,
      },
    }],
  }),
);

server.prompt(
  "find-expert",
  "Find the right Automoto expert for a topic",
  { topic: z.string().describe("Topic or question to find an expert for") },
  ({ topic }) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Help me find the best Automoto expert(s) for "${topic}". Use the find_researchers tool to search, then summarize each person's relevance, their lab, and their recent work.`,
      },
    }],
  }),
);

/* ── Start Server ─────────────────────────────────────────── */

async function main() {
  const transport = process.env.MCP_TRANSPORT ?? "stdio";

  if (transport === "sse") {
    const port = parseInt(process.env.MCP_PORT ?? "3100", 10);

    // Track active transports for cleanup
    const transports = new Map<string, SSEServerTransport>();

    const httpServer = http.createServer(async (req, res) => {
      if (req.url === "/sse" && req.method === "GET") {
        const sseTransport = new SSEServerTransport("/messages", res);
        const sessionId = sseTransport.sessionId;
        transports.set(sessionId, sseTransport);
        res.on("close", () => transports.delete(sessionId));
        await server.connect(sseTransport);
      } else if (req.url?.startsWith("/messages") && req.method === "POST") {
        const sessionId = new URL(req.url, `http://localhost:${port}`).searchParams.get("sessionId");
        const sseTransport = sessionId ? transports.get(sessionId) : undefined;
        if (sseTransport) {
          await sseTransport.handlePostMessage(req, res);
        } else {
          res.writeHead(404).end("Session not found");
        }
      } else if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "healthy", app: "mcp-server", transport: "sse" }));
      } else {
        res.writeHead(404).end("Not found");
      }
    });

    httpServer.listen(port, () => {
      console.error(`[MCP Server] SSE transport listening on port ${port}`);
      console.error(`  Data API: ${DATA_API_URL}`);
      console.error(`  SSE endpoint: http://localhost:${port}/sse`);
    });
  } else {
    // Default: stdio transport (for Claude Desktop, etc.)
    const stdioTransport = new StdioServerTransport();
    console.error(`[MCP Server] Starting with stdio transport`);
    console.error(`  Data API: ${DATA_API_URL}`);
    await server.connect(stdioTransport);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
