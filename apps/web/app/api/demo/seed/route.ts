import { NextRequest, NextResponse } from 'next/server';
import { seedDemoData } from '@thecueroom/server/demoSeeder';

export async function POST(request: NextRequest) {
  try {
    const demoAdminKey = process.env.DEMO_ADMIN_KEY || 'demo_dashboard_key';
    const authHeader = request.headers.get('x-demo-admin');

    if (authHeader !== demoAdminKey) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await seedDemoData();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Demo Seed API] Error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to seed demo data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
