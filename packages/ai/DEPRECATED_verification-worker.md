# DEPRECATED

This file `packages/ai/verification-worker.ts` is deprecated.

The canonical verification worker implementation is now at:
**`scripts/start-verification-worker.ts`**

This file exists for reference only and should not be used. It has module resolution issues when run directly and was replaced with the script-based implementation.

To run the verification worker, use:
```bash
tsx scripts/start-verification-worker.ts
```

Or via the configured workflow:
```bash
# The "Verification Worker" workflow runs automatically
```
