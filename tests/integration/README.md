
# Integration Tests

Integration tests that exercise API endpoints with database operations.

## Test Database

Uses isolated test database with automatic rollback after each test.

## Running Tests

```bash
pnpm test:integration
```

## Covered Flows

- Signup (user & artist)
- Authentication
- Playlist CRUD operations
- Monthly playlist workflows
- Social promo generation
- Notifications
- Forum operations
