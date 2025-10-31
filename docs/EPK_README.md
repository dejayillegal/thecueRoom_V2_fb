# EPK (Electronic Press Kit) System Documentation

## Overview

The thecueRoom EPK system provides production-grade PDF generation, composition stamping, and shareable links for artist electronic press kits. The system is designed to be memory-efficient, fault-tolerant, and scalable.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend UI                        │
│          (EPKStudioClient, TemplateGallery)         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                  API Endpoints                       │
│  /api/epk/generate  │  /api/epk/job/:id             │
│  /api/epk/download  │  /api/epk/share               │
│  /api/epk/compose   │                               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              EPK Worker Process                      │
│        (packages/epk/worker.mjs)                    │
│  - PDF Generation (Puppeteer/PDFKit)                │
│  - ZIP Asset Packaging                              │
│  - Job Queue Processing                             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│             File Storage & State                     │
│  /tmp/thecueroom-epk/           (temp files)        │
│  .local/state/epk-shares.json   (share links)       │
└─────────────────────────────────────────────────────┘
```

## Environment Variables

Create a `.env` file or add to Replit Secrets:

```bash
# Required
DATABASE_URL=postgresql://...         # PostgreSQL connection string

# EPK Configuration
EPK_TEMP_DIR=/tmp/thecueroom-epk     # Temporary file storage
EPK_WORKER_CONCURRENCY=1              # Worker concurrency (default: 1)
EPK_TEST_MODE=true                    # Use test mode (default: false)
EPK_PDF_TOOL=puppeteer                # PDF tool: puppeteer | pdfkit

# AI Configuration (Optional)
AI_TEMP_DIR=/tmp/thecueroom-ai       # AI temp files
OPENAI_API_KEY=sk-...                 # OpenAI API key (optional)

# Server Configuration
PORT=5000                             # Server port
SHARED_HOST=https://your-domain.com   # Base URL for share links
```

## Installation

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Install EPK-specific packages
pnpm --filter apps/web add pdf-lib sanitize-html express-formidable html-pdf-node
pnpm --filter apps/web add -D supertest vitest playwright
```

### 2. Set Up Database

```bash
# Run migrations
pnpm --filter packages/db migrate

# Or use the setup script
tsx scripts/setup.ts
```

### 3. Start Services

```bash
# Terminal 1: Start Next.js dev server
pnpm --filter apps/web dev

# Terminal 2: Start EPK worker
node packages/epk/worker.mjs
```

## Usage

### 1. Generate an EPK

**API Request:**

```bash
curl -X POST "http://localhost:5000/api/epk/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "brutalist-onepage",
    "modules": [
      {
        "id": "bio-1",
        "type": "bio",
        "order": 0,
        "data": { "text": "Artist biography..." }
      },
      {
        "id": "tracklist-1",
        "type": "tracklist",
        "order": 1,
        "data": {
          "tracks": [
            { "title": "Track 1" },
            { "title": "Track 2" }
          ]
        }
      }
    ],
    "artistName": "DJ Example",
    "releaseTitle": "Sample EP",
    "exportFormat": "pdf",
    "includeWatermark": true
  }'
```

**Response:**

```json
{
  "ok": true,
  "jobId": "abc123xyz",
  "status": "queued"
}
```

### 2. Poll Job Status

```bash
curl "http://localhost:5000/api/epk/job/abc123xyz"
```

**Response (Processing):**

```json
{
  "jobId": "abc123xyz",
  "status": "processing",
  "progress": 60
}
```

**Response (Completed):**

```json
{
  "jobId": "abc123xyz",
  "status": "done",
  "progress": 100,
  "resultUrl": "/api/epk/download/abc123xyz/epk.pdf"
}
```

### 3. Download PDF

```bash
curl -OJ "http://localhost:5000/api/epk/download/abc123xyz/epk.pdf"
```

### 4. Create Share Link

```bash
curl -X POST "http://localhost:5000/api/epk/share" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "abc123xyz",
    "artistName": "DJ Example",
    "releaseTitle": "Sample EP"
  }'
```

**Response:**

```json
{
  "ok": true,
  "shareId": "xYz9kLmN0p",
  "url": "https://your-domain.com/epk/s/xYz9kLmN0p",
  "expiresAt": 1748123456789
}
```

### 5. Stamp PDF with Artist Info

```bash
curl -X POST "http://localhost:5000/api/epk/compose" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "abc123xyz",
    "artistName": "DJ Example",
    "releaseTitle": "Sample EP",
    "watermark": true
  }'
```

## Module Types

The EPK system supports the following module types:

- **bio**: Artist biography/description
- **quotes**: Press quotes and reviews
- **links**: Social media and streaming links
- **tracklist**: Track list with titles
- **techRider**: Technical rider equipment
- **gallery**: Photo gallery
- **video**: Video showcase
- **tourDates**: Tour dates and locations
- **discography**: Discography/releases
- **pressTimeline**: Press timeline
- **stats**: Statistics and achievements
- **customText**: Custom text sections

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm --filter apps/web test:unit

