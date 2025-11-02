# NoteLink - API Documentation Library for Bun & ElysiaJS

A powerful and easy-to-use library for creating well-documented REST APIs with Bun and ElysiaJS. Automatically generate OpenAPI documentation for your endpoints with type safety and JWT authentication support.

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

The fastest way to get started is to create a new project using create-notelink:

```bash
# Using bunx (recommended)
bunx create-notelink my-app

# Or using bun create
bun create notelink my-app

cd my-app
bun install
bun dev
```

Your API will be running at `http://localhost:8080` with documentation at `http://localhost:8080/doc-api`

> **Note:** The `create-notelink` CLI tool is now in a separate repository: [create-notelink](https://github.com/canvas-tech-horizon/create-notelink)

### Add to Existing Project

```bash
bun add notelink
```

### Built-in Examples

The library includes several ready-to-use middleware examples:
- **Logging Middleware** - Log all requests and responses
- **Rate Limiting** - Limit requests per IP address
- **Request ID** - Track requests with unique IDs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Credits

Inspired by the Go notelink library for Fiber framework.

Special thanks to:
- [ElysiaJS](https://elysiajs.com/) - Fast and friendly Bun web framework
- [Scalar](https://scalar.com/) - Beautiful API documentation

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Bun ElysiaJS and Scalar**