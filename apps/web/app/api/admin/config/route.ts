import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const DEFAULT_CONFIG = {
  feedPollingInterval: 60,
  maxFeedsPerCycle: 25,
  enableAutoRefresh: true,
  enableRateLimiting: true,
  aiCreditsPerUser: 100,
  verificationRequired: false,
};

let appConfig = { ...DEFAULT_CONFIG };

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ config: appConfig });
}

export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { config } = body;

    if (config) {
      appConfig = {
        ...appConfig,
        ...config,
      };
    }

    return NextResponse.json({ 
      success: true,
      config: appConfig
    });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
