
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './auth';

export type UserRole = 'admin' | 'artist' | 'user';

export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ authorized: boolean; session: any; error?: NextResponse }> {
  const session = await getSession();

  if (!session) {
    return {
      authorized: false,
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(session.role as UserRole)) {
    return {
      authorized: false,
      session,
      error: NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}

export function isAdmin(role: string): boolean {
  return role === 'admin';
}

export function isArtist(role: string): boolean {
  return role === 'artist';
}

export function canSubmitEvents(role: string): boolean {
  return role === 'admin' || role === 'artist';
}

export function canAccessAITools(role: string): boolean {
  return role === 'admin' || role === 'artist';
}
