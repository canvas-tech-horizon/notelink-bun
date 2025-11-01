import { openapi } from "@elysiajs/openapi";
import type { Elysia } from "elysia";
import type { Config } from "../types/config.types";

/**
 * Set up OpenAPI documentation
 */
export function setupOpenAPI(app: Elysia, config: Config): void {
  app.use(
    openapi({
      path: "/doc-api",
      documentation: {
        info: {
          title: config.title,
          description: config.description,
          version: config.version,
        },
        servers: [
          {
            url: `http://${config.host}`,
            description: "Development server",
          },
        ],
        tags: [],
      },
      scalar: {
        showToolbar: "never",
        theme: "mars",
        url: "doc-api/json",
        hideClientButton: true,
        customCss: `
          :root {
            --scalar-font: ui-sans-serif, system-ui;
            --scalar-radius: 14px;
            --scalar-primary: 265 84% 54%; /* h s l */
          }
          [data-theme="dark"] {
            --scalar-background-1: 230 15% 10%;
            --scalar-text-1: 0 0% 98%;
          }
        `,
      },
    }),
  );
}
