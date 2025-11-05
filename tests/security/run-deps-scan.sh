
#!/bin/bash

echo "Running dependency security scans..."

# npm audit
echo "=== npm audit ==="
npm audit --audit-level=moderate || true

# Snyk (if installed)
if command -v snyk &> /dev/null; then
  echo "=== Snyk scan ==="
  snyk test --severity-threshold=medium || true
else
  echo "Snyk not installed, skipping..."
fi

# Check for known vulnerable packages
echo "=== Checking package versions ==="
pnpm outdated || true

echo "Security scan complete!"
