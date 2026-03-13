/**
 * Unit tests for GitHub Copilot Extension slash commands.
 * Mocks fetch and Express req/res to test handler logic without a server.
 */
import { handleCopilotRequest } from "./handler.js";

// ── Mock Express req/res ─────────────────────────────

interface MockRes {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  events: Array<{ event: string; data: unknown }>;
  ended: boolean;
  jsonBody: unknown;
  setHeader(key: string, value: string): void;
  write(chunk: string): void;
  end(): void;
  status(code: number): MockRes;
  json(data: unknown): void;
}

function createMockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    headers: {},
    body: "",
    events: [],
    ended: false,
    jsonBody: undefined,
    setHeader(key: string, value: string) {
      res.headers[key] = value;
    },
    write(chunk: string) {
      res.body += chunk;
    },
    end() {
      res.ended = true;
      // Parse all SSE events from the accumulated body
      const blocks = res.body.split("\n\n").filter(Boolean);
      for (const block of blocks) {
        const eventMatch = block.match(/^event: (.+)/m);
        const dataMatch = block.match(/^data: (.+)/m);
        if (eventMatch && dataMatch) {
          try {
            res.events.push({ event: eventMatch[1], data: JSON.parse(dataMatch[1]) });
          } catch {
            res.events.push({ event: eventMatch[1], data: dataMatch[1] });
          }
        }
      }
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.jsonBody = data;
    },
  };
  return res;
}

function createMockReq(userMessage: string, extraMessages: Array<{ role: string; content: string }> = []) {
  return {
    body: {
      messages: [
        ...extraMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ],
      copilot_thread_id: "test-thread",
    },
  };
}

// ── Fetch mocking ────────────────────────────────────

function mockFetchResponse(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
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
      json: () => Promise.resolve(resp.data),
    });
  });
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

// Helper to extract content from SSE events
function getMessageContent(res: MockRes): string {
  const msgEvent = res.events.find((e) => e.event === "copilot_message");
  return (msgEvent?.data as { content?: string })?.content ?? "";
}

function getReferences(res: MockRes): unknown[] {
  const refEvent = res.events.find((e) => e.event === "copilot_references");
  return (refEvent?.data as unknown[]) ?? [];
}

function hasDoneEvent(res: MockRes): boolean {
  return res.events.some((e) => e.event === "done");
}

// ── General query (no slash command) ─────────────────

describe("general query", () => {
  it("returns search results for plain text", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "ML Paper", snippet: "About machine learning", url: "https://msr.com/ml" },
      ],
    });

    const req = createMockReq("what is machine learning");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("ML Paper");
    expect(content).toContain("machine learning");
    expect(hasDoneEvent(res)).toBe(true);
    expect(res.ended).toBe(true);
  });

  it("includes /help tip in empty results", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    const req = createMockReq("obscure question");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("/help");
  });
});

// ── /help ────────────────────────────────────────────

describe("/help", () => {
  it("lists all available slash commands", async () => {
    const req = createMockReq("/help");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("/paper");
    expect(content).toContain("/researcher");
    expect(content).toContain("/lab");
    expect(content).toContain("/cite");
    expect(content).toContain("/explain");
    expect(content).toContain("/related");
    expect(content).toContain("/trends");
    expect(content).toContain("/compare");
    expect(content).toContain("/rag");
    expect(content).toContain("/help");
    expect(hasDoneEvent(res)).toBe(true);
  });
});

// ── /paper ───────────────────────────────────────────

describe("/paper", () => {
  it("finds and displays paper details", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Attention Is All You Need", authors: "Vaswani et al.", year: 2017, snippet: "Transformer architecture", url: "https://arxiv.org/abs/1706" },
      ],
    });

    const req = createMockReq("/paper attention is all you need");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Attention Is All You Need");
    expect(content).toContain("Vaswani et al.");
    expect(content).toContain("2017");
    expect(content).toContain("/cite");
    expect(getReferences(res).length).toBeGreaterThan(0);
  });

  it("asks for input when no query provided", async () => {
    const req = createMockReq("/paper");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("provide a paper title");
  });

  it("handles no results", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    const req = createMockReq("/paper nonexistent paper xyz");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("No papers found");
  });
});

