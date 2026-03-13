/**
 * Copilot Extension Request Handler
 *
 * Processes the Copilot Chat messages, calls the MSR data API for context,
 * and streams back a response using the Copilot Extensions SSE protocol.
 *
 * Slash Commands:
 *   /paper <query>      — Find and summarize a specific paper
 *   /researcher <name>  — Researcher card with publications
 *   /lab <name>         — Lab overview with projects
 *   /cite <paper>       — Generate BibTeX/APA citation
 *   /explain <paper>    — Plain-English methodology explanation
 *   /related            — Papers related to current context
 *   /trends <area>      — What's new in a research area
 *   /compare <p1> vs <p2> — Compare two papers' approaches
 *   /rag <query>        — Grounded search from RAG knowledge base
 *   /help               — Show available commands
 *
 * SSE Protocol:
 *   event: copilot_message
 *   data: {"role": "assistant", "content": "..."}
 *
 *   event: copilot_references
 *   data: [{"type": "url", "id": "...", "data": {"url": "...", "title": "..."}}]
 *
 *   event: done
 *   data: [DONE]
 */
import type { Request, Response } from "express";

const DATA_API_URL = process.env.DATA_API_URL ?? "http://localhost:7071";

interface CopilotMessage {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
  copilot_references?: CopilotReference[];
}

interface CopilotReference {
  type: string;
  id: string;
  data: { url?: string; title?: string; description?: string };
}

interface CopilotRequest {
  messages: CopilotMessage[];
  copilot_thread_id?: string;
}

interface SearchResult {
  title?: string;
  snippet?: string;
  url?: string;
  type?: string;
  authors?: string;
  year?: number;
  doi?: string;
}

interface SlashCommand {
  name: string;
  args: string;
}

export async function handleCopilotRequest(req: Request, res: Response): Promise<void> {
  const body = req.body as CopilotRequest;
  const messages = body.messages ?? [];
  const userMessage = messages.filter((m) => m.role === "user").pop()?.content ?? "";

  if (!userMessage) {
    res.status(400).json({ error: "No user message found" });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const command = parseSlashCommand(userMessage);

    if (command) {
      await handleSlashCommand(command, messages, res);
    } else {
      await handleGeneralQuery(userMessage, res);
    }
  } catch (err) {
    console.error("[Handler] Error:", err);
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: "I encountered an error while searching Microsoft Research. Please try again.",
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
  }
}

// ── Slash command parsing ────────────────────────────

function parseSlashCommand(message: string): SlashCommand | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith("/")) return null;

  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) {
    return { name: trimmed.slice(1).toLowerCase(), args: "" };
  }

  return {
    name: trimmed.slice(1, spaceIndex).toLowerCase(),
    args: trimmed.slice(spaceIndex + 1).trim(),
  };
}

// ── Slash command router ─────────────────────────────

async function handleSlashCommand(
  command: SlashCommand,
  messages: CopilotMessage[],
  res: Response,
): Promise<void> {
  switch (command.name) {
    case "paper":
      await handlePaperCommand(command.args, res);
      break;
    case "researcher":
      await handleResearcherCommand(command.args, res);
      break;
    case "lab":
      await handleLabCommand(command.args, res);
      break;
    case "cite":
      await handleCiteCommand(command.args, res);
      break;
    case "explain":
      await handleExplainCommand(command.args, res);
      break;
    case "related":
      await handleRelatedCommand(command.args, messages, res);
      break;
    case "trends":
      await handleTrendsCommand(command.args, res);
      break;
    case "compare":
      await handleCompareCommand(command.args, res);
      break;
    case "rag":
      await handleRagCommand(command.args, res);
      break;
    case "help":
      await handleHelpCommand(res);
      break;
    default:
      sendSSEEvent(res, "copilot_message", {
        role: "assistant",
        content: `Unknown command \`/${command.name}\`. Type \`/help\` to see available commands.`,
      });
      sendSSEEvent(res, "done", "[DONE]");
      res.end();
  }
}

// ── /paper ───────────────────────────────────────────

