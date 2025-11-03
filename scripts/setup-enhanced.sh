
#!/usr/bin/env bash
set -e

echo "🚀 Starting thecueRoom enhanced setup workflow"

# =============== 1. Environment Check ===================
echo "📋 Checking environment..."
pnpm -v || { echo "❌ pnpm not found"; exit 1; }

# =============== 2. Install Dependencies ===================
echo "📦 Installing dependencies..."
pnpm -w install

# Add required utilities
pnpm --filter apps/web add p-limit cross-fetch fast-xml-parser nanoid
pnpm --filter @thecueroom/db add drizzle-orm pg
pnpm --filter @thecueroom/feeds add p-limit fast-xml-parser

# Dev dependencies
pnpm --filter apps/web add -D prettier eslint vitest @testing-library/react || echo "⚠️ Some dev deps failed, continuing..."

# =============== 3. Create Required Directories ===================
echo "📁 Creating directories..."
mkdir -p seeds/data
mkdir -p .local/feeds-cache
mkdir -p logs/feeds

# =============== 4. Ensure Core Utilities Exist ===================
echo "🔧 Ensuring core utilities..."

# Check if safe-fetch already exists
if [ ! -f "apps/web/src/lib/safe-fetch.ts" ]; then
  echo "Creating safe-fetch utility..."
  cat > apps/web/src/lib/safe-fetch.ts <<'TYPESCRIPT'
/**
 * Safe fetch wrapper with timeout, retries, and error handling
 */

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
  attempts?: number;
}

export async function safeFetch(url: string, options: SafeFetchOptions = {}) {
  const {
    timeout = parseInt(process.env.NODE_FETCH_TIMEOUT_MS || '15000', 10),
    attempts = parseInt(process.env.POLL_RETRY_ATTEMPTS || '3', 10),
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error.name === 'AbortError' ? new Error('Request timeout') : error;
      
      if (i < attempts - 1) {
        const backoff = 200 * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }

  throw lastError || new Error('Fetch failed');
}
TYPESCRIPT
fi

# =============== 5. Create Seed Data ===================
echo "🌱 Creating seed data..."

cat > seeds/seed-forum.js <<'JAVASCRIPT'
const fs = require('fs');
const path = require('path');

const seedDir = path.join(process.cwd(), 'seeds', 'data');
if (!fs.existsSync(seedDir)) {
  fs.mkdirSync(seedDir, { recursive: true });
}

const users = [
  { id: 'u1', username: 'testdj', displayName: 'Test DJ', role: 'artist', verified: true },
  { id: 'u2', username: 'listener01', displayName: 'Listener 01', role: 'user', verified: true },
  { id: 'u3', username: 'producerx', displayName: 'Producer X', role: 'artist', verified: true }
];

const threads = [
  { 
    id: 't1', 
    title: 'Best DAW for underground techno production?', 
    userId: 'u3', 
    categoryId: 'production',
    body: 'Looking for recommendations on DAWs for techno production',
    tags: ['production', 'techno', 'daw'],
    replyCount: 1,
    likesCount: 24,
    viewCount: 320
  },
  { 
    id: 't2', 
    title: 'Welcome to thecueRoom Forum!', 
    userId: 'u2', 
    categoryId: 'general',
    body: 'Excited to be part of this community',
    tags: ['general', 'welcome'],
    replyCount: 1,
    likesCount: 10,
    viewCount: 36
  }
];

const replies = [
  { id: 'r1', threadId: 't1', userId: 'u1', body: 'I use Ableton with lots of hardware. Practice is key!' },
  { id: 'r2', threadId: 't2', userId: 'u2', body: 'Happy to be here. Great vibes.' }
];

fs.writeFileSync(path.join(seedDir, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(seedDir, 'threads.json'), JSON.stringify(threads, null, 2));
fs.writeFileSync(path.join(seedDir, 'replies.json'), JSON.stringify(replies, null, 2));

console.log('✅ Forum seed data created');
JAVASCRIPT

cat > seeds/seed-events.js <<'JAVASCRIPT'
const fs = require('fs');
const path = require('path');

const seedDir = path.join(process.cwd(), 'seeds', 'data');
if (!fs.existsSync(seedDir)) {
  fs.mkdirSync(seedDir, { recursive: true });
}

const events = [
  { 
    id: 'e1', 
    title: 'Underground Warehouse Party - Bangalore', 
    city: 'Bangalore',
    venue: 'Secret Warehouse',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    source: 'manual',
    approved: true,
    genres: ['techno', 'house']
  },
  { 
    id: 'e2', 
    title: 'Modular Night - Mumbai', 
    city: 'Mumbai',
    venue: 'The Loft',
    startTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    source: 'manual',
    approved: true,
    genres: ['experimental', 'modular']
  }
];

fs.writeFileSync(path.join(seedDir, 'events.json'), JSON.stringify(events, null, 2));
console.log('✅ Event seed data created');
JAVASCRIPT

chmod +x seeds/seed-forum.js seeds/seed-events.js

# =============== 6. Run Seeders ===================
echo "🌱 Running seeders..."
node seeds/seed-forum.js
node seeds/seed-events.js

# =============== 7. Format Code ===================
echo "✨ Formatting code..."
npx prettier --write "apps/web/src/**/*.{ts,tsx}" --log-level silent || echo "⚠️ Prettier failed, continuing..."

# =============== 8. Success Message ===================
echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Ensure DATABASE_URL is set in Secrets"
echo "   2. Run: tsx scripts/init-all.ts"
echo "   3. Start server with Run button"
echo ""
echo "🔍 Seed data locations:"
echo "   - Forum: seeds/data/threads.json"
echo "   - Events: seeds/data/events.json"
echo ""
