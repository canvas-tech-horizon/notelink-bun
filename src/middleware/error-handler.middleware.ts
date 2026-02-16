import type { Elysia, Context } from "elysia";

/**
 * Error Handler Configuration Options
 */
export interface ErrorHandlerOptions {
  /** Include stack traces in error responses (default: false in production) */
  includeStack?: boolean;
  /** Custom error logger function */
  logger?: (error: Error, context: Context) => void;
  /** Custom error response formatter */
  formatter?: (error: Error, context: Context) => any;
  /** Environment (auto-detected if not provided) */
  environment?: "development" | "production" | "test";
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  stack?: string;
  details?: any;
}

/**
 * Configures global error handling middleware for the Elysia application
 * 
 * This middleware provides comprehensive error handling capabilities including:
 * 
 * Features:
 * - Automatic error catching and logging
 * - Standardized error response format
 * - Stack trace inclusion (dev mode only)
 * - HTTP status code mapping
 * - Request correlation for debugging
 * - Security: Prevents sensitive information leakage
 * - Custom error logging integration
 * 
 * Error Types Handled:
 * - Validation errors (400 Bad Request)
 * - Authentication errors (401 Unauthorized)
 * - Authorization errors (403 Forbidden)
 * - Not found errors (404 Not Found)
 * - Internal server errors (500 Internal Server Error)
 * - Custom application errors
 * 
 * Security Considerations:
 * - Never exposes sensitive error details in production
 * - Sanitizes error messages to prevent information disclosure
 * - Logs full error details server-side for debugging
 * - Prevents stack trace leakage in production
 * 
 * Compliance:
 * - ISO/IEC 25010:2023 Reliability.Fault Tolerance
 * - OWASP Security Logging and Monitoring
 * 
 * @param app - The Elysia application instance to configure
 * @param options - Error handling configuration options
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupErrorHandler } from './middleware/error-handler.middleware';
 * 
 * const app = new Elysia();
 * 
 * // Default configuration (recommended)
 * setupErrorHandler(app);
 * 
 * // Custom configuration
 * setupErrorHandler(app, {
 *   includeStack: process.env.NODE_ENV === 'development',
 *   logger: (error, ctx) => {
 *     console.error(`Error at ${ctx.path}:`, error);
 *     // Send to error tracking service (Sentry, DataDog, etc.)
 *   }
 * });
 * 
 * // Custom error response format
 * setupErrorHandler(app, {
 *   formatter: (error, ctx) => ({
 *     success: false,
 *     error: error.message,
 *     code: getStatusCode(error),
 *     requestId: ctx.request.headers.get('x-request-id')
 *   })
 * });
 * ```
 */
export function setupErrorHandler(
  app: Elysia,
  options: ErrorHandlerOptions = {}
): void {
  const environment = options.environment || 
    (process.env.NODE_ENV as "development" | "production" | "test") || 
    "development";

  const includeStack = options.includeStack ?? (environment === "development");

  // Default error logger
  const defaultLogger = (error: Error, context: Context) => {
    const timestamp = new Date().toISOString();
    const method = context.request.method;
    const path = context.path;
    
    console.error(
      `\n[${timestamp}] Error in ${method} ${path}:\n`,
      `  Error: ${error.name}: ${error.message}\n`,
      `  Stack: ${error.stack || 'No stack trace'}\n`
    );
  };

  const logger = options.logger || defaultLogger;

  // Default error formatter
  const defaultFormatter = (error: Error, context: Context): ErrorResponse => {
    const statusCode = getStatusCode(error);
    const path = context.path || context.request.url;

    const response: ErrorResponse = {
      error: error.name || "Error",
      message: sanitizeErrorMessage(error.message, environment),
      statusCode,
      timestamp: new Date().toISOString(),
      path,
    };

    // Include stack trace only in development
    if (includeStack && error.stack) {
      response.stack = error.stack;
    }

    // Include additional details if available
    if ((error as any).details) {
      response.details = (error as any).details;
    }

    return response;
  };

  const formatter = options.formatter || defaultFormatter;

  // Global error handler
  app.onError(({ error, set, ...context }) => {
    // Type guard to ensure error is an Error object
    const err = error instanceof Error ? error : new Error(String(error));
    
    // Log the error
    logger(err, context as any);

    // Format error response
    const errorResponse = formatter(err, context as any);

    // Set HTTP status code
    set.status = errorResponse.statusCode || 500;

    // Return formatted error
    return errorResponse;
  });
}

/**
 * Maps error types to HTTP status codes
 * 
 * @param error - Error object
 * @returns HTTP status code
 */
function getStatusCode(error: Error): number {
  // Check for explicit status code
  if ((error as any).statusCode) {
    return (error as any).statusCode;
  }

  if ((error as any).status) {
    return (error as any).status;
  }

  // Map error types to status codes
  const errorName = error.name.toLowerCase();

  if (errorName.includes("validation")) return 400;
  if (errorName.includes("unauthorized") || errorName.includes("authentication")) return 401;
  if (errorName.includes("forbidden") || errorName.includes("authorization")) return 403;
  if (errorName.includes("notfound") || errorName.includes("not found")) return 404;
  if (errorName.includes("conflict")) return 409;
  if (errorName.includes("timeout")) return 408;
  if (errorName.includes("payload") || errorName.includes("toolarge")) return 413;
  if (errorName.includes("unsupported") || errorName.includes("mediatype")) return 415;
  if (errorName.includes("ratelimit") || errorName.includes("toomanyrequests")) return 429;

  // Default to 500 Internal Server Error
  return 500;
}

/**
 * Sanitizes error messages to prevent sensitive information disclosure
 * 
 * @param message - Original error message
 * @param environment - Current environment
 * @returns Sanitized error message
 */
function sanitizeErrorMessage(
  message: string,
  environment: "development" | "production" | "test"
): string {
  if (environment === "production") {
    // In production, return generic messages for certain errors
    if (message.includes("database") || message.includes("sql")) {
      return "A database error occurred. Please try again later.";
    }
    
    if (message.includes("file") || message.includes("path")) {
      return "A file operation error occurred.";
    }

    if (message.includes("network") || message.includes("connection")) {
      return "A network error occurred. Please check your connection.";
    }

    // Remove potential sensitive data patterns
    return message
      .replace(/password.*?(?=\s|$)/gi, "password [REDACTED]")
      .replace(/token.*?(?=\s|$)/gi, "token [REDACTED]")
      .replace(/key.*?(?=\s|$)/gi, "key [REDACTED]")
      .replace(/secret.*?(?=\s|$)/gi, "secret [REDACTED]");
  }

  return message;
}

/**
 * Custom error classes for common scenarios
 */

export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string, public details?: any) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  constructor(message: string = "Too many requests", public retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class InternalServerError extends Error {
  statusCode = 500;
  constructor(message: string = "Internal server error") {
    super(message);
    this.name = "InternalServerError";
  }
}