async function handlePaperCommand(query: string, res: Response): Promise<void> {
  if (!query) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: "Please provide a paper title or topic. Example: `/paper attention is all you need`",
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  const results = await searchMSR(query, "publications", 3);
  const refs: CopilotReference[] = [];

  let text: string;
  if (results.length === 0) {
    text = `No papers found matching "${query}". Try broader keywords or check the spelling.`;
  } else {
    text = `## 📄 Papers matching "${query}"\n\n`;
    for (const r of results) {
      text += `### ${r.title ?? "Untitled"}\n`;
      if (r.authors) text += `**Authors:** ${r.authors}\n`;
      if (r.year) text += `**Year:** ${r.year}\n`;
      if (r.snippet) text += `\n${r.snippet}\n`;
      if (r.url) text += `\n[Read full paper](${r.url})\n`;
      text += "\n---\n\n";
      if (r.url) {
        refs.push({
          type: "url", id: `paper-${refs.length}`,
          data: { url: r.url, title: r.title ?? "Paper", description: r.snippet ?? "" },
        });
      }
    }
    text += `*Use \`/cite ${results[0].title}\` to generate a citation.*`;
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  if (refs.length > 0) sendSSEEvent(res, "copilot_references", refs);
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /researcher ──────────────────────────────────────

async function handleResearcherCommand(name: string, res: Response): Promise<void> {
  if (!name) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: "Please provide a researcher name. Example: `/researcher John Smith`",
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  const [researchers, publications] = await Promise.all([
    searchMSR(name, "researchers", 1),
    searchMSR(`${name} publications`, "publications", 5),
  ]);

  const refs: CopilotReference[] = [];
  let text: string;

  if (researchers.length === 0) {
    text = `No researcher found matching "${name}". Try a full name or different spelling.`;
  } else {
    const r = researchers[0];
    text = `## 👤 ${r.title ?? name}\n\n`;
    if (r.snippet) text += `${r.snippet}\n\n`;
    if (r.url) {
      text += `[MSR Profile](${r.url})\n\n`;
      refs.push({
        type: "url", id: "researcher-profile",
        data: { url: r.url, title: r.title ?? name, description: r.snippet ?? "" },
      });
    }

    if (publications.length > 0) {
      text += `### Recent Publications\n\n`;
      for (const pub of publications) {
        text += `- **${pub.title ?? "Untitled"}**`;
        if (pub.year) text += ` (${pub.year})`;
        text += "\n";
        if (pub.url) {
          refs.push({
            type: "url", id: `pub-${refs.length}`,
            data: { url: pub.url, title: pub.title ?? "Publication" },
          });
        }
      }
    }
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  if (refs.length > 0) sendSSEEvent(res, "copilot_references", refs);
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /lab ─────────────────────────────────────────────

async function handleLabCommand(name: string, res: Response): Promise<void> {
  if (!name) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: "Please specify a lab. Example: `/lab Redmond` or `/lab Cambridge`",
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  const results = await searchMSR(`microsoft research ${name} lab`, "all", 8);
  const refs: CopilotReference[] = [];

  let text = `## 🏢 MSR Lab: ${name}\n\n`;

  if (results.length === 0) {
    text += `No information found for lab "${name}". Known labs include: Redmond, Cambridge, Asia, India, Montreal, New England, NYC.`;
  } else {
    for (const r of results) {
      text += `### ${r.title ?? "Untitled"}\n`;
      if (r.snippet) text += `${r.snippet}\n`;
      if (r.url) {
        text += `[Learn more](${r.url})\n`;
        refs.push({
          type: "url", id: `lab-${refs.length}`,
          data: { url: r.url, title: r.title ?? name },
        });
      }
      text += "\n";
    }
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  if (refs.length > 0) sendSSEEvent(res, "copilot_references", refs);
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /cite ────────────────────────────────────────────

async function handleCiteCommand(query: string, res: Response): Promise<void> {
  if (!query) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: "Please provide a paper title. Example: `/cite attention is all you need`",
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  const results = await searchMSR(query, "publications", 1);

  if (results.length === 0) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: `No publication found matching "${query}". Try the exact paper title.`,
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  const r = results[0];
  const firstAuthor = r.authors?.split(",")[0]?.trim().split(" ").pop()?.toLowerCase() ?? "unknown";
  const year = r.year ?? new Date().getFullYear();
  const key = `${firstAuthor}${year}`;

  let text = `## 📋 Citation: ${r.title ?? query}\n\n`;

  // BibTeX
  text += "### BibTeX\n```bibtex\n";
  text += `@article{${key},\n`;
  text += `  title     = {${r.title ?? "Untitled"}},\n`;
  if (r.authors) text += `  author    = {${r.authors}},\n`;
  text += `  year      = {${year}},\n`;
  if (r.doi) text += `  doi       = {${r.doi}},\n`;
  if (r.url) text += `  url       = {${r.url}},\n`;
  text += `  publisher = {Microsoft Research}\n`;
  text += `}\n\`\`\`\n\n`;

  // APA
  const authorStr = r.authors ?? "Microsoft Research";
  text += "### APA\n";
  text += `> ${authorStr} (${year}). ${r.title ?? "Untitled"}. Microsoft Research.`;
  if (r.url) text += ` ${r.url}`;
  text += "\n\n";

  // MLA
  text += "### MLA\n";
  text += `> ${authorStr}. "${r.title ?? "Untitled"}." Microsoft Research, ${year}.`;
  if (r.url) text += ` ${r.url}`;
  text += "\n";

  const refs: CopilotReference[] = [];
  if (r.url) {
    refs.push({
      type: "url", id: "cited-paper",
      data: { url: r.url, title: r.title ?? "Paper" },
    });
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  if (refs.length > 0) sendSSEEvent(res, "copilot_references", refs);
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /explain ─────────────────────────────────────────

async function handleExplainCommand(query: string, res: Response): Promise<void> {
  if (!query) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: "Please provide a paper title or topic. Example: `/explain RLHF for language models`",
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  const [papers, ragResults] = await Promise.all([
    searchMSR(query, "publications", 1),
    searchRAG(`explain methodology ${query}`),
  ]);

  const paper = papers[0];
  const refs: CopilotReference[] = [];

  let text = `## 🔍 Explanation: ${paper?.title ?? query}\n\n`;

  if (paper) {
    if (paper.authors) text += `**Authors:** ${paper.authors}\n`;
    if (paper.year) text += `**Year:** ${paper.year}\n\n`;

    if (ragResults.length > 0) {
      text += "### Key Concepts\n\n";
      for (const r of ragResults) {
        if (r.text) text += `${r.text}\n\n`;
      }
    } else if (paper.snippet) {
      text += `### Summary\n\n${paper.snippet}\n\n`;
    }

    text += "### In Plain English\n\n";
    text += `This research from Microsoft Research explores ${query}. `;
    if (paper.snippet) {
      text += `The key insight is: ${paper.snippet}`;
    }
    text += "\n\n";

    if (paper.url) {
      text += `[Read the full paper](${paper.url})\n`;
      refs.push({
        type: "url", id: "explained-paper",
        data: { url: paper.url, title: paper.title ?? query },
      });
    }
  } else {
    text += `No specific paper found for "${query}". Try using the exact paper title, or use \`/paper ${query}\` to search first.\n`;
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  if (refs.length > 0) sendSSEEvent(res, "copilot_references", refs);
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /related ─────────────────────────────────────────

async function handleRelatedCommand(
  query: string,
  messages: CopilotMessage[],
  res: Response,
): Promise<void> {
  // Use explicit query or extract context from conversation history
  let searchQuery = query;
  if (!searchQuery) {
    // Build context from recent conversation
    const recentMessages = messages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.content)
      .join(" ");
    searchQuery = recentMessages || "recent microsoft research publications";
  }

  const results = await searchMSR(searchQuery, "publications", 8);
  const refs: CopilotReference[] = [];

  let text = `## 🔗 Related Papers\n\n`;

  if (results.length === 0) {
    text += "No related papers found. Try providing a more specific topic.";
  } else {
    text += `Based on: *"${searchQuery.slice(0, 100)}${searchQuery.length > 100 ? "..." : ""}"*\n\n`;
    for (const r of results) {
      text += `- **${r.title ?? "Untitled"}**`;
      if (r.authors) text += ` — ${r.authors}`;
      if (r.year) text += ` (${r.year})`;
      text += "\n";
      if (r.snippet) text += `  ${r.snippet}\n`;
      if (r.url) {
        refs.push({
          type: "url", id: `related-${refs.length}`,
          data: { url: r.url, title: r.title ?? "Paper" },
        });
      }
    }
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  if (refs.length > 0) sendSSEEvent(res, "copilot_references", refs);
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /trends ──────────────────────────────────────────

async function handleTrendsCommand(area: string, res: Response): Promise<void> {
  const query = area
    ? `trending recent ${area} research publications`
    : "trending recent research publications highlights";

  const results = await searchMSR(query, "publications", 10);
  const refs: CopilotReference[] = [];

  let text = `## 📈 Trending Research${area ? `: ${area}` : ""}\n\n`;

  if (results.length === 0) {
    text += `No trending papers found${area ? ` for "${area}"` : ""}. Try a broader research area.`;
  } else {
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      text += `${i + 1}. **${r.title ?? "Untitled"}**`;
      if (r.authors) text += `\n   *${r.authors}*`;
      if (r.snippet) text += `\n   ${r.snippet}`;
      text += "\n\n";
      if (r.url) {
        refs.push({
          type: "url", id: `trend-${i}`,
          data: { url: r.url, title: r.title ?? "Paper" },
        });
      }
    }
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  if (refs.length > 0) sendSSEEvent(res, "copilot_references", refs);
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /compare ─────────────────────────────────────────

async function handleCompareCommand(query: string, res: Response): Promise<void> {
  if (!query) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: 'Please provide two papers to compare. Example: `/compare GPT-4 vs PaLM 2`',
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  // Split on " vs " or " versus " or " and "
  const parts = query.split(/\s+(?:vs\.?|versus|and)\s+/i);
  const paper1Query = parts[0]?.trim();
  const paper2Query = parts[1]?.trim();

  if (!paper1Query || !paper2Query) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: 'Please separate the two papers with "vs". Example: `/compare transformers vs RNNs`',
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  const [results1, results2] = await Promise.all([
    searchMSR(paper1Query, "publications", 1),
    searchMSR(paper2Query, "publications", 1),
  ]);

  const p1 = results1[0];
  const p2 = results2[0];
  const refs: CopilotReference[] = [];

  let text = `## ⚖️ Comparison\n\n`;

  if (!p1 && !p2) {
    text += `Could not find papers matching either "${paper1Query}" or "${paper2Query}".`;
  } else {
    text += `| | ${p1?.title ?? paper1Query} | ${p2?.title ?? paper2Query} |\n`;
    text += `|---|---|---|\n`;
    text += `| **Authors** | ${p1?.authors ?? "Unknown"} | ${p2?.authors ?? "Unknown"} |\n`;
    text += `| **Year** | ${p1?.year ?? "—"} | ${p2?.year ?? "—"} |\n`;
    text += `| **Type** | ${p1?.type ?? "—"} | ${p2?.type ?? "—"} |\n\n`;

    if (p1?.snippet) {
      text += `### ${p1.title ?? paper1Query}\n${p1.snippet}\n\n`;
    }
    if (p2?.snippet) {
      text += `### ${p2.title ?? paper2Query}\n${p2.snippet}\n\n`;
    }

    for (const p of [p1, p2]) {
      if (p?.url) {
        refs.push({
          type: "url", id: `compare-${refs.length}`,
          data: { url: p.url, title: p.title ?? "Paper" },
        });
      }
    }

    text += "*Note: For a deeper comparison, use `/explain` on each paper individually.*\n";
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  if (refs.length > 0) sendSSEEvent(res, "copilot_references", refs);
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /rag ─────────────────────────────────────────────

async function handleRagCommand(query: string, res: Response): Promise<void> {
  if (!query) {
    sendSSEEvent(res, "copilot_message", {
      role: "assistant",
      content: "Please provide a search query. Example: `/rag how does RLHF work`",
    });
    sendSSEEvent(res, "done", "[DONE]");
    res.end();
    return;
  }

  const results = await searchRAG(query);

  let text = `## 🧠 Grounded Answer: "${query}"\n\n`;

  if (results.length === 0) {
    text += "No grounded results found in the RAG knowledge base. Try `/paper` or a general search instead.";
  } else {
    for (const r of results) {
      if (r.text) text += `${r.text}\n\n`;
      if (r.source) text += `*Source: ${r.source}*\n\n`;
      text += "---\n\n";
    }
    text += "*Results are grounded in the MSR RAG knowledge base with citation backing.*";
  }

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── /help ────────────────────────────────────────────

async function handleHelpCommand(res: Response): Promise<void> {
  const text = `## 🤖 MSR Research Assistant — Commands

| Command | Description |
|---------|-------------|
| \`/paper <query>\` | Find and summarize a specific paper |
| \`/researcher <name>\` | Researcher profile with publications |
| \`/lab <name>\` | Lab overview (Redmond, Cambridge, Asia...) |
| \`/cite <paper>\` | Generate BibTeX, APA, and MLA citations |
| \`/explain <paper>\` | Plain-English explanation of a paper |
| \`/related [topic]\` | Find related papers (uses conversation context if no topic) |
| \`/trends [area]\` | Trending/recent papers, optionally by area |
| \`/compare <a> vs <b>\` | Compare two papers or approaches |
| \`/rag <query>\` | Grounded search from RAG knowledge base |
| \`/help\` | Show this help |

You can also ask questions in natural language without a slash command!

**Examples:**
- \`/paper attention is all you need\`
- \`/researcher Sébastien Bubeck\`
- \`/cite GPT-4 technical report\`
- \`/trends quantum computing\`
- \`/compare transformers vs RNNs\`
- \`What are the latest advances in AI safety?\`
`;

  sendSSEEvent(res, "copilot_message", { role: "assistant", content: text });
  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── General query (no slash command) ─────────────────

async function handleGeneralQuery(userMessage: string, res: Response): Promise<void> {
  const searchResults = await searchMSR(userMessage, "all", 5);
  const responseText = buildResponse(userMessage, searchResults);

  sendSSEEvent(res, "copilot_message", {
    role: "assistant",
    content: responseText,
  });

  if (searchResults.length > 0) {
    const references: CopilotReference[] = searchResults.slice(0, 5).map((result, i) => ({
      type: "url",
      id: `msr-ref-${i}`,
      data: {
        url: result.url ?? `https://www.microsoft.com/research`,
        title: result.title ?? "Microsoft Research",
        description: result.snippet ?? "",
      },
    }));
    sendSSEEvent(res, "copilot_references", references);
  }

  sendSSEEvent(res, "done", "[DONE]");
  res.end();
}

// ── Shared helpers ───────────────────────────────────

function sendSSEEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function searchMSR(
  query: string,
  type: string = "all",
  limit: number = 5,
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${DATA_API_URL}/tools/quick_search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, type, limit }),
    });

    if (!response.ok) return [];

    const data = await response.json() as { results?: SearchResult[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

interface RAGResult {
  text?: string;
  source?: string;
  score?: number;
}

async function searchRAG(query: string): Promise<RAGResult[]> {
  try {
    const response = await fetch(`${DATA_API_URL}/mcp/rag-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, maxResults: 5 }),
    });

    if (!response.ok) return [];

    const data = await response.json() as { results?: RAGResult[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

function buildResponse(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return `I searched Microsoft Research for "${query}" but didn't find specific results. ` +
      `Try asking about specific topics like machine learning, NLP, quantum computing, ` +
      `or ask me to find a researcher by name.\n\n` +
      `You can also browse [Microsoft Research](https://www.microsoft.com/research) directly.\n\n` +
      `💡 *Tip: Use \`/help\` to see available slash commands for more targeted searches.*`;
  }

  let response = `Here's what I found from Microsoft Research about "${query}":\n\n`;

  for (const result of results) {
    if (result.title) {
      response += `### ${result.title}\n`;
    }
    if (result.snippet) {
      response += `${result.snippet}\n`;
    }
    if (result.url) {
      response += `[Read more](${result.url})\n`;
    }
    response += "\n";
  }

  response += `\n---\n*Results from Microsoft Research. Try \`/help\` for slash commands like \`/cite\`, \`/explain\`, and more.*`;
  return response;
}
