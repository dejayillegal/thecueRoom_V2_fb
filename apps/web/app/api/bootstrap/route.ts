import { NextResponse } from 'next/server';
import { ensureRequiredAccounts } from '@/lib/bootstrap/seed-accounts';

let bootstrapped = false;

export async function GET() {
  if (bootstrapped) {
    return NextResponse.json({ ok: true, message: 'Already bootstrapped' });
  }

  try {
    await ensureRequiredAccounts();
    bootstrapped = true;
    return NextResponse.json({ ok: true, message: 'Bootstrap complete' });
  } catch (error) {
    console.error('[Bootstrap API] Error:', error);
    return NextResponse.json({ ok: false, error: 'Bootstrap failed' }, { status: 500 });
  }
}
