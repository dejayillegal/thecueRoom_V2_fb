
# thecueRoom Test Suite

This directory contains comprehensive test coverage for the thecueRoom application across multiple test types.

## Directory Structure

- `unit/` - Unit tests for individual functions and components
- `integration/` - Integration tests for API endpoints and database operations
- `e2e/` - End-to-end tests using Playwright
- `contracts/` - Pact contract tests for API contracts
- `load/` - k6 load and stress testing scripts
- `security/` - Security testing configurations (OWASP ZAP, Snyk)
- `fuzz/` - Fuzz testing scripts for API endpoints
- `perf/` - Lighthouse CI and performance testing
- `utils/` - Test utilities, fixtures, and helpers

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test:ci

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:contract
pnpm test:load
pnpm test:security
pnpm test:perf
```

## Test Environment Setup

1. Copy `.env.test.example` to `.env.test`
2. Fill in required test credentials (use sandbox/test accounts)
3. Ensure test database is accessible
4. Run `pnpm test:setup` to seed test data

## CI Integration

Tests run automatically on:
- Every PR (smoke suite)
- Nightly (full regression)
- Manual trigger for specialized tests (load, penetration)

## Coverage Thresholds

- Unit test coverage: ≥ 80% for critical modules
- E2E coverage: All critical user flows
- API coverage: All public endpoints
- Performance: p95 < 2s, error rate < 1%
