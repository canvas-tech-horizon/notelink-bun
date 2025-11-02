import { Elysia, type Context } from "elysia";
import type { Config } from "../types/config.types";
import type { DocumentedRouteInput } from "../types/route.types";
import { setupJwtMiddleware, setupCorsMiddleware } from "../middleware";
import { setupOpenAPI } from "../utils";
import { buildRouteSchema, wrapHandler } from "./route-handler";

/**
 * Main ApiNote class for creating documented APIs
 */
export class ApiNote {
  private app: Elysia;
  private config: Config;
  private jwtSecret: string;
  private routes: DocumentedRouteInput[] = [];

  constructor(config: Config, jwtSecret: string = "default-secret-key") {
    this.config = {
      ...config,
      host: config.host || "localhost",
      basePath: config.basePath || "/",
    };
    this.jwtSecret = jwtSecret;
    this.app = new Elysia();

    this.setupMiddleware();
    setupOpenAPI(this.app, this.config);
  }

  /**
   * Set up middleware
   */
  private setupMiddleware() {
    setupJwtMiddleware(this.app, this.jwtSecret);
    setupCorsMiddleware(this.app);

    // Apply custom middleware if provided
    if (this.config.customMiddleware && this.config.customMiddleware.length > 0) {
      for (const middleware of this.config.customMiddleware) {
        middleware(this.app);
      }
    }
  }

  /**
   * Document and register a route
   */
  public documentedRoute(input: DocumentedRouteInput): ApiNote {
    this.routes.push(input);

    const fullPath = `${this.config.basePath}${input.path}`.replace(
      /\/\//g,
      "/",
    );
    const method = input.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "options"
      | "head";

    const schema = buildRouteSchema(input);
    const wrappedHandler = wrapHandler(input);

    // Register route based on method
    switch (method) {
      case "get":
        this.app.get(fullPath, wrappedHandler, schema);
        break;
      case "post":
        this.app.post(fullPath, wrappedHandler, schema);
        break;
      case "put":
        this.app.put(fullPath, wrappedHandler, schema);
        break;
      case "delete":
        this.app.delete(fullPath, wrappedHandler, schema);
        break;
      case "patch":
        this.app.patch(fullPath, wrappedHandler, schema);
        break;
      case "options":
        this.app.options(fullPath, wrappedHandler, schema);
        break;
      case "head":
        this.app.head(fullPath, wrappedHandler, schema);
        break;
    }

    return this;
  }

  /**
   * Add a custom route without documentation
   */
  public route(
    method: DocumentedRouteInput["method"],
    path: string,
    handler: (context: Context) => any,
  ) {
    const fullPath = `${this.config.basePath}${path}`.replace(/\/\//g, "/");
    const methodLower = method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "options"
      | "head";

    switch (methodLower) {
      case "get":
        this.app.get(fullPath, handler);
        break;
      case "post":
        this.app.post(fullPath, handler);
        break;
      case "put":
        this.app.put(fullPath, handler);
        break;
      case "delete":
        this.app.delete(fullPath, handler);
        break;
      case "patch":
        this.app.patch(fullPath, handler);
        break;
      case "options":
        this.app.options(fullPath, handler);
        break;
      case "head":
        this.app.head(fullPath, handler);
        break;
    }

    return this;
  }

  /**
   * Get all registered routes
   */
  public getRoutes(): DocumentedRouteInput[] {
    return this.routes;
  }

  /**
   * Get the underlying Elysia app instance
   */
  public getApp(): Elysia {
    return this.app;
  }

  /**
   * Start the server
   */
  public listen(port?: number): Promise<void> {
    const hostParts = (this.config.host || 'localhost').split(':');
    const hostPortNum = hostParts.length > 1 && hostParts[1] ? parseInt(hostParts[1], 10) : undefined;
    const listenPort = hostPortNum ?? port ?? 8080;

    return new Promise((resolve, reject) => {
      try {
        this.app.onError(({ code, error, request }) => {
          console.error('[onError]', code, request.method, request.url, error)
          const message = error instanceof Error ? error.message : String(error);
          return new Response(JSON.stringify({ code, message }), { status: 400 })
        });
        this.app.listen(listenPort, () => {
          console.log('🚀 Server is Running - Network Information');
          console.log('');
          console.log(`📡 Host:  http://${this.config.host}`);

          // print ip addresses of the machine and ports (Wi-Fi and Ethernet only)
          const os = require("os");
          const networkInterfaces = os.networkInterfaces();
          const foundInterfaces: string[] = [];

          for (const name of Object.keys(networkInterfaces)) {
            const nameLower = name.toLowerCase();
            // Only show Wi-Fi and Ethernet interfaces
            if (nameLower.includes('wi-fi') || nameLower.includes('ethernet') ||
              nameLower.includes('wifi') || nameLower.includes('eth')) {
              const ifaceList = networkInterfaces[name] || [];
              for (const iface of ifaceList) {
                if (iface.family === 'IPv4' && !iface.internal) {
                  foundInterfaces.push(`🌍 ${name + ":".padEnd(1)} http://${iface.address}:${listenPort}`);
                }
              }
            }
          }

          if (foundInterfaces.length > 0) {
            foundInterfaces.forEach(iface => console.log(iface));
          }

          console.log('');
          console.log('📚 API Documentation: /doc-api');

          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   */
  public stop(): void {
    this.app.stop();
  }
}
