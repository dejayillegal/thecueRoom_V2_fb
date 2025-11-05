
# Test Runbook - thecueRoom

This document provides step-by-step instructions for running all test suites.

## Prerequisites

1. Node.js 20+ and pnpm installed
2. PostgreSQL test database accessible
3. Test environment variables configured (`.env.test`)
4. k6 installed for load testing
5. Playwright browsers installed

## Environment Setup

```bash
# 1. Copy test environment template
cp .env.test.example .env.test

# 2. Fill in test credentials (use sandbox accounts)
# Edit .env.test with your test values

# 3. Install dependencies
pnpm install

# 4. Setup test database
pnpm test:setup

# 5. Install Playwright browsers
pnpm exec playwright install
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run with coverage
pnpm test:unit:coverage

# Watch mode for development
pnpm test:unit:watch

# View coverage report
open coverage/index.html
```

### Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific test file
pnpm vitest run tests/integration/api/monthly-playlists.test.ts
```

### End-to-End Tests

```bash
# Run smoke tests
pnpm test:smoke

# Run all E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run specific test
pnpm exec playwright test tests/e2e/smoke.spec.ts
```

### Load & Stress Tests

```bash
# Smoke test (light load)
pnpm test:load

# Full load test
pnpm test:load:full

# Stress test (run in staging only!)
pnpm test:stress

# Custom k6 run
k6 run tests/load/smoke.js --vus 100 --duration 5m
```

### Security Tests

```bash
# Dependency scans
pnpm test:security:deps

# SAST (linting)
pnpm test:security:sast

# Run all security checks
pnpm test:security
```

### Performance Tests

```bash
# Lighthouse CI
pnpm test:perf

# Accessibility scan
pnpm test:accessibility
```

### Contract Tests

```bash
# Run consumer tests
pnpm test:contract:consumer

# Run provider verification
pnpm test:contract:provider

# Run all contract tests
pnpm test:contract
```

### Fuzz Tests

```bash
# Run API fuzzing
pnpm test:fuzz
```

## CI Pipeline

### PR Checks (Fast)
- Unit tests
- Smoke E2E tests
- Linting
- Security SAST

### Nightly Regression (Comprehensive)
- All unit tests with coverage
- Full integration suite
- Full E2E suite
- Contract tests
- Load tests (light)
- Security scans
- Performance tests

## Manual Testing Procedures

### Usability Testing

1. **Artist Signup Flow**
   - Navigate to homepage
   - Click "Sign Up"
   - Select "Artist" role
   - Fill in all required fields
   - Submit verification documents
   - Verify email sent
   - Time to complete: record
   - Completion success: yes/no

2. **Playlist Publishing Flow**
   - Login as admin
   - Navigate to Monthly Playlists
   - Add new playlist URL
   - Validate metadata
   - Schedule or publish
   - Verify live status
   - Time to complete: record

3. **Social Promo Generation**
   - Navigate to AI tools
   - Enter event details
   - Generate promo
   - Preview output
   - Export PDF
   - Time to complete: record

### Penetration Testing

⚠️ **Run in staging environment only!**

1. **Authentication Bypass**
   - Attempt to access admin endpoints without auth
   - Try JWT manipulation
   - Test session fixation

2. **CSRF Testing**
   - Submit forms without CSRF tokens
   - Test cross-origin requests

3. **XSS Testing**
   - Inject scripts in user inputs
   - Test stored and reflected XSS

4. **SQL Injection**
   - Test all input fields with SQLi payloads
   - Monitor database logs

5. **File Upload Vulnerabilities**
   - Upload malicious files
   - Test file type validation

## Test Reports

### Viewing Reports

```bash
# Unit test coverage
open coverage/index.html

# Playwright report
pnpm exec playwright show-report

# k6 results
cat results.json | jq
```

### CI Artifacts

Reports are uploaded as CI artifacts:
- `coverage/` - Code coverage HTML
- `playwright-report/` - E2E test results
- `load-test-results.json` - k6 output
- `security-report.html` - Security scan results

## Troubleshooting

### Tests Failing Locally

1. Check `.env.test` is properly configured
2. Ensure test database is accessible
3. Run `pnpm test:setup` to reset test data
4. Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`

### Flaky E2E Tests

1. Increase timeouts in `playwright.config.ts`
2. Use `page.waitForLoadState('networkidle')`
3. Add explicit waits for dynamic content

### Load Tests Not Running

1. Install k6: `brew install k6` (macOS) or download from k6.io
2. Check BASE_URL environment variable
3. Ensure target server is accessible

## Coverage Targets

- **Unit tests**: ≥ 80% overall, 100% for auth
- **Integration tests**: All public API endpoints
- **E2E tests**: All critical user flows
- **Load tests**: p95 < 2s, error rate < 1%
- **Security**: Zero critical/high vulnerabilities

## Next Steps

After running tests:

1. Review test reports
2. Create GitHub issues for failures
3. Fix critical issues immediately
4. Schedule medium/low priority fixes
5. Update tests for new features
