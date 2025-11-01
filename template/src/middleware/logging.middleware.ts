import type { Elysia } from "elysia";

/**
 * Custom logging middleware
 * Logs all incoming requests with method, path, and timestamp
 */
export function setupLoggingMiddleware(app: Elysia): void {
  app.onBeforeHandle(({ request }) => {
    const timestamp = new Date().toLocaleString();
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    
    console.log(`[${timestamp}] ${method} ${path}`);
  });

  app.onAfterHandle(({ request, set }) => {
    const timestamp = new Date().toLocaleString();
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    const status = set.status || 200;
    
    console.log(`[${timestamp}] ${method} ${path} - ${status}`);
  });
}
