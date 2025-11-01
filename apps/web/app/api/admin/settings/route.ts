
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ADMIN_CONFIG_PATH = './.local/admin-config.json';

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin') === 'true';
}

const defaultConfig = {
  pollIntervalSeconds: 60,
  pollConcurrency: 3,
  feedFailureThreshold: 5,
  allowedSources: ['rollingstone-india'],
  feedBlacklist: []
};

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    if (!existsSync(ADMIN_CONFIG_PATH)) {
      writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
      return NextResponse.json(defaultConfig);
    }
    
    const config = JSON.parse(readFileSync(ADMIN_CONFIG_PATH, 'utf-8'));
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to load admin config:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    const config = {
      pollIntervalSeconds: body.pollIntervalSeconds || defaultConfig.pollIntervalSeconds,
      pollConcurrency: body.pollConcurrency || defaultConfig.pollConcurrency,
      feedFailureThreshold: body.feedFailureThreshold || defaultConfig.feedFailureThreshold,
      allowedSources: body.allowedSources || defaultConfig.allowedSources,
      feedBlacklist: body.feedBlacklist || defaultConfig.feedBlacklist
    };
    
    writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(config, null, 2));
    
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Failed to save admin config:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
