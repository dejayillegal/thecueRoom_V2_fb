
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CronConfig {
  enabled: boolean;
  interval: number; // in minutes
  lastRun?: string;
  nextRun?: string;
}

// In-memory storage (replace with database in production)
let cronConfig: CronConfig = {
  enabled: true,
  interval: 60, // 1 hour by default
};

export async function GET(request: NextRequest) {
  // Optional: Add admin authentication here
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(cronConfig);
}

export async function POST(request: NextRequest) {
  // Optional: Add admin authentication here
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (typeof body.enabled === 'boolean') {
      cronConfig.enabled = body.enabled;
    }
    
    if (typeof body.interval === 'number' && body.interval > 0) {
      cronConfig.interval = body.interval;
    }

    return NextResponse.json({ 
      success: true, 
      config: cronConfig 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid request body' 
    }, { status: 400 });
  }
}
