import { describe, it, expect, vi } from "vitest";
import {
  decodeJwtPayload,
  validateClaims,
  extractBearerToken,
  authenticateRequest,
  handleCors,
  type AuthConfig,
} from "./auth.js";

/* ── Helpers ───────────────────────────────────────────────── */

function createTestJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = Buffer.from("test-signature").toString("base64url");
  return `${header}.${body}.${sig}`;
}

function mockReq(
  overrides: Partial<{
    url: string;
    method: string;
    headers: Record<string, string>;
  }> = {},
) {
  return {
    url: "/sse",
    method: "GET",
    headers: {} as Record<string, string | undefined>,
    ...overrides,
  } as unknown as import("node:http").IncomingMessage;
}

function mockRes() {
  const res = {
    statusCode: 200,
    _headers: {} as Record<string, string>,
    _body: "",
    writeHead: vi.fn((code: number, headers?: Record<string, string>) => {
      res.statusCode = code;
      if (headers) Object.assign(res._headers, headers);
      return res;
    }),
    end: vi.fn((data?: string) => {
      res._body = data ?? "";
    }),
    setHeader: vi.fn((key: string, value: string) => {
      res._headers[key] = value;
    }),
  };
  return res as unknown as import("node:http").ServerResponse & {
    statusCode: number;
    _headers: Record<string, string>;
    _body: string;
  };
}

/* ── decodeJwtPayload ──────────────────────────────────────── */

describe("decodeJwtPayload", () => {
  it("decodes a valid JWT payload", () => {
    const token = createTestJwt({ sub: "user1", exp: 9999999999 });
    const payload = decodeJwtPayload(token);
    expect(payload).toEqual({ sub: "user1", exp: 9999999999 });
  });

  it("returns null for a non-JWT string", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });

  it("returns null for malformed base64", () => {
    expect(decodeJwtPayload("a.!!!invalid.c")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(decodeJwtPayload("")).toBeNull();
  });
});

/* ── validateClaims ────────────────────────────────────────── */