# Run specific test file
pnpm --filter apps/web test tests/epk/epk-share.test.ts
```

### E2E Tests

```bash
# Run E2E tests (requires server to be running)
pnpm --filter apps/web test:e2e
```

### Memory Diagnostics

```bash
# Run memory check (creates 3 concurrent jobs)
node scripts/diag/epk-memory-check.js
```

**Expected Output:**

```
✅ PASSED: Memory growth within acceptable limits
   Growth: 45.23 MB (< 70 MB threshold)
```

## Maintenance

### Cleanup Temporary Files

```bash
# Clean files older than 24 hours (default)
node scripts/diag/cleanup-temp.js

# Clean files older than 48 hours
node scripts/diag/cleanup-temp.js 48
```

### Monitor Worker

The EPK worker scans for queued jobs every 5 seconds. Monitor logs:

```bash
tail -f /var/log/epk-worker.log
```

**Typical output:**

```
[EPK Worker] Starting...
[EPK Worker] Concurrency: 1
[EPK Worker] Test Mode: false
[EPK Worker] PDF Tool: puppeteer
[EPK Worker] Generating PDF for job abc123xyz
[EPK Worker] PDF generated for abc123xyz
```

## Troubleshooting

### PDF Generation Fails

**Problem:** Worker cannot generate PDFs

**Solution 1:** Check if Chromium is available

```bash
which chromium-browser
# or
which google-chrome
```

**Solution 2:** Use TEST_MODE for development

```bash
export EPK_TEST_MODE=true
node packages/epk/worker.mjs
```

**Solution 3:** Use pdf-lib fallback

```bash
export EPK_PDF_TOOL=pdfkit
```

### Share Links Not Working

**Problem:** Share links return 404

**Solution:** Ensure the shares file exists

```bash
mkdir -p .local/state
echo '{"shares":{}}' > .local/state/epk-shares.json
```

### Memory Issues

**Problem:** Worker crashes with out-of-memory

**Solutions:**

1. Reduce concurrency:
   ```bash
   export EPK_WORKER_CONCURRENCY=1
   ```

2. Run memory diagnostics:
   ```bash
   node scripts/diag/epk-memory-check.js
   ```

3. Enable cleanup cron:
   ```bash
   # Add to crontab
   0 */6 * * * node /path/to/scripts/diag/cleanup-temp.js
   ```

### Puppeteer Issues on Replit

**Problem:** Puppeteer fails to launch

**Solution:** Set environment variables

```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

Or use TEST_MODE:

```bash
export EPK_TEST_MODE=true
```

## API Reference

### POST /api/epk/generate

Creates a new EPK generation job.

**Request Body:**

```typescript
{
  templateId: string;
  modules: EPKModule[];
  artistName?: string;
  releaseTitle?: string;
  exportFormat: 'pdf' | 'zip' | 'png';
  includeWatermark?: boolean;
}
```

**Response:**

```typescript
{
  ok: boolean;
  jobId: string;
  status: 'queued';
}
```

### GET /api/epk/job/:jobId

Retrieves job status.

**Response:**

```typescript
{
  jobId: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number; // 0-100
  resultUrl?: string;
  error?: string;
}
```

### GET /api/epk/download/:jobId/:filename

Downloads the generated file.

**Headers:**

- `Content-Type`: `application/pdf` or `application/zip`
- `Content-Disposition`: `attachment; filename="..."`

### POST /api/epk/share

Creates a shareable link.

**Request Body:**

```typescript
{
  jobId: string;
  artistName?: string;
  releaseTitle?: string;
  ttl?: number; // milliseconds, default: 30 days
}
```

**Response:**

```typescript
{
  ok: boolean;
  shareId: string;
  url: string;
  expiresAt: number;
}
```

### GET /api/epk/share?shareId=...

Retrieves share information.

**Response:**

```typescript
{
  ok: boolean;
  share: {
    shareId: string;
    jobId: string;
    artistName?: string;
    releaseTitle?: string;
    createdAt: number;
    expiresAt: number;
    accessCount: number;
  };
}
```

### POST /api/epk/compose

Stamps PDF with artist info and watermark.

**Request Body:**

```typescript
{
  jobId: string;
  artistName: string;
  releaseTitle?: string;
  watermark?: boolean; // default: true
}
```

**Response:**

```typescript
{
  ok: boolean;
  jobId: string;
  message: string;
}
```

## Performance

- **PDF Generation:** ~2-5 seconds (puppeteer), ~0.5-1 second (TEST_MODE)
- **ZIP Packaging:** ~1-3 seconds
- **Stamping:** ~0.5-1 second
- **Memory per job:** ~20-40 MB peak
- **Concurrent jobs:** Configurable (default: 1)

## Security

- Share links expire after configurable TTL (default: 30 days)
- No authentication required for public share pages
- PDF metadata includes artist attribution
- Watermarks are embedded as vector text
- Temp files are regularly cleaned up
- Job IDs use cryptographically secure random generation

## License

Proprietary - thecueRoom Platform
