import type { Elysia } from "elysia";

/**
 * Configures Cross-Origin Resource Sharing (CORS) middleware for the Elysia application
 * 
 * This function sets up permissive CORS headers to allow web browsers to make cross-origin
 * requests to the API. It's executed before every request using the onBeforeHandle hook.
 * 
 * CORS Headers Set:
 * - Access-Control-Allow-Origin: "*"
 *   Allows requests from any origin (use specific origins in production)
 * 
 * - Access-Control-Allow-Methods: "GET, POST, PUT, DELETE, PATCH, OPTIONS"
 *   Allows all common HTTP methods
 * 
 * - Access-Control-Allow-Headers: "Content-Type, Authorization"
 *   Allows Content-Type and Authorization headers in requests
 * 
 * Security Considerations:
 * - The wildcard "*" origin is convenient for development but should be restricted in production
 * - Consider using specific origins for production: ["https://yourdomain.com"]
 * - Add credentials support if needed: Access-Control-Allow-Credentials: true
 * - Add additional headers as needed: Access-Control-Max-Age, Access-Control-Expose-Headers
 * 
 * Preflight Requests:
 * Browsers send OPTIONS requests before actual requests for CORS preflight checks.
 * This middleware ensures these preflight requests are handled correctly.
 * 
 * @param app - The Elysia application instance to configure
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupCorsMiddleware } from './middleware/cors.middleware';
 * 
 * const app = new Elysia();
 * setupCorsMiddleware(app);
 * 
 * // Now your API can be called from web browsers:
 * // fetch('http://localhost:3000/api/users', {
 * //   method: 'POST',
 * //   headers: {
 * //     'Content-Type': 'application/json',
 * //     'Authorization': 'Bearer token123'
 * //   },
 * //   body: JSON.stringify({ name: 'John' })
 * // });
 * 
 * // For production with specific origins:
 * // Replace the middleware with:
 * // set.headers["Access-Control-Allow-Origin"] = "https://yourdomain.com";
 * ```
 */
export function setupCorsMiddleware(app: Elysia): void {
  app.onBeforeHandle(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] =
      "GET, POST, PUT, DELETE, PATCH, OPTIONS";
    set.headers["Access-Control-Allow-Headers"] =
      "Content-Type, Authorization";
  });
}
