import type { Context } from "elysia";

// Export core classes
export { ApiNote } from "./core";

// Export types
export type {
  Config,
  CustomMiddleware,
  Parameter,
  ResponseDefinition,
  DocumentedRouteInput,
} from "./types";

// Export Context type from Elysia
export type { Context };

/**
 * Factory function to create a new ApiNote instance
 */
import { ApiNote } from "./core";
import type { Config } from "./types";

export function newApiNote(config: Config, jwtSecret?: string): ApiNote {
  return new ApiNote(config, jwtSecret);
}

/**
 * Default export
 */
export default ApiNote;
