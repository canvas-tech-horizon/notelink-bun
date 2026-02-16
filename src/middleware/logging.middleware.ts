/**
 * Logging Middleware and Utilities
 * 
 * Provides comprehensive logging capabilities for API requests, responses, and errors.
 * Supports multiple log levels and formats for development and production use.
 * 
 * Compliance:
 * - ISO/IEC 25010:2023 Maintainability.Analyzability
 * - OWASP Security Logging and Monitoring
 */

import type { Elysia, Context } from "elysia";

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logging Configuration Options
 */
export interface LoggingOptions {
  /** Minimum log level to output (default: INFO) */
  level?: LogLevel;
  /** Enable colorized output (default: true) */
  colors?: boolean;
  /** Include timestamp in logs (default: true) */
  timestamp?: boolean;
  /** Log request method and path (default: true) */
  logRequests?: boolean;
  /** Log response status and time (default: true) */
  logResponses?: boolean;
  /** Log request body (default: false, security risk) */
  logRequestBody?: boolean;
  /** Log response body (default: false, may contain sensitive data) */
  logResponseBody?: boolean;
  /** Custom log formatter function */
  formatter?: (log: LogEntry) => string;
  /** Custom log writer function (default: console.log/error) */
  writer?: (message: string, level: LogLevel) => void;
}

/**
 * Log Entry Structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  requestBody?: any;
  responseBody?: any;
  error?: Error;
}

/**
 * ANSI color codes for terminal output
 */
const Colors = {
  reset: '\x1b[0m',
  debug: '\x1b[36m',    // Cyan
  info: '\x1b[32m',     // Green
  warn: '\x1b[33m',     // Yellow
  error: '\x1b[31m',    // Red
  gray: '\x1b[90m',     // Gray
  bold: '\x1b[1m',
};

/**
 * Logger class for structured logging
 */
export class Logger {
  private options: Required<LoggingOptions>;

  constructor(options: LoggingOptions = {}) {
    this.options = {
      level: options.level ?? LogLevel.INFO,
      colors: options.colors ?? true,
      timestamp: options.timestamp ?? true,
      logRequests: options.logRequests ?? true,
      logResponses: options.logResponses ?? true,
      logRequestBody: options.logRequestBody ?? false,
      logResponseBody: options.logResponseBody ?? false,
      formatter: options.formatter ?? this.defaultFormatter.bind(this),
      writer: options.writer ?? this.defaultWriter.bind(this),
    };
  }

  /**
   * Default log formatter
   */
  private defaultFormatter(entry: LogEntry): string {
    const parts: string[] = [];
    const useColors = this.options.colors;

    // Timestamp
    if (this.options.timestamp) {
      const timestamp = entry.timestamp.toISOString();
      parts.push(useColors ? `${Colors.gray}${timestamp}${Colors.reset}` : timestamp);
    }

    // Log level
    const levelStr = LogLevel[entry.level];
    const levelColor = useColors ? this.getLevelColor(entry.level) : '';
    const resetColor = useColors ? Colors.reset : '';
    parts.push(`${levelColor}[${levelStr}]${resetColor}`);

    // Request info
    if (entry.method && entry.path) {
      parts.push(`${entry.method} ${entry.path}`);
    }

    // Status code
    if (entry.statusCode !== undefined) {
      const statusColor = useColors ? this.getStatusColor(entry.statusCode) : '';
      parts.push(`${statusColor}${entry.statusCode}${resetColor}`);
    }

    // Duration
    if (entry.duration !== undefined) {
      parts.push(`${entry.duration}ms`);
    }

    // IP address
    if (entry.ip) {
      parts.push(`from ${entry.ip}`);
    }

    // Message
    parts.push(entry.message);

    // Error details
    if (entry.error) {
      parts.push(`\n  Error: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\n  Stack: ${entry.error.stack}`);
      }
    }

    // Request/Response bodies (if enabled)
    if (entry.requestBody && this.options.logRequestBody) {
      parts.push(`\n  Request: ${JSON.stringify(entry.requestBody, null, 2)}`);
    }

    if (entry.responseBody && this.options.logResponseBody) {
      parts.push(`\n  Response: ${JSON.stringify(entry.responseBody, null, 2)}`);
    }

