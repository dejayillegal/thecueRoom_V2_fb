
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

export interface UserPayload extends JWTPayload {
  uid: string;
  email: string;
  role?: string;
  emailVerified?: boolean;
}

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as UserPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('thecue_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('thecue_session')?.value;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('thecue_session');
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  return verifyToken(token);
}
