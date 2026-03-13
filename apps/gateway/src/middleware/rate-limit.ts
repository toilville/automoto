import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60_000,
  maxRequests: 120,
};

export function rateLimitMiddleware(opts?: Partial<RateLimitOptions>) {
  const { windowMs, maxRequests } = { ...DEFAULT_OPTIONS, ...opts };
  const clients = new Map<string, RateLimitEntry>();

  // Periodic cleanup of expired entries
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of clients) {
      if (now >= entry.resetAt) {
        clients.delete(key);
      }
    }
  }, windowMs);

  // Allow the timer to not block process exit
  cleanupInterval.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();

    let entry = clients.get(ip);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(ip, entry);
    }

    entry.count++;

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000}s window.`,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
}
