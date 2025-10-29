import { NextResponse } from 'next/server';

interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
}

const MAX_MARKS = 1000;
const ENABLE_DIAG_API = process.env.NODE_ENV === 'development' || process.env.ENABLE_DIAG_API === 'true';

let performanceMarks: Map<string, PerformanceMark> = new Map();

function checkDiagEnabled() {
  if (!ENABLE_DIAG_API) {
    return NextResponse.json(
      { error: 'Diagnostic API is disabled. Set ENABLE_DIAG_API=true to enable in production.' },
      { status: 403 }
    );
  }
  return null;
}

export async function GET() {
  const authCheck = checkDiagEnabled();
  if (authCheck) return authCheck;
  try {
    const marks = Array.from(performanceMarks.values());
    
    const summary = {
      totalMarks: marks.length,
      marks: marks.map(mark => ({
        name: mark.name,
        startTime: Math.round(mark.startTime),
        duration: mark.duration ? Math.round(mark.duration) : null,
      })),
      timestamp: Date.now(),
    };

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[perf] Error fetching performance marks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance marks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authCheck = checkDiagEnabled();
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { name, startTime, duration } = body;

    if (!name || typeof startTime !== 'number') {
      return NextResponse.json(
        { error: 'Invalid mark data: name and startTime required' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.length > 200) {
      return NextResponse.json(
        { error: 'Mark name must be a string with max 200 characters' },
        { status: 400 }
      );
    }

    if (performanceMarks.size >= MAX_MARKS) {
      return NextResponse.json(
        { error: `Maximum marks limit (${MAX_MARKS}) reached. Clear marks first.` },
        { status: 429 }
      );
    }

    performanceMarks.set(name, {
      name,
      startTime,
      duration: duration || undefined,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[perf] Error recording performance mark:', error);
    return NextResponse.json(
      { error: 'Failed to record performance mark' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const authCheck = checkDiagEnabled();
  if (authCheck) return authCheck;

  try {
    performanceMarks.clear();
    return NextResponse.json({ success: true, cleared: true });
  } catch (error) {
    console.error('[perf] Error clearing performance marks:', error);
    return NextResponse.json(
      { error: 'Failed to clear performance marks' },
      { status: 500 }
    );
  }
}
