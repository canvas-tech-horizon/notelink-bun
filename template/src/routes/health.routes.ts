import { healthCheck } from "@/handlers/health.handlers";
import type { ApiNote } from "@/types/api.types";

/**
 * Health Check Routes Module
 * Contains system health and status check endpoints
 */

/**
 * Register all health check routes with the API
 */
export function registerHealthRoutes(api: ApiNote) {
    // Add a health check route
    api.route("GET", "/health", healthCheck);
}
