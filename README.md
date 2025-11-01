# NoteLink - API Documentation Library for Bun & ElysiaJS

A powerful and easy-to-use library for creating well-documented REST APIs with Bun and ElysiaJS. Automatically generate Swagger/OpenAPI documentation for your endpoints with type safety and JWT authentication support.

## Features

- 🚀 **Built for Bun** - Optimized for the fastest JavaScript runtime
- 📚 **Auto-generated Documentation** - Swagger UI out of the box
- 🔒 **JWT Authentication** - Built-in JWT support with @elysiajs/jwt
- 📝 **TypeScript First** - Full type safety and IntelliSense support
- 🎯 **Simple API** - Clean and intuitive interface
- ⚡ **Fast & Lightweight** - Minimal overhead, maximum performance
- 🔧 **Flexible Configuration** - Customize to your needs
- 🛠️ **Custom Middleware** - Easy integration of custom middleware functions

## Installation

### Quick Start - Create a New Project

The fastest way to get started is to create a new project with the CLI:

```bash
bun create notelink my-app
cd my-app
bun install
bun dev
```

Your API will be running at `http://localhost:8080` with documentation at `http://localhost:8080/swagger`!

### Add to Existing Project

```bash
bun add @notelink
```

## Custom Middleware

NoteLink now supports custom middleware! You can easily add your own middleware functions to extend functionality.

### Quick Example

```typescript
import { newApiNote, type CustomMiddleware } from "notelink";
import type { Elysia } from "elysia";

// Create a custom middleware
function loggingMiddleware(app: Elysia): void {
  app.onBeforeHandle(({ request }) => {
    console.log(`${request.method} ${new URL(request.url).pathname}`);
  });
}

// Use it in your config
const api = newApiNote({
  title: "My API",
  description: "API with custom middleware",
  version: "1.0.0",
  customMiddleware: [loggingMiddleware]
});
```

### Built-in Examples

The library includes several ready-to-use middleware examples:
- **Logging Middleware** - Log all requests and responses
- **Rate Limiting** - Limit requests per IP address
- **Request ID** - Track requests with unique IDs

For complete documentation on creating and using custom middleware, see [CUSTOM-MIDDLEWARE.md](./CUSTOM-MIDDLEWARE.md).

## Documentation

- [Custom Middleware Guide](./CUSTOM-MIDDLEWARE.md) - Learn how to create and use custom middleware

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Credits

Inspired by the Go notelink library for Fiber framework.

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Bun and ElysiaJS**