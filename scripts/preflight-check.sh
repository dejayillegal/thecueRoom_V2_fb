#!/usr/bin/env bash
set -e

echo "🔍 Running preflight checks..."

# 1. No forbidden tables
grep -R "feeds_sources" . && echo "❌ feeds_sources found" && exit 1
grep -R "IngestionService" . && echo "❌ IngestionService found" && exit 1

# 2. No dynamic imports
grep -R "import(.*ingestion" . && echo "❌ Dynamic ingestion import found" && exit 1

# 3. No infinite loaders
grep -R "No signals" . && echo "❌ Fake empty state found" && exit 1

# 4. No auto offset loops
grep -R "setOffset(offset + 12)" . && echo "⚠️ Review offset increment logic"

# 5. No client-only initial fetch
grep -R "useEffect(.*fetch.*feeds" ./app && echo "⚠️ Client-side initial fetch detected"

echo "✅ Preflight checks passed"

