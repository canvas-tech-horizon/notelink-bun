# Security Guide - NoteLink

This document provides security best practices and guidelines for using NoteLink in production environments, aligned with ISO/IEC 25010:2023 security requirements.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation & Sanitization](#input-validation--sanitization)
3. [Security Headers](#security-headers)
4. [Rate Limiting](#rate-limiting)
5. [CORS Configuration](#cors-configuration)
6. [Error Handling](#error-handling)
7. [Logging & Monitoring](#logging--monitoring)
8. [Environment Configuration](#environment-configuration)
9. [Deployment Checklist](#deployment-checklist)

---

## Authentication & Authorization

### JWT Secret Management

**CRITICAL**: Never use the default JWT secret in production!

```typescript
import { newApiNote } from 'notelink';

// ❌ NEVER DO THIS IN PRODUCTION
const api = newApiNote(config, 'default-secret-key');

// ✅ ALWAYS use environment variables
const api = newApiNote(config, process.env.JWT_SECRET!);
```

### Generate Secure JWT Secrets

```bash
# Generate a secure random secret (32+ characters)
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### JWT Token Best Practices

```typescript
// Set appropriate expiration times
const token = await jwt.sign({
  userId: user.id,
  role: user.role,
  exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
});

// For refresh tokens, use longer expiration
const refreshToken = await jwt.sign({
  userId: user.id,
  type: 'refresh',
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
});
```

---

## Input Validation & Sanitization

NoteLink provides comprehensive validation utilities to prevent common attacks.

### Prevent XSS Attacks

```typescript
import { sanitizeHtml, sanitizeInput } from 'notelink';

api.documentedRoute({
  method: 'POST',
  path: '/comments',
  handler: async ({ body }) => {
    // Sanitize user input
    const safeComment = sanitizeHtml(body.comment);
    
    // Or use comprehensive sanitization
    const safeText = sanitizeInput(body.text, {
      trim: true,
      escapeHtml: true,
      maxLength: 500
    });
    
    // Store sanitized data
    return { comment: safeComment };
  }
});
```

### Prevent SQL/NoSQL Injection

```typescript
import { preventSqlInjection, preventNoSqlInjection } from 'notelink';

api.documentedRoute({
  method: 'GET',
  path: '/users/:id',
  handler: async ({ params }) => {
    try {
      // Validate before using in database queries
      const safeId = preventSqlInjection(params.id);
      
      // Always use parameterized queries
      const user = await db.query('SELECT * FROM users WHERE id = $1', [safeId]);
      
      return { user };
    } catch (error) {
      throw new ValidationError('Invalid user ID');
    }
  }
});
```

### Path Traversal Prevention

```typescript
import { preventPathTraversal } from 'notelink';

api.documentedRoute({
  method: 'GET',
  path: '/files/:filename',
  handler: async ({ params }) => {
    try {
      // Prevent directory traversal attacks
      const safePath = preventPathTraversal(params.filename);
      const filePath = `./uploads/${safePath}`;
      
      // Now safe to read file
      const file = await Bun.file(filePath);
      return file;
    } catch (error) {
      throw new ForbiddenError('Invalid file path');
    }
  }
});
```

### Email & URL Validation

```typescript
import { isValidEmail, isValidUrl, ValidationError } from 'notelink';

api.documentedRoute({
  method: 'POST',
  path: '/register',
  handler: async ({ body }) => {
    if (!isValidEmail(body.email)) {
      throw new ValidationError('Invalid email address');
    }
    
    if (body.website && !isValidUrl(body.website)) {
      throw new ValidationError('Invalid website URL');
    }
    
    // Safe to proceed
    return { success: true };
  }
});
```

---

## Security Headers

Configure security headers to protect against common web vulnerabilities.

```typescript
import { newApiNote } from 'notelink';

const api = newApiNote({
  title: 'Secure API',
  description: 'Production API with security headers',
  version: '1.0.0',
  
  // Enable security headers (recommended defaults)
  securityHeaders: {
    hsts: true,                          // HTTPS enforcement
    hstsMaxAge: 31536000,                // 1 year
    hstsIncludeSubdomains: true,
    hstsPreload: false,
    
    csp: true,                           // Content Security Policy
    cspDirectives: "default-src 'self'; script-src 'self' 'unsafe-inline'",
    
    frameOptions: true,                  // Clickjacking protection
    frameOptionsValue: 'DENY',
    
    contentTypeOptions: true,            // MIME sniffing protection
    xssProtection: true,                 // XSS filter
    referrerPolicy: true,
    permissionsPolicy: true,
  }
}, process.env.JWT_SECRET!);
```

### Development vs Production

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const api = newApiNote({
  title: 'My API',
  version: '1.0.0',
  
  // Disable some headers in development
  securityHeaders: isProduction ? {
    hsts: true,
    csp: true,
    // ... other production settings
  } : false,  // Disable in development
}, process.env.JWT_SECRET!);
```

---

## Rate Limiting

Protect your API from DoS/DDoS attacks and abuse.

```typescript
import { newApiNote } from 'notelink';

const api = newApiNote({
  title: 'My API',
  version: '1.0.0',
  
  // Enable rate limiting
  rateLimit: {
    max: 100,                    // 100 requests
    windowMs: 60000,             // per minute
    message: 'Too many requests',
    standardHeaders: true,       // Include rate limit headers
  }
}, process.env.JWT_SECRET!);
```

### Stricter Limits for Authentication

```typescript
import { createAuthRateLimiter } from 'notelink';

const api = newApiNote(config, process.env.JWT_SECRET!);

// Apply stricter rate limiting to auth routes
createAuthRateLimiter(api.getApp(), {
  max: 5,                        // Only 5 attempts
  windowMs: 15 * 60 * 1000,     // per 15 minutes
});
```

### Custom Rate Limiting

```typescript
import { setupRateLimit } from 'notelink';

const app = api.getApp();

// Different limits for different endpoints
setupRateLimit(app, {
  max: 10,
  windowMs: 60000,
  keyGenerator: (ctx) => {
    // Rate limit by IP + endpoint
    const ip = ctx.request.headers.get('x-forwarded-for') || 'unknown';
    return `${ip}:${ctx.path}`;
  },
  skip: (ctx) => {
    // Skip rate limiting for health checks
    return ctx.path === '/health';
  }
});
```

---

## CORS Configuration

Restrict cross-origin requests in production.

```typescript
import { newApiNote } from 'notelink';

const api = newApiNote({
  title: 'My API',
  version: '1.0.0',
  
  // Development: Allow all origins
  cors: {
    origins: '*',
    credentials: false,
  }
  
  // ✅ Production: Restrict to specific origins
  cors: {
    origins: [
      'https://app.example.com',
      'https://admin.example.com'
    ],
    credentials: true,          // Allow cookies
    methods: 'GET, POST, PUT, DELETE',
    headers: 'Content-Type, Authorization, X-API-Key',
  }
}, process.env.JWT_SECRET!);
```

### Environment-Based CORS

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

const api = newApiNote({
  title: 'My API',
  version: '1.0.0',
  cors: {
    origins: allowedOrigins,
    credentials: process.env.NODE_ENV === 'production',
  }
}, process.env.JWT_SECRET!);
```

---

## Error Handling

Prevent information leakage through error messages.

```typescript
import { newApiNote } from 'notelink';

const isProduction = process.env.NODE_ENV === 'production';

const api = newApiNote({
  title: 'My API',
  version: '1.0.0',
  
  // Configure error handler
  errorHandler: {
    includeStack: !isProduction,  // Never expose stack traces in production
    logger: (error, ctx) => {
      // Log errors securely
      console.error({
        timestamp: new Date().toISOString(),
        path: ctx.path,
        method: ctx.request.method,
        error: error.message,
        stack: error.stack,
      });
      
      // Send to monitoring service in production
      if (isProduction) {
        // monitoring.captureException(error);
      }
    }
  }
}, process.env.JWT_SECRET!);
```

### Custom Error Responses

```typescript
import { ValidationError, UnauthorizedError, ForbiddenError } from 'notelink';

api.documentedRoute({
  method: 'POST',
  path: '/protected',
  handler: async ({ request, jwt }) => {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const token = authHeader.substring(7);
    let payload;
    
    try {
      payload = await jwt.verify(token);
    } catch {
      throw new UnauthorizedError('Invalid token');
    }
    
    // Check authorization
    if (payload.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }
    
    // Validate input
    if (!request.body || typeof request.body !== 'object') {
      throw new ValidationError('Invalid request body');
    }
    
    return { success: true };
  }
});
```

---

## Logging & Monitoring

Implement comprehensive logging for security auditing.

```typescript
import { newApiNote, setupLogging, LogLevel } from 'notelink';

const api = newApiNote(config, process.env.JWT_SECRET!);

// Configure logging
setupLogging(api.getApp(), {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  logRequests: true,
  logResponses: true,
  logRequestBody: false,          // NEVER log request bodies in production (may contain passwords)
  logResponseBody: false,          // NEVER log response bodies (may contain sensitive data)
  writer: (message, level) => {
    // Send logs to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to DataDog, Loggly, Splunk, etc.
      // monitoringService.log(level, message);
    }
    console.log(message);
  }
});
```

---

## Environment Configuration

Use environment variables for all sensitive configuration.

### .env Example

```bash
# CRITICAL: Never commit this file to version control!

# Application
NODE_ENV=production
PORT=8080
API_VERSION=1.0.0

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# External Services
API_KEY=your-api-key
SMTP_PASSWORD=your-smtp-password

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=warn
```

### Loading Environment Variables

```typescript
// Load environment variables
const config = {
  title: process.env.API_TITLE || 'My API',
  version: process.env.API_VERSION || '1.0.0',
  host: `${process.env.HOST || 'localhost'}:${process.env.PORT || 8080}`,
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const api = newApiNote(config, process.env.JWT_SECRET!);
```

---

## Deployment Checklist

Before deploying to production:

### Critical Security Items

- [ ] **JWT Secret**: Use strong, unique secret (32+ characters)
- [ ] **Environment Variables**: All secrets in environment variables
- [ ] **HTTPS**: SSL/TLS certificate installed and configured
- [ ] **CORS**: Restricted to specific origins
- [ ] **Rate Limiting**: Enabled with appropriate limits
- [ ] **Security Headers**: All security headers enabled
- [ ] **Input Validation**: All user input validated and sanitized
- [ ] **Error Handling**: Stack traces disabled in production
- [ ] **Logging**: Sensitive data not logged
- [ ] **Dependencies**: All dependencies up to date

### Security Testing

- [ ] Test with OWASP ZAP or similar security scanner
- [ ] Penetration testing completed
- [ ] SQL/NoSQL injection tests passed
- [ ] XSS attack tests passed
- [ ] CSRF protection verified
- [ ] Authentication bypass tests passed
- [ ] Authorization tests passed
- [ ] Rate limiting verified
- [ ] Error handling tested

### Monitoring & Logging

- [ ] Error monitoring configured (Sentry, Rollbar, etc.)
- [ ] Performance monitoring configured
- [ ] Log aggregation configured
- [ ] Alerts configured for security events
- [ ] Health check endpoint verified
- [ ] Uptime monitoring configured

### Infrastructure

- [ ] Firewall rules configured
- [ ] Database connection secured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Scaling strategy defined
- [ ] Container security (if using Docker/Kubernetes)

### Compliance

- [ ] ISO/IEC 25010:2023 compliance verified
- [ ] OWASP Top 10 addressed
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policies implemented
- [ ] Privacy policy updated
- [ ] Terms of service updated

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Security Headers](https://securityheaders.com/)

---

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com.

**DO NOT** open a public GitHub issue for security vulnerabilities.

---

*Last updated: February 15, 2026*
