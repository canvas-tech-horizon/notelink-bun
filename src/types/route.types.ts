import type { Context } from "elysia";
import type { Parameter } from "./parameter.types";
import type { ResponseDefinition } from "./response.types";

/**
 * Input for documenting a route
 */
export interface DocumentedRouteInput<T = any, U = any> {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  path: string;
  description?: string;
  summary?: string;
  responses?: Record<string, string | ResponseDefinition>;
  handler: (context: Context) => Promise<any> | any;
  params?: Parameter[];
  schemasRequest?: T;
  schemasResponse?: U;
  tags?: string[];
  requiresAuth?: boolean;
}
