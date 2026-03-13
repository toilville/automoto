/**
 * Unit tests for the gh automoto CLI commands.
 * Mocks global fetch to avoid needing a running API server.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as commands from "./commands.js";

// ── Fetch mock setup ─────────────────────────────────

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mockFetchMultiple(responses: Array<{ data: unknown; ok?: boolean }>) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      ok: resp.ok ?? true,
      status: resp.ok === false ? 500 : 200,
      statusText: resp.ok === false ? "Error" : "OK",
      json: () => Promise.resolve(resp.data),
      text: () => Promise.resolve(JSON.stringify(resp.data)),
    });
  });
}

let consoleOutput: string[];
let consoleErrorOutput: string[];
const originalFetch = globalThis.fetch;

beforeEach(() => {
  consoleOutput = [];
  consoleErrorOutput = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(" "));
  });
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    consoleErrorOutput.push(args.map(String).join(" "));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

function output(): string {
  return consoleOutput.join("\n");
}

// ── search ───────────────────────────────────────────

describe("search", () => {
  it("displays results with titles and URLs", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Attention Is All You Need", type: "publication", snippet: "Transformer model", url: "https://example.com/1", authors: "Vaswani et al." },
        { title: "BERT", type: "publication", snippet: "Bidirectional encoders", url: "https://example.com/2" },
      ],
    });

    await commands.search("transformers", { json: false, limit: 5, type: "all" });
    const out = output();
    expect(out).toContain("Attention Is All You Need");
    expect(out).toContain("BERT");
    expect(out).toContain("Vaswani et al.");
    expect(out).toContain("2 result(s)");
  });

  it("outputs JSON when --json flag is set", async () => {
    const data = { results: [{ title: "Test Paper" }] };
    globalThis.fetch = mockFetchResponse(data);

    await commands.search("test", { json: true, limit: 5, type: "all" });
    const out = output();
    const parsed = JSON.parse(out);
    expect(parsed.results[0].title).toBe("Test Paper");
  });

  it("shows message when no results found", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.search("nonexistent", { json: false, limit: 5, type: "all" });
    expect(output()).toContain("No results found");
  });
});

// ── getResearcher ────────────────────────────────────

describe("getResearcher", () => {
  it("displays researcher info", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "John Smith", snippet: "AI researcher at Automoto Redmond", url: "https://automoto.example.com/jsmith" }],
    });

    await commands.getResearcher("John Smith", { json: false });
    const out = output();
    expect(out).toContain("John Smith");
    expect(out).toContain("AI researcher at Automoto Redmond");
  });

  it("handles not found", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.getResearcher("Nobody", { json: false });
    expect(output()).toContain("No researcher found");
  });
});

// ── getPublications ──────────────────────────────────

describe("getPublications", () => {
  it("lists publications with authors", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Paper A", authors: "Smith, J.", snippet: "About AI" },
        { title: "Paper B", authors: "Doe, J." },
      ],
    });

    await commands.getPublications("AI", { json: false, limit: 5 });
    const out = output();
    expect(out).toContain("Paper A");
    expect(out).toContain("Paper B");
    expect(out).toContain("Smith, J.");
  });

  it("uses default query when none provided", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.getPublications(undefined, { json: false, limit: 5 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/tools/quick_search"),
      expect.objectContaining({
        body: expect.stringContaining("recent research"),
      }),
    );
  });
});

// ── getResearchAreas ─────────────────────────────────

describe("getResearchAreas", () => {
  it("lists research areas", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Machine Learning", snippet: "Core ML research" },
        { title: "Quantum Computing", snippet: "Quantum algorithms" },
      ],
    });

    await commands.getResearchAreas({ json: false });
    const out = output();
    expect(out).toContain("Machine Learning");
    expect(out).toContain("Quantum Computing");
    expect(out).toContain("Research Areas");
  });
});

// ── chat ─────────────────────────────────────────────

describe("chat", () => {
  it("formats conversational response with results", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "Relevant Paper", snippet: "About the topic", url: "https://example.com/paper" }],
    });

    await commands.chat("tell me about AI", { json: false });
    const out = output();
    expect(out).toContain("Research Assistant");
    expect(out).toContain("Relevant Paper");
    expect(out).toContain("About the topic");
  });

  it("shows fallback when no results", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.chat("obscure topic", { json: false });
    const out = output();
    expect(out).toContain("couldn't find");
  });
});

// ── getLabs ──────────────────────────────────────────

describe("getLabs", () => {
  it("shows labs from results", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Automoto Redmond", snippet: "Main campus research lab" },
        { title: "Automoto Cambridge", snippet: "UK research lab" },
      ],
    });

    await commands.getLabs({ json: false });
    const out = output();
    expect(out).toContain("Automoto Redmond");
    expect(out).toContain("Automoto Cambridge");
    expect(out).toContain("Labs Worldwide");
  });

  it("shows labs from structured lab data", async () => {
    globalThis.fetch = mockFetchResponse({
      labs: [
        { id: "redmond", name: "Automoto Redmond", location: "Redmond, WA", researcherCount: 200, focusAreas: ["AI", "Systems"] },
      ],
      results: [],
    });

    await commands.getLabs({ json: false });
    const out = output();
    expect(out).toContain("Automoto Redmond");
    expect(out).toContain("Redmond, WA");
    expect(out).toContain("200 researchers");
  });
});

// ── getLabDetail ─────────────────────────────────────

describe("getLabDetail", () => {
  it("shows detailed lab info", async () => {
    globalThis.fetch = mockFetchResponse({
      lab: { id: "asia", name: "Automoto Asia", location: "Beijing, China", description: "Largest Automoto lab outside the US", focusAreas: ["Vision", "NLP"], researcherCount: 300 },
      results: [{ title: "Project X", type: "project", snippet: "A cool project" }],
    });

    await commands.getLabDetail("asia", { json: false });
    const out = output();
    expect(out).toContain("Automoto Asia");
    expect(out).toContain("Beijing, China");
    expect(out).toContain("Project X");
    expect(out).toContain("300");
  });

  it("falls back to search results when no lab data", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "Some result about redmond" }],
    });

    await commands.getLabDetail("redmond", { json: false });
    const out = output();
    expect(out).toContain("redmond");
    expect(out).toContain("Some result about redmond");
  });
});

// ── getProject ───────────────────────────────────────

describe("getProject", () => {
  it("shows project details", async () => {
    globalThis.fetch = mockFetchResponse({
      project: { title: "DeepSpeed", description: "Deep learning optimization", status: "Active", lab: "Automoto Redmond", team: ["Alice", "Bob"] },
      results: [],
    });

    await commands.getProject("DeepSpeed", { json: false });
    const out = output();
    expect(out).toContain("DeepSpeed");
    expect(out).toContain("Active");
    expect(out).toContain("Alice, Bob");
  });

  it("shows search results when no structured project data", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "Project Turing", snippet: "NLP project", url: "https://automoto.example.com/turing" }],
    });

    await commands.getProject("Turing", { json: false });
    const out = output();
    expect(out).toContain("Project Turing");
  });

  it("shows not found message when empty", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.getProject("nonexistent", { json: false });
    expect(output()).toContain("No project found");
  });
});

// ── cite ─────────────────────────────────────────────

describe("cite", () => {
  it("generates BibTeX citation", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "Attention Is All You Need", authors: "Vaswani, A., Shazeer, N.", year: 2017, url: "https://arxiv.org/1706" }],
    });

    await commands.cite("attention", { json: false, format: "bibtex" });
    const out = output();
    expect(out).toContain("@article{");
    expect(out).toContain("Attention Is All You Need");
    expect(out).toContain("2017");
    expect(out).toContain("Vaswani, A., Shazeer, N.");
  });

  it("generates APA citation", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "Test Paper", authors: "Smith, J.", year: 2023 }],
    });

    await commands.cite("test", { json: false, format: "apa" });
    const out = output();
    expect(out).toContain("Smith, J. (2023)");
    expect(out).toContain("Test Paper");
  });

  it("generates MLA citation", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "Test Paper", authors: "Smith, J.", year: 2023 }],
    });

    await commands.cite("test", { json: false, format: "mla" });
    const out = output();
    expect(out).toContain('"Test Paper."');
    expect(out).toContain("2023");
  });

  it("handles no paper found", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.cite("nonexistent", { json: false });
    expect(output()).toContain("No publication found");
  });
});

// ── trending ─────────────────────────────────────────

describe("trending", () => {
  it("shows numbered trending papers", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Hot Paper 1", authors: "A. Author", snippet: "Groundbreaking" },
        { title: "Hot Paper 2", authors: "B. Author" },
      ],
    });

    await commands.trending(undefined, { json: false, limit: 10 });
    const out = output();
    expect(out).toContain("Trending Research");
    expect(out).toContain("Hot Paper 1");
    expect(out).toContain("Hot Paper 2");
  });

  it("filters by area", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.trending("quantum computing", { json: false, limit: 10 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("quantum computing"),
      }),
    );
    expect(output()).toContain("quantum computing");
  });
});

// ── collab ───────────────────────────────────────────

describe("collab", () => {
  it("shows co-author collaboration graph", async () => {
    globalThis.fetch = mockFetchMultiple([
      { data: { results: [{ title: "Jane Doe", snippet: "Researcher" }] } },
      { data: { results: [
        { title: "Paper 1", authors: "Jane Doe, Alice, Bob" },
        { title: "Paper 2", authors: "Jane Doe, Alice, Charlie" },
      ] } },
    ]);

    await commands.collab("Jane Doe", { json: false, limit: 10 });
    const out = output();
    expect(out).toContain("Collaboration Graph");
    expect(out).toContain("Jane Doe");
    expect(out).toContain("Alice");
  });

  it("outputs JSON with researcher and collaborations", async () => {
    globalThis.fetch = mockFetchMultiple([
      { data: { results: [{ title: "Jane" }] } },
      { data: { results: [{ title: "Paper 1", authors: "Jane, Alice" }] } },
    ]);

    await commands.collab("Jane", { json: true, limit: 10 });
    const parsed = JSON.parse(output());
    expect(parsed.researcher.title).toBe("Jane");
    expect(parsed.collaborations).toHaveLength(1);
  });
});

// ── summarize ────────────────────────────────────────

describe("summarize", () => {
  it("shows paper summary from snippet", async () => {
    globalThis.fetch = mockFetchMultiple([
      { data: { results: [{ title: "GPT-4", snippet: "A large multimodal model", authors: "OpenAI", year: 2023 }] } },
      { data: { results: [] }, ok: true },
    ]);

    await commands.summarize("GPT-4", { json: false });
    const out = output();
    expect(out).toContain("Summary");
    expect(out).toContain("GPT-4");
    expect(out).toContain("large multimodal model");
  });

  it("uses RAG data when available", async () => {
    globalThis.fetch = mockFetchMultiple([
      { data: { results: [{ title: "Paper X", snippet: "short" }] } },
      { data: { results: [{ text: "Detailed RAG summary of the paper methodology" }] } },
    ]);

    await commands.summarize("Paper X", { json: false });
    const out = output();
    expect(out).toContain("Detailed RAG summary");
  });

  it("handles paper not found", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.summarize("nonexistent", { json: false });
    expect(output()).toContain("No publication found");
  });
});

// ── watch ────────────────────────────────────────────

describe("watch", () => {
  // We test the list mode which doesn't write files
  it("shows empty watch list", async () => {
    await commands.watch(undefined, { json: false, list: true });
    const out = output();
    expect(out).toContain("Watched Research Areas");
    expect(out).toContain("No watches configured");
  });
});

// ── status ───────────────────────────────────────────

describe("status", () => {
  it("shows service status (all unreachable)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    await commands.status({ json: false });
    const out = output();
    expect(out).toContain("Platform Status");
    expect(out).toContain("unreachable");
    expect(out).toContain("0/");
  });

  it("shows healthy services", async () => {
    globalThis.fetch = mockFetchResponse({ status: "ok", version: "1.0.0" });

    await commands.status({ json: false });
    const out = output();
    expect(out).toContain("healthy");
  });

  it("outputs JSON", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("offline"));

    await commands.status({ json: true });
    const parsed = JSON.parse(output());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty("name");
    expect(parsed[0]).toHaveProperty("status");
  });
});

// ── channels ─────────────────────────────────────────

describe("channels", () => {
  it("shows adapters from gateway", async () => {
    globalThis.fetch = mockFetchResponse({
      adapters: [
        { channel: "teams", patterns: ["automoto.pub", "automoto.sub"] },
        { channel: "web", patterns: ["automoto.pub", "automoto.stream"] },
      ],
    });

    await commands.channels({ json: false });
    const out = output();
    expect(out).toContain("Channel Adapters");
    expect(out).toContain("teams");
    expect(out).toContain("web");
    expect(out).toContain("2 channel adapter(s)");
  });

  it("falls back to static list when gateway offline", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    await commands.channels({ json: false });
    const out = output();
    expect(out).toContain("static list");
    expect(out).toContain("Gateway offline");
    expect(out).toContain("15 channel(s)");
  });
});

// ── config ───────────────────────────────────────────

describe("config", () => {
  it("shows default config with list action", async () => {
    await commands.config("list", undefined, undefined, { json: false });
    const out = output();
    expect(out).toContain("Configuration");
    expect(out).toContain("apiUrl");
    expect(out).toContain("gatewayUrl");
    expect(out).toContain("defaultLimit");
  });

  it("outputs config as JSON", async () => {
    await commands.config("list", undefined, undefined, { json: true });
    const parsed = JSON.parse(output());
    expect(parsed).toHaveProperty("apiUrl");
    expect(parsed).toHaveProperty("defaultLimit");
    expect(parsed.defaultLimit).toBe(5);
  });
});

// ── news ─────────────────────────────────────────────

describe("news", () => {
  it("shows news items", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Automoto Launches New AI Lab", snippet: "Exciting news", url: "https://automoto.example.com/news/1" },
      ],
    });

    await commands.news({ json: false, limit: 10 });
    const out = output();
    expect(out).toContain("News & Highlights");
    expect(out).toContain("Automoto Launches New AI Lab");
  });

  it("handles empty news", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.news({ json: false, limit: 10 });
    expect(output()).toContain("No recent news");
  });
});

// ── rag ──────────────────────────────────────────────

describe("rag", () => {
  it("shows RAG search results with scores", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { text: "RLHF stands for Reinforcement Learning from Human Feedback", source: "paper-123", score: 0.95 },
        { text: "It is used to align language models", source: "paper-456", score: 0.87 },
      ],
    });

    await commands.rag("how does RLHF work", { json: false, limit: 5 });
    const out = output();
    expect(out).toContain("RAG Search");
    expect(out).toContain("RLHF stands for");
    expect(out).toContain("95.0%");
    expect(out).toContain("paper-123");
  });

  it("handles no grounded results", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.rag("nonexistent topic", { json: false, limit: 5 });
    expect(output()).toContain("No grounded results");
  });

  it("passes collection ID when provided", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    await commands.rag("test", { json: false, limit: 5, collection: "my-collection" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("my-collection"),
      }),
    );
  });
});