// ── /researcher ──────────────────────────────────────

describe("/researcher", () => {
  it("shows researcher profile with publications", async () => {
    globalThis.fetch = mockFetchMultiple([
      { data: { results: [{ title: "Jane Doe", snippet: "Principal Researcher, MSR", url: "https://msr.com/jane" }] } },
      { data: { results: [{ title: "Paper A", year: 2023 }, { title: "Paper B", year: 2022 }] } },
    ]);

    const req = createMockReq("/researcher Jane Doe");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Jane Doe");
    expect(content).toContain("Principal Researcher");
    expect(content).toContain("Paper A");
    expect(content).toContain("Paper B");
    expect(getReferences(res).length).toBeGreaterThan(0);
  });

  it("asks for name when empty", async () => {
    const req = createMockReq("/researcher");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("provide a researcher name");
  });
});

// ── /lab ─────────────────────────────────────────────

describe("/lab", () => {
  it("shows lab overview", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "MSR Redmond", snippet: "Main research campus" },
        { title: "AI for Science", snippet: "Research initiative", url: "https://msr.com/ai" },
      ],
    });

    const req = createMockReq("/lab Redmond");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Redmond");
    expect(content).toContain("MSR Redmond");
    expect(content).toContain("Main research campus");
  });

  it("asks for lab name when empty", async () => {
    const req = createMockReq("/lab");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("specify a lab");
  });
});

// ── /cite ────────────────────────────────────────────

describe("/cite", () => {
  it("generates all citation formats", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "Test Paper", authors: "Smith, J., Doe, A.", year: 2023, url: "https://msr.com/paper" }],
    });

    const req = createMockReq("/cite Test Paper");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    // BibTeX
    expect(content).toContain("@article{");
    expect(content).toContain("Test Paper");
    expect(content).toContain("2023");
    // APA
    expect(content).toContain("APA");
    expect(content).toContain("Smith, J., Doe, A. (2023)");
    // MLA
    expect(content).toContain("MLA");
  });

  it("asks for paper when empty", async () => {
    const req = createMockReq("/cite");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("provide a paper title");
  });

  it("handles not found", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    const req = createMockReq("/cite unknown paper");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("No publication found");
  });
});

// ── /explain ─────────────────────────────────────────

describe("/explain", () => {
  it("explains a paper with RAG context", async () => {
    globalThis.fetch = mockFetchMultiple([
      { data: { results: [{ title: "RLHF Paper", authors: "Team A", year: 2022, snippet: "Alignment technique" }] } },
      { data: { results: [{ text: "RLHF uses human feedback to fine-tune models" }] } },
    ]);

    const req = createMockReq("/explain RLHF");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("RLHF Paper");
    expect(content).toContain("human feedback");
    expect(content).toContain("Plain English");
  });

  it("falls back to snippet when no RAG results", async () => {
    globalThis.fetch = mockFetchMultiple([
      { data: { results: [{ title: "Paper Z", snippet: "About transformers" }] } },
      { data: { results: [] } },
    ]);

    const req = createMockReq("/explain transformers");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("About transformers");
  });

  it("asks for topic when empty", async () => {
    const req = createMockReq("/explain");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("provide a paper title");
  });
});

// ── /related ─────────────────────────────────────────

describe("/related", () => {
  it("finds related papers for explicit topic", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Related Paper 1", authors: "A. Author", year: 2023 },
        { title: "Related Paper 2", authors: "B. Author", year: 2022 },
      ],
    });

    const req = createMockReq("/related transformer architectures");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Related Papers");
    expect(content).toContain("Related Paper 1");
    expect(content).toContain("Related Paper 2");
  });

  it("uses conversation context when no explicit topic", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "Context Paper" }],
    });

    const req = createMockReq("/related", [
      { role: "user", content: "tell me about quantum computing" },
      { role: "assistant", content: "Quantum computing is..." },
    ]);
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Related Papers");
    // Verify fetch was called with context from earlier messages
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("quantum computing"),
      }),
    );
  });
});

// ── /trends ──────────────────────────────────────────

