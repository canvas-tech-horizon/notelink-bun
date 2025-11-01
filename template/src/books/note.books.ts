/**
 * Routes Index
 * Central registration point for all API routes
 */

import { registerUserRoutes } from "@/routes/users.routes";
import { registerAuthRoutes } from "@/routes/auth.routes";
import { registerHealthRoutes } from "@/routes/health.routes";
import type { ApiNote } from "@/types/api.types";

/**
 * Register all routes with the API instance
 */
export function registerAllRoutes(api: ApiNote) {
  // Register health check routes (no authentication required)
  registerHealthRoutes(api);
  
  // Register user management routes
  registerUserRoutes(api);
  
  // Register authentication routes
  registerAuthRoutes(api);
}
