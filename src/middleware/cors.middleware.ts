import type { Elysia } from "elysia";

/**
 * CORS Configuration Options
 */
export interface CorsOptions {
  /** Allowed origins - use array for specific origins, "*" for all (default: "*") */
  origins?: string | string[];
  /** Allowed HTTP methods (default: "GET, POST, PUT, DELETE, PATCH, OPTIONS") */
  methods?: string;
  /** Allowed headers (default: "Content-Type, Authorization") */
  headers?: string;
  /** Allow credentials (default: false) */
  credentials?: boolean;
  /** Max age for preflight cache in seconds (default: 86400 = 24 hours) */
  maxAge?: number;
  /** Headers to expose to the browser (default: none) */
  exposedHeaders?: string;
}

/**
 * Configures Cross-Origin Resource Sharing (CORS) middleware for the Elysia application
 * 
 * This function sets up CORS headers to allow web browsers to make cross-origin
 * requests to the API. It's executed before every request using the onBeforeHandle hook.
 * 
 * CORS Headers Set:
 * - Access-Control-Allow-Origin: Specifies allowed origins
 * - Access-Control-Allow-Methods: Specifies allowed HTTP methods
 * - Access-Control-Allow-Headers: Specifies allowed request headers
 * - Access-Control-Allow-Credentials: Whether to allow cookies (optional)
 * - Access-Control-Max-Age: How long preflight results can be cached
 * - Access-Control-Expose-Headers: Headers exposed to browser (optional)
 * 
 * Security Considerations:
 * - The wildcard "*" origin is convenient for development but should be restricted in production
 * - Use specific origins for production: ["https://yourdomain.com"]
 * - Cannot use "*" with credentials: true (use specific origins instead)
 * - Consider using environment variables for origin configuration
 * 
 * Preflight Requests:
 * Browsers send OPTIONS requests before actual requests for CORS preflight checks.
 * This middleware ensures these preflight requests are handled correctly.
 * 
 * Compliance:
 * - W3C CORS Specification
 * - ISO/IEC 25010:2023 Security requirements
 * 
 * @param app - The Elysia application instance to configure
 * @param options - CORS configuration options
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupCorsMiddleware } from './middleware/cors.middleware';
 * 
 * const app = new Elysia();
 * 
 * // Default (permissive - development)
 * setupCorsMiddleware(app);
 * 
 * // Production with specific origins
 * setupCorsMiddleware(app, {
 *   origins: ['https://app.example.com', 'https://admin.example.com'],
 *   credentials: true,
 *   methods: 'GET, POST, PUT, DELETE',
 *   headers: 'Content-Type, Authorization, X-API-Key'
 * });
 * 
 * // Environment-based configuration
 * setupCorsMiddleware(app, {
 *   origins: process.env.ALLOWED_ORIGINS?.split(',') || '*',
 *   credentials: process.env.NODE_ENV === 'production'
 * });
 * ```
 */
export function setupCorsMiddleware(app: Elysia, options: CorsOptions = {}): void {
  const {
    origins = "*",
    methods = "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    headers = "Content-Type, Authorization",
    credentials = false,
    maxAge = 86400, // 24 hours
    exposedHeaders,
  } = options;

  app.onBeforeHandle(({ set, request }) => {
    const requestOrigin = request.headers.get("origin");

    // Determine allowed origin
    let allowedOrigin = "*";
    
    if (Array.isArray(origins)) {
      // Check if request origin is in allowed list
      if (requestOrigin && origins.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
      } else if (origins.length > 0) {
        allowedOrigin = origins[0]; // Default to first allowed origin
      }
    } else {
      allowedOrigin = origins;
    }

    // Set CORS headers
    set.headers["Access-Control-Allow-Origin"] = allowedOrigin;
    set.headers["Access-Control-Allow-Methods"] = methods;
    set.headers["Access-Control-Allow-Headers"] = headers;
    
    if (credentials) {
      set.headers["Access-Control-Allow-Credentials"] = "true";
    }

    if (maxAge) {
      set.headers["Access-Control-Max-Age"] = maxAge.toString();
    }

    if (exposedHeaders) {
      set.headers["Access-Control-Expose-Headers"] = exposedHeaders;
    }

    // Vary header for caching
    set.headers["Vary"] = "Origin";
  });
}
