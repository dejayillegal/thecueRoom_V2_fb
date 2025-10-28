
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

const ADMIN_USERS = [
  {
    email: 'dejayillegal@gmail.com',
    password: 'Closer@82', // In production, this should be hashed
    uid: 'admin-001',
    role: 'admin'
  }
];

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
  const user = ADMIN_USERS.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return null;
  }
  
  return {
    uid: user.uid,
    email: user.email,
    role: user.role
  };
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
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
