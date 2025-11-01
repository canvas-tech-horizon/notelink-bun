import type { Elysia } from "elysia";

/**
 * Request ID middleware
 * Adds a unique request ID to each request for tracking
 */
export function setupRequestIdMiddleware(app: Elysia): void {
  app.onBeforeHandle(({ request, set }) => {
    // Check if request ID already exists in headers
    const existingId = request.headers.get("x-request-id");
    const requestId = existingId || crypto.randomUUID();
    
    // Add request ID to response headers
    set.headers["x-request-id"] = requestId;
    
    // Optionally log the request ID
    console.log(`Request ID: ${requestId} - ${request.method} ${new URL(request.url).pathname}`);
  });
}