describe("validateClaims", () => {
  const config: AuthConfig = {
    enabled: true,
    tenantId: "test-tenant-id",
    audience: "api://automoto-mcp",
    allowedOrigins: [],
  };

  it("accepts a valid token with v1 issuer", () => {
    const result = validateClaims(
      {
        exp: Date.now() / 1000 + 3600,
        iss: `https://sts.windows.net/${config.tenantId}/`,
        aud: "api://automoto-mcp",
      },
      config,
    );
    expect(result.valid).toBe(true);
  });

  it("accepts a valid token with v2 issuer", () => {
    const result = validateClaims(
      {
        exp: Date.now() / 1000 + 3600,
        iss: `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
        aud: "api://automoto-mcp",
      },
      config,
    );
    expect(result.valid).toBe(true);
  });

  it("rejects an expired token", () => {
    const result = validateClaims(
      {
        exp: Date.now() / 1000 - 3600,
        iss: `https://sts.windows.net/${config.tenantId}/`,
        aud: "api://automoto-mcp",
      },
      config,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token expired");
  });

  it("rejects an invalid issuer", () => {
    const result = validateClaims(
      {
        exp: Date.now() / 1000 + 3600,
        iss: "https://evil.example.com/",
        aud: "api://automoto-mcp",
      },
      config,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Invalid token issuer");
  });

  it("rejects an invalid audience", () => {
    const result = validateClaims(
      {
        exp: Date.now() / 1000 + 3600,
        iss: `https://sts.windows.net/${config.tenantId}/`,
        aud: "wrong-audience",
      },
      config,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Invalid token audience");
  });

  it("skips issuer check when tenantId is not configured", () => {
    const result = validateClaims(
      { exp: Date.now() / 1000 + 3600, iss: "any-issuer", aud: "api://automoto-mcp" },
      { ...config, tenantId: undefined },
    );
    expect(result.valid).toBe(true);
  });

  it("skips audience check when audience is not configured", () => {
    const result = validateClaims(
      {
        exp: Date.now() / 1000 + 3600,
        iss: `https://sts.windows.net/${config.tenantId}/`,
        aud: "any-audience",
      },
      { ...config, audience: undefined },
    );
    expect(result.valid).toBe(true);
  });

  it("accepts token without expiry claim", () => {
    const result = validateClaims(
      {
        iss: `https://sts.windows.net/${config.tenantId}/`,
        aud: "api://automoto-mcp",
      },
      config,
    );
    expect(result.valid).toBe(true);
  });
});

/* ── extractBearerToken ────────────────────────────────────── */

describe("extractBearerToken", () => {
  it("extracts token from Authorization header", () => {
    const req = mockReq({ headers: { authorization: "Bearer abc123" } });
    expect(extractBearerToken(req)).toBe("abc123");
  });

  it("returns null when no header present", () => {
    expect(extractBearerToken(mockReq())).toBeNull();
  });

  it("returns null for non-Bearer scheme", () => {
    const req = mockReq({ headers: { authorization: "Basic abc123" } });
    expect(extractBearerToken(req)).toBeNull();
  });
});

/* ── authenticateRequest ───────────────────────────────────── */

describe("authenticateRequest", () => {
  const config: AuthConfig = {
    enabled: true,
    tenantId: "test-tenant",
    audience: "api://automoto",
    allowedOrigins: [],
  };

  it("passes when auth is disabled", () => {
    const req = mockReq();
    const res = mockRes();
    expect(
      authenticateRequest(req, res, { ...config, enabled: false }),
    ).toBe(true);
  });

  it("returns 401 when no token provided", () => {
    const req = mockReq();
    const res = mockRes();
    expect(authenticateRequest(req, res, config)).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(
      401,
      expect.objectContaining({ "WWW-Authenticate": "Bearer" }),
    );
  });

  it("returns 401 for invalid token format", () => {
    const req = mockReq({
      headers: { authorization: "Bearer not-a-jwt" },
    });
    const res = mockRes();
    expect(authenticateRequest(req, res, config)).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(401, expect.any(Object));
  });

  it("returns 403 for expired token", () => {
    const token = createTestJwt({
      exp: Date.now() / 1000 - 3600,
      iss: `https://sts.windows.net/${config.tenantId}/`,
      aud: "api://automoto",
    });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    expect(authenticateRequest(req, res, config)).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(403, expect.any(Object));
  });

  it("passes for valid token", () => {
    const token = createTestJwt({
      exp: Date.now() / 1000 + 3600,
      iss: `https://sts.windows.net/${config.tenantId}/`,
      aud: "api://automoto",
    });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    expect(authenticateRequest(req, res, config)).toBe(true);
  });
});

/* ── handleCors ────────────────────────────────────────────── */

describe("handleCors", () => {
  it("sets CORS headers for an allowed origin", () => {
    const req = mockReq({
      method: "GET",
      headers: { origin: "https://app.example.com" },
    });
    const res = mockRes();
    const config: AuthConfig = {
      enabled: true,
      allowedOrigins: ["https://app.example.com"],
      tenantId: undefined,
      audience: undefined,
    };

    const handled = handleCors(req, res, config);
    expect(handled).toBe(false);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "https://app.example.com",
    );
  });

  it("handles OPTIONS preflight and returns true", () => {
    const req = mockReq({
      method: "OPTIONS",
      headers: { origin: "https://app.example.com" },
    });
    const res = mockRes();
    const config: AuthConfig = {
      enabled: true,
      allowedOrigins: ["https://app.example.com"],
      tenantId: undefined,
      audience: undefined,
    };

    expect(handleCors(req, res, config)).toBe(true);
    expect(res.writeHead).toHaveBeenCalledWith(204);
  });

  it("does not set CORS for disallowed origin", () => {
    const req = mockReq({
      method: "GET",
      headers: { origin: "https://evil.com" },
    });
    const res = mockRes();
    const config: AuthConfig = {
      enabled: true,
      allowedOrigins: ["https://app.example.com"],
      tenantId: undefined,
      audience: undefined,
    };

    handleCors(req, res, config);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it("does not set CORS when allowedOrigins is empty (same-origin only)", () => {
    const req = mockReq({
      method: "GET",
      headers: { origin: "https://any.com" },
    });
    const res = mockRes();
    const config: AuthConfig = {
      enabled: true,
      allowedOrigins: [],
      tenantId: undefined,
      audience: undefined,
    };

    handleCors(req, res, config);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it("allows all origins when wildcard is configured", () => {
    const req = mockReq({
      method: "GET",
      headers: { origin: "https://anything.example.com" },
    });
    const res = mockRes();
    const config: AuthConfig = {
      enabled: true,
      allowedOrigins: ["*"],
      tenantId: undefined,
      audience: undefined,
    };

    handleCors(req, res, config);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "https://anything.example.com",
    );
  });
});
