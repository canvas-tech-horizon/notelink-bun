import type { Elysia } from "elysia";

/**
 * Simple in-memory rate limiter middleware
 * Limits requests per IP address
 */
export function setupRateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): (app: Elysia) => void {
  // Store request counts per IP
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (app: Elysia): void => {
    app.onBeforeHandle(({ request, set }) => {
      // Get client IP from headers or connection
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0] : "unknown";

      const now = Date.now();
      const record = requestCounts.get(ip);

      if (!record || now > record.resetTime) {
        // Create new record or reset expired one
        requestCounts.set(ip, {
          count: 1,
          resetTime: now + windowMs,
        });
        return; // Allow request
      } else {
        // Increment count
        record.count++;

        if (record.count > maxRequests) {
          set.status = 429;
          return {
            error: "Too Many Requests",
            message: `Rate limit exceeded. Try again in ${Math.ceil(
              (record.resetTime - now) / 1000
            )} seconds.`,
          };
        }
        return; // Allow request
      }
    });
  };
}
