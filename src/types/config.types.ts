import type { Elysia } from "elysia";
import type { SecurityHeadersOptions } from "../middleware/security-headers.middleware";
import type { RateLimitOptions } from "../middleware/rate-limit.middleware";
import type { ErrorHandlerOptions } from "../middleware/error-handler.middleware";
import type { HealthCheckOptions } from "../middleware/health-check.middleware";

/**
 * Custom middleware function type
 */
export type CustomMiddleware = (app: Elysia) => void | Promise<void>;

/**
 * CORS Configuration Options
 */
export interface CorsOptions {
  /** Enable CORS middleware (default: true) */
  enabled?: boolean;
  /** Allowed origins - use array for specific origins, "*" for all (default: "*") */
  origins?: string | string[];
  /** Allowed HTTP methods (default: "GET, POST, PUT, DELETE, PATCH, OPTIONS") */
  methods?: string;
  /** Allowed headers (default: "Content-Type, Authorization") */
  headers?: string;
  /** Allow credentials (default: false) */
  credentials?: boolean;
}

/**
 * Configuration for the API documentation and features
 */
export interface Config {
  title: string;
  description: string;
  version: string;
  host?: string;
  basePath?: string;
  customMiddleware?: CustomMiddleware[];
  
  /** Security headers configuration (default: enabled with secure defaults) */
  securityHeaders?: SecurityHeadersOptions | false;
  
  /** Rate limiting configuration (default: disabled) */
  rateLimit?: RateLimitOptions | false;
  
  /** Error handling configuration (default: enabled with production-safe defaults) */
  errorHandler?: ErrorHandlerOptions | false;
  
  /** Health check endpoint configuration (default: enabled at /health) */
  healthCheck?: HealthCheckOptions | false;
  
  /** CORS configuration (default: permissive for development) */
  cors?: CorsOptions | false;
}

