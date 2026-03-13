import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callDataApi, _resetCredentials } from "./data-api.js";

describe("callDataApi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("DATA_API_URL", "http://test-api:7071");
    vi.stubEnv("DATA_API_SCOPE", "");
    _resetCredentials();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    fetchMock.mockReset();
  });

  it("makes a GET request to the correct URL", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: "test" }), { status: 200 }),
    );

    const result = await callDataApi("/api/test");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("http://test-api:7071/api/test");
    expect(result).toEqual({ data: "test" });
  });

  it("makes a POST request with JSON body", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await callDataApi("/api/search", {
      method: "POST",
      body: { query: "test" },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://test-api:7071/api/search");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual(
      expect.objectContaining({ "Content-Type": "application/json" }),
    );
    expect(JSON.parse(init.body as string)).toEqual({ query: "test" });
  });

  it("appends query parameters", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await callDataApi("/api/test", { query: { foo: "bar", baz: "qux" } });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("foo=bar");
    expect(url).toContain("baz=qux");
  });

  it("skips empty query parameter values", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await callDataApi("/api/test", { query: { foo: "bar", empty: "" } });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("foo=bar");
    expect(url).not.toContain("empty");
  });

  it("throws a sanitized error on non-OK response", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(
      new Response(
        "Internal DB error: connection refused to postgres://user:pass@host/db",
        { status: 500, statusText: "Internal Server Error" },
      ),
    );

    await expect(callDataApi("/api/test")).rejects.toThrow(
      "Data API request failed (HTTP 500)",
    );

    // Full error details logged server-side
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Data API error: 500"),
      expect.stringContaining("connection refused"),
    );
    errorSpy.mockRestore();
  });

  it("never exposes raw API response body in thrown error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(
      new Response("sensitive error details with PII email@example.com", {
        status: 400,
      }),
    );

    try {
      await callDataApi("/api/test");
      expect.unreachable("should have thrown");
    } catch (err: unknown) {
      const message = (err as Error).message;
      expect(message).not.toContain("sensitive");
      expect(message).not.toContain("PII");
      expect(message).not.toContain("email@example.com");
      expect(message).toBe("Data API request failed (HTTP 400)");
    }
    vi.restoreAllMocks();
  });

  it("falls back to localhost when DATA_API_URL is not set", async () => {
    vi.stubEnv("DATA_API_URL", "");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await callDataApi("/api/test");

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:7071/api/test");
  });

  it("does not attach auth header when DATA_API_SCOPE is empty", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await callDataApi("/api/test");

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers?.Authorization).toBeUndefined();
  });
});
