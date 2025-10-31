/**
 * Admin API route for feed poller configuration
 * Protected by admin authentication (mocked in development)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const pollerConfigSchema = z.object({
  pollIntervalSeconds: z.number().min(10).max(3600),
  pollConcurrency: z.number().min(1).max(10),
  failureThreshold: z.number().min(1).max(20),
});

const sourceToggleSchema = z.object({
  sourceId: z.string(),
  enabled: z.boolean(),
});

// Simple in-memory storage (in production, use database)
let pollerConfig = {
  pollIntervalSeconds: parseInt(process.env.POLL_INTERVAL_SECONDS || '60'),
  pollConcurrency: parseInt(process.env.POLL_CONCURRENCY || '3'),
  failureThreshold: parseInt(process.env.FEED_FAILURE_THRESHOLD || '5'),
};

/**
 * Mock admin authentication check
 * In production, verify JWT token or session
 */
function isAdminAuthenticated(request: NextRequest): boolean {
  // In development, check for admin cookie or always return true
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const adminSecret = request.headers.get('x-admin-secret');
  return adminSecret === process.env.ADMIN_SECRET;
}

/**
 * GET - Retrieve current poller configuration
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    config: pollerConfig,
    timestamp: new Date().toISOString(),
  });
}

/**
 * PUT - Update poller configuration
 */
export async function PUT(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validated = pollerConfigSchema.parse(body);

    pollerConfig = validated;

    console.log('[Admin] Updated poller config:', pollerConfig);

    return NextResponse.json({
      success: true,
      config: pollerConfig,
      message: 'Poller configuration updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST - Toggle source enabled/disabled
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { sourceId, enabled } = sourceToggleSchema.parse(body);

    // In production, update database
    console.log(`[Admin] ${enabled ? 'Enabled' : 'Disabled'} source:`, sourceId);

    return NextResponse.json({
      success: true,
      sourceId,
      enabled,
      message: `Source ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to toggle source' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['start', 'stop', 'run-now', 'status', 'update-config']),
  config: z.object({
    pollIntervalSeconds: z.number().min(10).max(3600).optional(),
    pollConcurrency: z.number().min(1).max(10).optional(),
    failureThreshold: z.number().min(1).max(20).optional(),
  }).optional(),
});

// In-memory poller state (in production, use Redis or DB)
let pollerState = {
  isRunning: false,
  config: {
    pollIntervalSeconds: parseInt(process.env.POLL_INTERVAL_SECONDS || '60', 10),
    pollConcurrency: parseInt(process.env.POLL_CONCURRENCY || '3', 10),
    failureThreshold: parseInt(process.env.FEED_FAILURE_THRESHOLD || '5', 10),
  },
};

function isAdmin(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const adminSecret = request.headers.get('x-admin-secret');
  return adminSecret === process.env.ADMIN_SECRET;
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, config } = actionSchema.parse(body);

    switch (action) {
      case 'start':
        pollerState.isRunning = true;
        return NextResponse.json({ success: true, message: 'Poller started', state: pollerState });

      case 'stop':
        pollerState.isRunning = false;
        return NextResponse.json({ success: true, message: 'Poller stopped', state: pollerState });

      case 'run-now':
        return NextResponse.json({ success: true, message: 'Manual run triggered' });

      case 'status':
        return NextResponse.json({ success: true, state: pollerState });

      case 'update-config':
        if (config) {
          pollerState.config = { ...pollerState.config, ...config };
        }
        return NextResponse.json({ success: true, message: 'Config updated', state: pollerState });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
