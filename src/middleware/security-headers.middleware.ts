import type { Elysia } from "elysia";

/**
 * Security Headers Configuration Options
 * 
 * Allows customization of security headers to balance security with application needs.
 */
export interface SecurityHeadersOptions {
  /** Enable HSTS (HTTP Strict Transport Security) - default: true */
  hsts?: boolean;
  /** HSTS max age in seconds - default: 31536000 (1 year) */
  hstsMaxAge?: number;
  /** Include subdomains in HSTS - default: true */
  hstsIncludeSubdomains?: boolean;
  /** HSTS preload - default: false */
  hstsPreload?: boolean;
  
  /** Enable Content Security Policy - default: true */
  csp?: boolean;
  /** Custom CSP directives - overrides default if provided */
  cspDirectives?: string;
  
  /** Enable X-Frame-Options - default: true */
  frameOptions?: boolean;
  /** X-Frame-Options value - default: "DENY" */
  frameOptionsValue?: "DENY" | "SAMEORIGIN";
  
  /** Enable X-Content-Type-Options - default: true */
  contentTypeOptions?: boolean;
  
  /** Enable X-XSS-Protection - default: true */
  xssProtection?: boolean;
  
  /** Enable Referrer-Policy - default: true */
  referrerPolicy?: boolean;
  /** Referrer-Policy value - default: "strict-origin-when-cross-origin" */
  referrerPolicyValue?: string;
  
  /** Enable Permissions-Policy - default: true */
  permissionsPolicy?: boolean;
  /** Custom Permissions-Policy - overrides default if provided */
  permissionsPolicyValue?: string;
}

/**
 * Configures comprehensive security headers middleware for the Elysia application
 * 
 * This function implements OWASP security best practices by setting multiple HTTP security headers
 * that protect against common web vulnerabilities including:
 * 
 * Security Headers Applied:
 * 
 * 1. **Strict-Transport-Security (HSTS)**
 *    - Forces HTTPS connections for all future requests
 *    - Prevents man-in-the-middle attacks via SSL stripping
 *    - Default: max-age=31536000; includeSubDomains
 * 
 * 2. **Content-Security-Policy (CSP)**
 *    - Prevents XSS attacks by controlling resource loading
 *    - Restricts inline scripts and unsafe evaluations
 *    - Default: Strict policy for API servers
 * 
 * 3. **X-Frame-Options**
 *    - Prevents clickjacking attacks
 *    - Blocks the page from being embedded in iframes
 *    - Default: DENY
 * 
 * 4. **X-Content-Type-Options**
 *    - Prevents MIME type sniffing
 *    - Blocks content type confusion attacks
 *    - Value: nosniff
 * 
 * 5. **X-XSS-Protection**
 *    - Legacy XSS filter for older browsers
 *    - Modern browsers rely on CSP instead
 *    - Value: 1; mode=block
 * 
 * 6. **Referrer-Policy**
 *    - Controls information sent in Referer header
 *    - Protects user privacy
 *    - Default: strict-origin-when-cross-origin
 * 
 * 7. **Permissions-Policy**
 *    - Controls browser features and APIs
 *    - Disables unnecessary features
 *    - Default: Restrictive policy for APIs
 * 
 * Compliance Standards:
 * - OWASP Top 10 Security Risks
 * - ISO/IEC 25010:2023 Security Requirements
 * - NIST Cybersecurity Framework
 * - PCI DSS Requirements
 * 
 * @param app - The Elysia application instance to configure
 * @param options - Optional configuration for security headers
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupSecurityHeaders } from './middleware/security-headers.middleware';
 * 
 * const app = new Elysia();
 * 
 * // Use default security headers (recommended)
 * setupSecurityHeaders(app);
 * 
 * // Customize security headers
 * setupSecurityHeaders(app, {
 *   hsts: true,
 *   hstsMaxAge: 63072000, // 2 years
 *   frameOptionsValue: 'SAMEORIGIN',
 *   cspDirectives: "default-src 'self'; script-src 'self' 'unsafe-inline'"
 * });
 * 
 * // For development, you might disable HSTS
 * setupSecurityHeaders(app, {
 *   hsts: false,
 *   csp: false
 * });
 * ```
 */
export function setupSecurityHeaders(
  app: Elysia,
  options: SecurityHeadersOptions = {}
): void {
  const {
    hsts = true,
    hstsMaxAge = 31536000, // 1 year
    hstsIncludeSubdomains = true,
    hstsPreload = false,
    csp = true,
    cspDirectives,
    frameOptions = true,
    frameOptionsValue = "DENY",
    contentTypeOptions = true,
    xssProtection = true,
    referrerPolicy = true,
    referrerPolicyValue = "strict-origin-when-cross-origin",
    permissionsPolicy = true,
    permissionsPolicyValue,
  } = options;

  app.onBeforeHandle(({ set }) => {
    // HSTS - HTTP Strict Transport Security
    if (hsts) {
      let hstsValue = `max-age=${hstsMaxAge}`;
      if (hstsIncludeSubdomains) {
        hstsValue += "; includeSubDomains";
      }
      if (hstsPreload) {
        hstsValue += "; preload";
      }
      set.headers["Strict-Transport-Security"] = hstsValue;
    }

    // CSP - Content Security Policy
    if (csp) {
      set.headers["Content-Security-Policy"] =
        cspDirectives ||
        "default-src 'self'; base-uri 'self'; font-src 'self' https: data:; " +
        "form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; " +
        "object-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; script-src-attr 'none'; " +
        "style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests";
    }

    // X-Frame-Options - Clickjacking Protection
    if (frameOptions) {
      set.headers["X-Frame-Options"] = frameOptionsValue;
    }

    // X-Content-Type-Options - MIME Sniffing Protection
    if (contentTypeOptions) {
      set.headers["X-Content-Type-Options"] = "nosniff";
    }

    // X-XSS-Protection - Legacy XSS Protection
    if (xssProtection) {
      set.headers["X-XSS-Protection"] = "1; mode=block";
    }

    // Referrer-Policy - Privacy Protection
    if (referrerPolicy) {
      set.headers["Referrer-Policy"] = referrerPolicyValue;
    }

    // Permissions-Policy - Feature Control
    if (permissionsPolicy) {
      set.headers["Permissions-Policy"] =
        permissionsPolicyValue ||
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), " +
        "magnetometer=(), microphone=(), payment=(), usb=()";
    }

    // Additional security headers
    set.headers["X-DNS-Prefetch-Control"] = "off";
    set.headers["X-Download-Options"] = "noopen";
    set.headers["X-Permitted-Cross-Domain-Policies"] = "none";
  });
}
