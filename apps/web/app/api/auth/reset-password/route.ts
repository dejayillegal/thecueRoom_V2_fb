import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users, passwordResets } from '@thecueroom/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(10, 'Password must be at least 10 characters')
    .regex(/[0-9!@#$%^&*(),.?":{}|<>_\-+=]/, 'Password must include a number or special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = resetSchema.parse(body);

    const db = getDbClient();
    const now = new Date();

    // Find valid, unused reset token
    const [resetRecord] = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, token),
          eq(passwordResets.used, false),
          gt(passwordResets.expiresAt, now)
        )
      )
      .limit(1);

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.update(users)
      .set({ passwordHash: hashedPassword, updatedAt: now })
      .where(eq(users.id, resetRecord.userId));

    // Mark token as used
    await db.update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.id, resetRecord.id));

    return NextResponse.json({
      ok: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}