    return parts.join(' ');
  }

  /**
   * Default log writer
   */
  private defaultWriter(message: string, level: LogLevel): void {
    if (level >= LogLevel.ERROR) {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Get color for log level
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return Colors.debug;
      case LogLevel.INFO: return Colors.info;
      case LogLevel.WARN: return Colors.warn;
      case LogLevel.ERROR: return Colors.error;
      default: return Colors.reset;
    }
  }

  /**
   * Get color for HTTP status code
   */
  private getStatusColor(statusCode: number): string {
    if (statusCode >= 500) return Colors.error;
    if (statusCode >= 400) return Colors.warn;
    if (statusCode >= 300) return Colors.info;
    if (statusCode >= 200) return Colors.info;
    return Colors.reset;
  }

  /**
   * Log a message
   */
  public log(entry: Partial<LogEntry>): void {
    const level = entry.level ?? LogLevel.INFO;
    
    // Skip if below minimum level
    if (level < this.options.level) {
      return;
    }

    const fullEntry: LogEntry = {
      level,
      message: entry.message || '',
      timestamp: entry.timestamp || new Date(),
      ...entry,
    };

    const formatted = this.options.formatter(fullEntry);
    this.options.writer(formatted, level);
  }

  /**
   * Log debug message
   */
  public debug(message: string, meta?: Partial<LogEntry>): void {
    this.log({ level: LogLevel.DEBUG, message, ...meta });
  }

  /**
   * Log info message
   */
  public info(message: string, meta?: Partial<LogEntry>): void {
    this.log({ level: LogLevel.INFO, message, ...meta });
  }

  /**
   * Log warning message
   */
  public warn(message: string, meta?: Partial<LogEntry>): void {
    this.log({ level: LogLevel.WARN, message, ...meta });
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, meta?: Partial<LogEntry>): void {
    this.log({ level: LogLevel.ERROR, message, error, ...meta });
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Get the global logger instance
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

/**
 * Configure the global logger
 */
export function configureLogger(options: LoggingOptions): void {
  globalLogger = new Logger(options);
}

/**
 * Configures logging middleware for the Elysia application
 * 
 * This middleware logs all incoming requests and outgoing responses, providing
 * valuable information for debugging, monitoring, and auditing.
 * 
 * Features:
 * - Request logging (method, path, IP, user agent)
 * - Response logging (status code, duration)
 * - Configurable log levels
 * - Colorized output for better readability
 * - Custom formatters and writers
 * - Request/response body logging (opt-in)
 * 
 * Security Considerations:
 * - Request/response body logging is disabled by default (may contain sensitive data)
 * - Sanitize logs to prevent information leakage
 * - Consider log retention policies
 * - Protect log files from unauthorized access
 * 
 * Compliance:
 * - ISO/IEC 25010:2023 Maintainability requirements
 * - OWASP Security Logging and Monitoring
 * - GDPR compliance (be careful with PII in logs)
 * 
 * @param app - The Elysia application instance to configure
 * @param options - Logging configuration options
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupLogging, LogLevel } from './middleware/logging.middleware';
 * 
 * const app = new Elysia();
 * 
 * // Default logging
 * setupLogging(app);
 * 
 * // Custom configuration
 * setupLogging(app, {
 *   level: LogLevel.DEBUG,
 *   colors: true,
 *   logRequestBody: process.env.NODE_ENV === 'development',
 *   logResponseBody: false
 * });
 * 
 * // Production logging with external service
 * setupLogging(app, {
 *   level: LogLevel.WARN,
 *   writer: (message, level) => {
 *     // Send to logging service (DataDog, Loggly, etc.)
 *     loggingService.log(level, message);
 *   }
 * });
 * ```
 */
export function setupLogging(
  app: Elysia,
  options: LoggingOptions = {}
): void {
  const logger = new Logger(options);

  // Store start time for each request
  const requestStartTimes = new Map<any, number>();

  // Log incoming requests
  if (options.logRequests ?? true) {
    app.onBeforeHandle(({ request, ...ctx }) => {
      const context = { request, ...ctx } as Context;
      
      // Store request start time
      requestStartTimes.set(request, Date.now());

      const method = request.method;
      const path = context.path || new URL(request.url).pathname;
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      logger.info('Incoming request', {
        method,
        path,
        ip,
        userAgent,
        requestBody: options.logRequestBody ? (context as any).body : undefined,
      });
    });
  }

  // Log outgoing responses
  if (options.logResponses ?? true) {
    app.onAfterHandle(({ request, response, set }) => {
      const startTime = requestStartTimes.get(request);
      const duration = startTime ? Date.now() - startTime : undefined;
      
      // Clean up
      requestStartTimes.delete(request);

      const method = request.method;
      const path = new URL(request.url).pathname;
      const statusCode = set.status || 200;

      logger.info('Response sent', {
        method,
        path,
        statusCode: Number(statusCode) || 200,
        duration,
        responseBody: options.logResponseBody ? response : undefined,
      });
    });
  }
}
