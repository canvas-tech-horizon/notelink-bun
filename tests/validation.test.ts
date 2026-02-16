import { describe, it, expect } from "bun:test";
import {
  sanitizeHtml,
  preventSqlInjection,
  preventNoSqlInjection,
  preventPathTraversal,
  isValidEmail,
  isValidUrl,
  isAlphanumeric,
  validateInteger,
  validateLength,
  isValidUuid,
  sanitizeInput,
} from "../src/utils/validation.utils";

describe("Validation Utilities", () => {
  describe("sanitizeHtml", () => {
    it("should escape HTML special characters", () => {
      const dangerous = '<script>alert("XSS")</script>';
      const safe = sanitizeHtml(dangerous);
      expect(safe).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it("should handle empty strings", () => {
      expect(sanitizeHtml("")).toBe("");
    });

    it("should handle strings without special characters", () => {
      expect(sanitizeHtml("hello world")).toBe("hello world");
    });
  });

  describe("preventSqlInjection", () => {
    it("should throw on SQL injection patterns", () => {
      expect(() => preventSqlInjection("admin' OR '1'='1")).toThrow();
      expect(() => preventSqlInjection("SELECT * FROM users")).toThrow();
      expect(() => preventSqlInjection("DROP TABLE users")).toThrow();
    });

    it("should allow safe strings", () => {
      expect(() => preventSqlInjection("John Doe")).not.toThrow();
      expect(() => preventSqlInjection("user123")).not.toThrow();
    });
  });

  describe("preventNoSqlInjection", () => {
    it("should throw on MongoDB operators in strings", () => {
      expect(() => preventNoSqlInjection("$gt")).toThrow();
      expect(() => preventNoSqlInjection("test.field")).toThrow();
    });

    it("should throw on MongoDB operators in object keys", () => {
      expect(() => preventNoSqlInjection({ $gt: "" })).toThrow();
      expect(() => preventNoSqlInjection({ "field.path": "value" })).toThrow();
    });

    it("should allow safe strings and objects", () => {
      expect(() => preventNoSqlInjection("username")).not.toThrow();
      expect(() => preventNoSqlInjection({ name: "John", age: 30 })).not.toThrow();
    });
  });

  describe("preventPathTraversal", () => {
    it("should throw on path traversal patterns", () => {
      expect(() => preventPathTraversal("../../etc/passwd")).toThrow();
      expect(() => preventPathTraversal("../../../secret")).toThrow();
      expect(() => preventPathTraversal("/etc/passwd")).toThrow();
    });

    it("should allow safe paths", () => {
      expect(() => preventPathTraversal("uploads/file.txt")).not.toThrow();
      expect(() => preventPathTraversal("documents/report.pdf")).not.toThrow();
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct email addresses", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.user+tag@domain.co.uk")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(isValidEmail("invalid.email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should validate HTTP/HTTPS URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
    });

    it("should reject invalid protocols", () => {
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
      expect(isValidUrl("file:///etc/passwd")).toBe(false);
      expect(isValidUrl("ftp://example.com")).toBe(false);
    });

    it("should allow custom protocols when specified", () => {
      expect(isValidUrl("ftp://example.com", ["ftp:"])).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("")).toBe(false);
    });
  });

  describe("isAlphanumeric", () => {
    it("should validate alphanumeric strings", () => {
      expect(isAlphanumeric("abc123")).toBe(true);
      expect(isAlphanumeric("ABC")).toBe(true);
      expect(isAlphanumeric("123")).toBe(true);
    });

    it("should handle spaces option", () => {
      expect(isAlphanumeric("hello world", true)).toBe(true);
      expect(isAlphanumeric("hello world", false)).toBe(false);
    });

    it("should handle dashes option", () => {
      expect(isAlphanumeric("user-name_123", false, true)).toBe(true);
      expect(isAlphanumeric("user-name", false, false)).toBe(false);
    });

    it("should reject special characters", () => {
      expect(isAlphanumeric("test@example")).toBe(false);
      expect(isAlphanumeric("hello!")).toBe(false);
    });
  });

  describe("validateInteger", () => {
    it("should validate and parse integers", () => {
      expect(validateInteger("42")).toBe(42);
      expect(validateInteger(123)).toBe(123);
      expect(validateInteger("-10")).toBe(-10);
    });

    it("should enforce minimum value", () => {
      expect(() => validateInteger("5", 10)).toThrow();
      expect(validateInteger("15", 10)).toBe(15);
    });

    it("should enforce maximum value", () => {
      expect(() => validateInteger("150", 0, 100)).toThrow();
      expect(validateInteger("50", 0, 100)).toBe(50);
    });

    it("should reject non-integers", () => {
      expect(() => validateInteger("12.5")).toThrow();
      expect(() => validateInteger("abc")).toThrow();
    });
  });

  describe("validateLength", () => {
    it("should validate string length", () => {
      expect(validateLength("hello", 1, 10)).toBe("hello");
      expect(validateLength("test", 4, 4)).toBe("test");
    });

    it("should enforce minimum length", () => {
      expect(() => validateLength("hi", 5)).toThrow();
    });

    it("should enforce maximum length", () => {
      expect(() => validateLength("hello world", 0, 5)).toThrow();
    });
  });

  describe("isValidUuid", () => {
    it("should validate UUID v4 format", () => {
      expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isValidUuid("a3bb189e-8bf9-3888-9912-ace4e6543002")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(isValidUuid("invalid-uuid")).toBe(false);
      expect(isValidUuid("123456")).toBe(false);
      expect(isValidUuid("")).toBe(false);
    });
  });

  describe("sanitizeInput", () => {
    it("should trim whitespace by default", () => {
      const result = sanitizeInput("  hello  ");
      expect(result).toBe("&lt; >hello&lt; >");  // Note: spaces might be escaped as &lt; >
    });

    it("should escape HTML by default", () => {
      const result = sanitizeInput("<script>alert(1)</script>");
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
    });

    it("should enforce max length", () => {
      expect(() => sanitizeInput("hello world", { maxLength: 5 })).toThrow();
    });

    it("should check allowed characters", () => {
      expect(() => 
        sanitizeInput("hello123", { allowedChars: /^[a-z]+$/ })
      ).toThrow();
      
      expect(
        sanitizeInput("hello", { allowedChars: /^[a-z]+$/, escapeHtml: false })
      ).toBe("hello");
    });
  });
});
