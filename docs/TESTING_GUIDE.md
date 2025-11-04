
# Testing Guide

## Overview
This guide covers all testing procedures for thecueRoom V2.

## Test Types

### Unit Tests
**Location:** `tests/`

**Run all unit tests:**
```bash
pnpm test
```

**Run specific test file:**
```bash
pnpm test tests/profile/settings.test.ts
```

**Coverage:**
- Profile settings validation
- Admin verification queue logic
- Form validation
- Privacy toggles
- Utility functions

### E2E Tests
**Location:** `tests/e2e/`

**Run all E2E tests:**
```bash
pnpm test:e2e
```

**Run specific E2E test:**
```bash
npx playwright test tests/e2e/signup.spec.ts
```

**Coverage:**
- Complete signup flow
- Verification modal interaction
- Profile settings updates
- Admin queue operations

### Diagnostic Scripts
**Location:** `scripts/diag/`

**Run all diagnostic checks:**
```bash
bash scripts/diag/run-all-checks.sh
```

**Individual checks:**
```bash
# Profile settings
node scripts/diag/check-profile-settings.js

# Verification queue
node scripts/diag/check-verification-queue.js

# Signup flow
node scripts/diag/check-signup-api.js
```

## Test Data

### Test Users
Created by: `scripts/seed-test-accounts.ts`

**Accounts:**
- `test@verified.com` - Auto-verified artist
- `test@pending.com` - Pending admin review
- `test@rejected.com` - Rejected verification
- `admin@thecueroom.com` - Admin account

### Test Mode
Enable deterministic testing:
```bash
export TEST_MODE=true
```

**Effects:**
- Verification worker uses deterministic results
- No external API calls
- Fast, predictable test execution

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should validate input', () => {
    const input = 'test@example.com';
    expect(input).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('should update profile', async ({ page }) => {
  await page.goto('/settings');
  await page.fill('#displayName', 'New Name');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Success')).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions (Future)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e
```

## Test Coverage Goals

**Minimum Coverage:**
- Unit tests: 80%
- E2E tests: Critical paths only
- Diagnostic scripts: All major features

**Priority Areas:**
1. Authentication and verification
2. Profile settings and privacy
3. Admin operations
4. AI workflows
5. Data persistence

## Debugging Tests

**Verbose output:**
```bash
pnpm test --reporter=verbose
```

**Run in watch mode:**
```bash
pnpm test --watch
```

**Playwright headed mode:**
```bash
npx playwright test --headed
```

**Playwright debug mode:**
```bash
PWDEBUG=1 npx playwright test
```

## Common Issues

### Tests Timing Out
- Increase timeout in test config
- Check if services are running (workers, database)
- Verify TEST_MODE is enabled

### Database Errors
- Run `pnpm db:push` to sync schema
- Check DATABASE_URL is set
- Verify test data is seeded

### Worker Not Processing
- Check worker is running (`pnpm worker`)
- Verify TEST_MODE=true for deterministic results
- Check logs in AI_TEMP_DIR

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Use fixtures** - Pre-populate test data
3. **Clean up** - Remove test data after runs
4. **Mock external APIs** - No real API calls in tests
5. **Fast execution** - Optimize for speed
6. **Clear assertions** - Use descriptive expect messages