describe("/trends", () => {
  it("shows trending papers with area filter", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { title: "Trending Paper 1", authors: "Researcher A" },
        { title: "Trending Paper 2", authors: "Researcher B" },
      ],
    });

    const req = createMockReq("/trends machine learning");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Trending Research");
    expect(content).toContain("machine learning");
    expect(content).toContain("Trending Paper 1");
  });

  it("shows all trends when no area specified", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [{ title: "General Trend" }],
    });

    const req = createMockReq("/trends");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Trending Research");
    expect(content).toContain("General Trend");
  });
});

// ── /compare ─────────────────────────────────────────

describe("/compare", () => {
  it("compares two papers side by side", async () => {
    globalThis.fetch = mockFetchMultiple([
      { data: { results: [{ title: "GPT-4", authors: "OpenAI", year: 2023, snippet: "Large language model" }] } },
      { data: { results: [{ title: "PaLM 2", authors: "Google", year: 2023, snippet: "Pathways language model" }] } },
    ]);

    const req = createMockReq("/compare GPT-4 vs PaLM 2");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Comparison");
    expect(content).toContain("GPT-4");
    expect(content).toContain("PaLM 2");
    expect(content).toContain("OpenAI");
    expect(content).toContain("Google");
  });

  it("asks for two papers when format is wrong", async () => {
    const req = createMockReq("/compare just one paper");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain('separate the two papers with "vs"');
  });

  it("asks for input when empty", async () => {
    const req = createMockReq("/compare");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("provide two papers");
  });
});

// ── /rag ─────────────────────────────────────────────

describe("/rag", () => {
  it("shows grounded RAG results", async () => {
    globalThis.fetch = mockFetchResponse({
      results: [
        { text: "RLHF is a technique for aligning AI models", source: "doc-1" },
        { text: "It involves human raters providing feedback", source: "doc-2" },
      ],
    });

    const req = createMockReq("/rag how does RLHF work");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Grounded Answer");
    expect(content).toContain("RLHF is a technique");
    expect(content).toContain("doc-1");
  });

  it("asks for query when empty", async () => {
    const req = createMockReq("/rag");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("provide a search query");
  });

  it("handles no results", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    const req = createMockReq("/rag nonexistent thing");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(getMessageContent(res)).toContain("No grounded results");
  });
});

// ── Unknown command ──────────────────────────────────

describe("unknown command", () => {
  it("returns error for unknown slash command", async () => {
    const req = createMockReq("/foobar something");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const content = getMessageContent(res);
    expect(content).toContain("Unknown command");
    expect(content).toContain("/foobar");
    expect(content).toContain("/help");
  });
});

// ── Error handling ───────────────────────────────────

describe("error handling", () => {
  it("returns 400 for empty messages", async () => {
    const req = { body: { messages: [] } };
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toEqual({ error: "No user message found" });
  });

  it("handles fetch errors gracefully", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const req = createMockReq("a general question that triggers the catch block");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    // The top-level catch handler returns an error message
    const content = getMessageContent(res);
    expect(content).toBeTruthy();
    expect(hasDoneEvent(res)).toBe(true);
    expect(res.ended).toBe(true);
  });
});

// ── SSE protocol compliance ──────────────────────────

describe("SSE protocol", () => {
  it("sets correct SSE headers", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    const req = createMockReq("test query");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(res.headers["Content-Type"]).toBe("text/event-stream");
    expect(res.headers["Cache-Control"]).toBe("no-cache");
    expect(res.headers["Connection"]).toBe("keep-alive");
  });

  it("always sends done event", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    const req = createMockReq("anything");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    expect(hasDoneEvent(res)).toBe(true);
    expect(res.ended).toBe(true);
  });

  it("sends copilot_message event with assistant role", async () => {
    globalThis.fetch = mockFetchResponse({ results: [] });

    const req = createMockReq("test");
    const res = createMockRes();
    await handleCopilotRequest(req as any, res as any);

    const msgEvent = res.events.find((e) => e.event === "copilot_message");
    expect(msgEvent).toBeDefined();
    expect((msgEvent?.data as { role: string }).role).toBe("assistant");
  });
});
