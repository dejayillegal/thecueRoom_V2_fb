import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDbClient } from '@thecueroom/db/client';
import { users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export interface UserData {
  uid: string;
  email: string;
  role: string;
}

export async function createToken(userData: UserData): Promise<string> {
  const token = await new SignJWT({ ...userData })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  
  return token;
}

export async function verifyToken(token: string): Promise<UserData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as UserData;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<UserData | null> {
  try {
    const db = getDbClient();
    const userRecords = await db.select().from(users).where(eq(users.email, email));
    
    if (userRecords.length === 0) {
      return null;
    }
    
    const user = userRecords[0];
    
    if (!user.passwordHash) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return null;
    }
    
    return {
      uid: user.id,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function getSession(): Promise<UserData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

export async function setSession(userData: UserData): Promise<void> {
  const token = await createToken(userData);
  const cookieStore = await cookies();
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
