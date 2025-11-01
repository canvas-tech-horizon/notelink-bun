import type { CustomMiddleware } from "notelink";
import { 
  setupLoggingMiddleware, 
  setupRateLimitMiddleware, 
  setupRequestIdMiddleware 
} from "@/middleware";

/**
 * API Configuration
 */
export const apiConfig = {
  title: process.env.API_TITLE || "Sample API",
  description: process.env.API_DESCRIPTION || "A sample API with documentation",
  version: process.env.API_VERSION || "1.0.0",
  host: `${process.env.HOST || "localhost"}:${process.env.PORT || "8080"}`,
  basePath: process.env.API_BASE_PATH || "/api",
  // Custom middleware array - add your custom middleware here
  customMiddleware: [
    setupLoggingMiddleware,
    setupRequestIdMiddleware,
    setupRateLimitMiddleware(100, 60000),
  ] as CustomMiddleware[],
};

/**
 * Get JWT secret from environment or use default
 */
export const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || "my-secret-key";
};
