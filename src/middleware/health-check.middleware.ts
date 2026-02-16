import type { Elysia } from "elysia";

/**
 * Health Check Configuration Options
 */
export interface HealthCheckOptions {
  /** Custom health check path (default: /health) */
  path?: string;
  /** Include detailed system information (default: false) */
  includeDetails?: boolean;
  /** Custom health check functions */
  checks?: Array<{
    name: string;
    check: () => Promise<boolean> | boolean;
  }>;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  details?: {
    memory?: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    checks?: Record<string, {
      status: "pass" | "fail";
      timestamp: string;
    }>;
  };
}

/**
 * Configures health check endpoint for the Elysia application
 * 
 * This middleware provides a standardized health check endpoint for monitoring,
 * load balancers, and orchestration systems like Kubernetes.
 * 
 * Features:
 * - Basic availability check
 * - Optional detailed system metrics
 * - Custom health check functions
 * - Standard response format
 * - Uptime tracking
 * - Memory usage reporting
 * 
 * Use Cases:
 * - Load balancer health checks
 * - Kubernetes liveness/readiness probes
 * - Monitoring systems (Prometheus, Datadog, etc.)
 * - Service mesh health endpoints
 * - Uptime monitoring
 * 
 * Response Format (RFC 9457 Problem Details):
 * - status: Overall health status
 * - timestamp: Current server time (ISO 8601)
 * - uptime: Seconds since server started
 * - details: Optional detailed metrics
 * 
 * Compliance:
 * - ISO/IEC 25010:2023 Reliability.Availability
 * - RFC 9457 Problem Details for HTTP APIs
 * - Health Check Response Format for HTTP APIs (draft-inadarei-api-health-check)
 * 
 * @param app - The Elysia application instance to configure
 * @param options - Health check configuration options
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupHealthCheck } from './middleware/health-check.middleware';
 * 
 * const app = new Elysia();
 * 
 * // Basic health check
 * setupHealthCheck(app);
 * // GET /health -> { status: "healthy", timestamp: "...", uptime: 123 }
 * 
 * // Custom path and detailed metrics
 * setupHealthCheck(app, {
 *   path: '/api/health',
 *   includeDetails: true
 * });
 * 
 * // With custom health checks
 * setupHealthCheck(app, {
 *   path: '/health',
 *   includeDetails: true,
 *   checks: [
 *     {
 *       name: 'database',
 *       check: async () => {
 *         try {
 *           await db.ping();
 *           return true;
 *         } catch {
 *           return false;
 *         }
 *       }
 *     },
 *     {
 *       name: 'redis',
 *       check: async () => {
 *         try {
 *           await redis.ping();
 *           return true;
 *         } catch {
 *           return false;
 *         }
 *       }
 *     }
 *   ]
 * });
 * ```
 */
export function setupHealthCheck(
  app: Elysia,
  options: HealthCheckOptions = {}
): void {
  const {
    path = "/health",
    includeDetails = false,
    checks = [],
  } = options;

  const startTime = Date.now();

  app.get(
    path,
    async ({ set }) => {
      const response: HealthCheckResponse = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
      };

      // Run custom health checks
      if (checks.length > 0 || includeDetails) {
        response.details = {};

        // Run custom checks
        if (checks.length > 0) {
          response.details.checks = {};
          
          for (const healthCheck of checks) {
            try {
              const result = await healthCheck.check();
              response.details.checks[healthCheck.name] = {
                status: result ? "pass" : "fail",
                timestamp: new Date().toISOString(),
              };

              // If any check fails, mark as degraded
              if (!result) {
                response.status = "degraded";
              }
            } catch (error) {
              response.details.checks[healthCheck.name] = {
                status: "fail",
                timestamp: new Date().toISOString(),
              };
              response.status = "degraded";
            }
          }
        }

        // Include memory metrics if requested
        if (includeDetails) {
          const memUsage = process.memoryUsage();
          response.details.memory = {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          };
        }
      }

      // Set appropriate HTTP status code
      if (response.status === "healthy") {
        set.status = 200;
      } else if (response.status === "degraded") {
        set.status = 200; // Still return 200 for degraded (service is up)
      } else {
        set.status = 503; // Service Unavailable
      }

      return response;
    },
    {
      detail: {
        summary: "Health check endpoint",
        description: "Returns the health status of the API service",
        tags: ["System"],
        responses: {
          "200": {
            description: "Service is healthy",
          },
          "503": {
            description: "Service is unhealthy",
          },
        },
      },
    }
  );
}

/**
 * Creates a readiness check endpoint (Kubernetes readiness probe)
 * 
 * Readiness checks determine if the service is ready to accept traffic.
 * Unlike liveness checks, failing readiness removes the pod from the load balancer
 * but doesn't restart it.
 * 
 * @param app - The Elysia application instance
 * @param checks - Array of checks that must pass for the service to be ready
 * 
 * @example
 * ```typescript
 * setupReadinessCheck(app, [
 *   {
 *     name: 'database',
 *     check: async () => await db.ping()
 *   }
 * ]);
 * ```
 */
export function setupReadinessCheck(
  app: Elysia,
  checks: Array<{
    name: string;
    check: () => Promise<boolean> | boolean;
  }> = []
): void {
  app.get(
    "/ready",
    async ({ set }) => {
      for (const healthCheck of checks) {
        try {
          const result = await healthCheck.check();
          if (!result) {
            set.status = 503;
            return {
              status: "not ready",
              reason: `Check '${healthCheck.name}' failed`,
              timestamp: new Date().toISOString(),
            };
          }
        } catch (error) {
          set.status = 503;
          return {
            status: "not ready",
            reason: `Check '${healthCheck.name}' threw error`,
            timestamp: new Date().toISOString(),
          };
        }
      }

      set.status = 200;
      return {
        status: "ready",
        timestamp: new Date().toISOString(),
      };
    },
    {
      detail: {
        summary: "Readiness check endpoint",
        description: "Returns whether the service is ready to accept traffic",
        tags: ["System"],
        hide: true, // Hide from main API documentation
      },
    }
  );
}

/**
 * Creates a liveness check endpoint (Kubernetes liveness probe)
 * 
 * Liveness checks determine if the service is alive.
 * Failing liveness causes the container to restart.
 * 
 * @param app - The Elysia application instance
 * 
 * @example
 * ```typescript
 * setupLivenessCheck(app);
 * ```
 */
export function setupLivenessCheck(app: Elysia): void {
  app.get(
    "/alive",
    ({ set }) => {
      set.status = 200;
      return {
        status: "alive",
        timestamp: new Date().toISOString(),
      };
    },
    {
      detail: {
        summary: "Liveness check endpoint",
        description: "Returns whether the service is alive",
        tags: ["System"],
        hide: true, // Hide from main API documentation
      },
    }
  );
}
