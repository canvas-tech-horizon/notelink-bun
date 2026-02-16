# NoteLink Tests

This directory contains the test suite for NoteLink using Bun's built-in test runner.

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test tests/api-note.test.ts

# Run with coverage (Bun native coverage)
bun test --coverage
```

## Test Structure

- `api-note.test.ts` - Core API functionality tests
- `validation.test.ts` - Input validation and sanitization tests

## Writing Tests

Use Bun's built-in test framework:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";

describe("Feature Name", () => {
  it("should do something", () => {
    expect(true).toBe(true);
  });
});
```

## Test Coverage Goals

- [ ] Core API functionality: >80%
- [ ] Middleware: >75%
- [ ] Validation utilities: >90%
- [ ] Error handling: >80%

## CI/CD Integration

Tests are automatically run on:
- Pull requests
- Commits to main branch
- Before publishing releases

## Adding New Tests

1. Create a new test file in `tests/` directory
2. Follow the naming convention: `*.test.ts`
3. Write descriptive test cases
4. Ensure tests are isolated and don't depend on external state
5. Clean up resources in `afterAll` hooks
6. Mock external dependencies when appropriate

## Best Practices

- One assertion per test when possible
- Use descriptive test names
- Test both success and failure cases
- Clean up after tests (close connections, stop servers)
- Avoid hardcoded values (use constants)
- Use beforeAll/afterAll for setup/teardown
- Keep tests fast and focused

## Debugging Tests

```bash
# Run with verbose output
bun test --verbose

# Run single test file with filter
bun test tests/api-note.test.ts --grep "should register"
```
