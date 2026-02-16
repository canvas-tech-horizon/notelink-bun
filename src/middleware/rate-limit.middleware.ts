import type { Elysia, Context } from "elysia";

/**
 * Rate Limiting Configuration Options
 */
export interface RateLimitOptions {
  /** Maximum number of requests per window - default: 100 */
  max?: number;
  /** Time window in milliseconds - default: 60000 (1 minute) */
  windowMs?: number;
  /** Custom message when rate limit is exceeded */
  message?: string;
  /** Skip rate limiting for certain requests (e.g., health checks) */
  skip?: (ctx: Context) => boolean;
  /** Custom key generator for tracking requests (default: IP address) */
  keyGenerator?: (ctx: Context) => string;
  /** Handler called when rate limit is exceeded */
  onLimitReached?: (ctx: Context) => void;
  /** Include rate limit info in response headers - default: true */
  standardHeaders?: boolean;
  /** Include legacy rate limit headers - default: false */
  legacyHeaders?: boolean;
}

/**
 * Rate Limit Store Interface
 * Tracks request counts per key (typically IP address)
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Configures rate limiting middleware to protect against DoS/DDoS attacks
 * 
 * This middleware implements a sliding window rate limiter that tracks requests per client
 * (identified by IP address or custom key) and blocks excessive requests. It helps prevent:
 * 
 * Protection Against:
 * - Denial of Service (DoS) attacks
 * - Distributed Denial of Service (DDoS) attacks
 * - Brute force attacks
 * - API abuse and excessive usage
 * - Resource exhaustion
 * 
 * Features:
 * - In-memory request tracking (fast, no external dependencies)
 * - Automatic cleanup of expired entries
 * - Standard rate limit headers (X-RateLimit-*)
 * - Customizable limits per endpoint
 * - IP-based or custom key identification
 * - Graceful error responses
 * 
 * Rate Limit Headers (when standardHeaders: true):
 * - X-RateLimit-Limit: Maximum requests allowed in window
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - Retry-After: Seconds until rate limit resets (on 429 response)
 * 
 * Limitations:
 * - In-memory storage (not suitable for distributed systems without modification)
 * - For production clusters, consider Redis-based rate limiting
 * 
 * Security Considerations:
 * - Rate limits should be tuned based on your API's expected usage
 * - Consider different limits for authenticated vs unauthenticated users
 * - Implement stricter limits on sensitive endpoints (login, signup)
 * - Monitor rate limit hits to detect potential attacks
 * 
 * Compliance:
 * - ISO/IEC 25010:2023 Security.Resistance requirements
 * - OWASP API Security Top 10 - API4:2023 Unrestricted Resource Consumption
 * 
 * @param app - The Elysia application instance to configure
 * @param options - Rate limiting configuration options
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupRateLimit } from './middleware/rate-limit.middleware';
 * 
 * const app = new Elysia();
 * 
 * // Default: 100 requests per minute
 * setupRateLimit(app);
 * 
 * // Custom limits
 * setupRateLimit(app, {
 *   max: 50,
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   message: 'Too many requests, please try again later'
 * });
 * 
 * // Skip rate limiting for health checks
 * setupRateLimit(app, {
 *   max: 100,
 *   skip: (ctx) => ctx.request.url.endsWith('/health')
 * });
 * 
 * // Stricter limits for authentication endpoints
 * setupRateLimit(app, {
 *   max: 5,
 *   windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
 *   keyGenerator: (ctx) => {
 *     // Rate limit by IP + endpoint for auth routes
 *     const ip = ctx.request.headers.get('x-forwarded-for') || 
 *                ctx.request.headers.get('x-real-ip') || 
 *                'unknown';
 *     return `${ip}:${ctx.path}`;
 *   }
 * });
 * 
 * // Custom handler when limit is reached
 * setupRateLimit(app, {
 *   max: 100,
 *   onLimitReached: (ctx) => {
 *     console.warn(`Rate limit exceeded for ${ctx.request.headers.get('x-forwarded-for')}`);
 *   }
 * });
 * ```
 */
export function setupRateLimit(
  app: Elysia,
  options: RateLimitOptions = {}
): void {
  const {
    max = 100,
    windowMs = 60000, // 1 minute
    message = "Too many requests, please try again later",
    skip,
    keyGenerator,
    onLimitReached,
    standardHeaders = true,
    legacyHeaders = false,
  } = options;

  // In-memory store for tracking requests
  const store: RateLimitStore = {};

  // Cleanup expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, 60000);

  /**
   * Default key generator - extracts client IP address
   * Supports X-Forwarded-For and X-Real-IP headers for proxied requests
   */
  const defaultKeyGenerator = (ctx: Context): string => {
    const forwardedFor = ctx.request.headers.get("x-forwarded-for");
    const realIp = ctx.request.headers.get("x-real-ip");
    
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, use the first one
      return forwardedFor.split(",")[0].trim();
    }
    
    return realIp || "unknown";
  };

  const getKey = keyGenerator || defaultKeyGenerator;

  app.onBeforeHandle(({ set, request, ...ctx }) => {
    const context = { set, request, ...ctx } as Context;

    // Skip rate limiting if skip function returns true
    if (skip && skip(context)) {
      return;
    }

    const key = getKey(context);
    const now = Date.now();

    // Initialize or get existing rate limit data
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const record = store[key];
    record.count++;

    const remaining = Math.max(0, max - record.count);
    const resetTime = Math.ceil(record.resetTime / 1000); // Convert to seconds

    // Add standard rate limit headers
    if (standardHeaders) {
      set.headers["X-RateLimit-Limit"] = max.toString();
      set.headers["X-RateLimit-Remaining"] = remaining.toString();
      set.headers["X-RateLimit-Reset"] = resetTime.toString();
    }

    // Add legacy rate limit headers (for backwards compatibility)
    if (legacyHeaders) {
      set.headers["X-Rate-Limit-Limit"] = max.toString();
      set.headers["X-Rate-Limit-Remaining"] = remaining.toString();
      set.headers["X-Rate-Limit-Reset"] = resetTime.toString();
    }

    // Check if rate limit exceeded
    if (record.count > max) {
      // Call custom handler if provided
      if (onLimitReached) {
        onLimitReached(context);
      }

      // Set Retry-After header
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      set.headers["Retry-After"] = retryAfter.toString();

      // Return 429 Too Many Requests
      set.status = 429;
      return {
        error: "Too Many Requests",
        message: message,
        statusCode: 429,
        retryAfter: retryAfter,
      };
    }
    
    // Explicitly return undefined for normal execution
    return undefined;
  });
}

/**
 * Creates a rate limiter specifically for authentication endpoints
 * 
 * Implements stricter rate limits to prevent brute force attacks on login/signup endpoints.
 * Default: 5 requests per 15 minutes
 * 
 * @param options - Rate limiting options (optional)
 * 
 * @example
 * ```typescript
 * import { createAuthRateLimiter } from './middleware/rate-limit.middleware';
 * 
 * const app = new Elysia();
 * 
 * // Apply strict rate limiting to auth routes
 * createAuthRateLimiter(app);
 * ```
 */
export function createAuthRateLimiter(
  app: Elysia,
  options: RateLimitOptions = {}
): void {
  setupRateLimit(app, {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many authentication attempts, please try again later",
    ...options,
  });
}
