import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const SHARES_DIR = path.join(process.cwd(), '.local/state');
const SHARES_FILE = path.join(SHARES_DIR, 'epk-shares.json');
const DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

interface ShareRecord {
  shareId: string;
  jobId: string;
  artistName?: string;
  releaseTitle?: string;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
}

interface SharesData {
  shares: Record<string, ShareRecord>;
}

const ShareRequestSchema = z.object({
  jobId: z.string(),
  artistName: z.string().optional(),
  releaseTitle: z.string().optional(),
  ttl: z.number().optional(),
});

async function ensureSharesFile(): Promise<SharesData> {
  try {
    await fs.mkdir(SHARES_DIR, { recursive: true });
    const data = await fs.readFile(SHARES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    const initialData: SharesData = { shares: {} };
    await fs.writeFile(SHARES_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

async function saveShares(data: SharesData): Promise<void> {
  const tempFile = SHARES_FILE + '.tmp';
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
  await fs.rename(tempFile, SHARES_FILE);
}

async function cleanExpiredShares(sharesData: SharesData): Promise<void> {
  const now = Date.now();
  let cleaned = false;

  for (const [shareId, record] of Object.entries(sharesData.shares)) {
    if (record.expiresAt < now) {
      delete sharesData.shares[shareId];
      cleaned = true;
    }
  }

  if (cleaned) {
    await saveShares(sharesData);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, artistName, releaseTitle, ttl = DEFAULT_TTL } = ShareRequestSchema.parse(body);

    const sharesData = await ensureSharesFile();
    await cleanExpiredShares(sharesData);

    const shareId = nanoid(10);
    const now = Date.now();
    
    const shareRecord: ShareRecord = {
      shareId,
      jobId,
      artistName,
      releaseTitle,
      createdAt: now,
      expiresAt: now + ttl,
      accessCount: 0,
    };

    sharesData.shares[shareId] = shareRecord;
    await saveShares(sharesData);

    const baseUrl = request.headers.get('x-forwarded-host') 
      ? `https://${request.headers.get('x-forwarded-host')}`
      : process.env.SHARED_HOST || `http://localhost:${process.env.PORT || 3000}`;

    const shareUrl = `${baseUrl}/epk/s/${shareId}`;

    console.log(`[EPK Share] Created share: ${shareId} for job: ${jobId}`);

    return NextResponse.json({
      ok: true,
      shareId,
      url: shareUrl,
      expiresAt: shareRecord.expiresAt,
    });
  } catch (error) {
    console.error('[EPK Share] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to create share',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json({
        ok: false,
        error: 'shareId is required',
      }, { status: 400 });
    }

    const sharesData = await ensureSharesFile();
    await cleanExpiredShares(sharesData);

    const share = sharesData.shares[shareId];

    if (!share) {
      return NextResponse.json({
        ok: false,
        error: 'Share not found or expired',
      }, { status: 404 });
    }

    if (share.expiresAt < Date.now()) {
      delete sharesData.shares[shareId];
      await saveShares(sharesData);

      return NextResponse.json({
        ok: false,
        error: 'Share expired',
      }, { status: 410 });
    }

    share.accessCount++;
    await saveShares(sharesData);

    return NextResponse.json({
      ok: true,
      share: {
        shareId: share.shareId,
        jobId: share.jobId,
        artistName: share.artistName,
        releaseTitle: share.releaseTitle,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        accessCount: share.accessCount,
      },
    });
  } catch (error) {
    console.error('[EPK Share] GET Error:', error);

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve share',
    }, { status: 500 });
  }
}
