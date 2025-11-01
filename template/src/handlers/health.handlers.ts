/**
 * Health Check Handlers Module
 * Contains all health check request handlers
 */

/**
 * Health check handler
 */
export const healthCheck = () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
});
