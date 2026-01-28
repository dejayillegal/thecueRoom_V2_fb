import { getDbClient } from '@thecueroom/db/client';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

interface SeedAccount {
  email: string;
  password: string;
  username: string;
  role: 'admin' | 'user' | 'artist';
  verified: boolean;
}

const REQUIRED_ACCOUNTS: SeedAccount[] = [
  {
    email: 'dejayillegal@gmail.com',
    password: 'Closer@82',
    username: 'admin',
    role: 'admin',
    verified: true,
  },
  {
    email: 'test1@thecueroom.dev',
    password: 'Test@123',
    username: 'test1',
    role: 'user',
    verified: true,
  },
  {
    email: 'test2@thecueroom.dev',
    password: 'Test@123',
    username: 'test2',
    role: 'user',
    verified: true,
  },
];

let seedingComplete = false;
let seedingAttempted = false;

export async function ensureRequiredAccounts(): Promise<{ success: boolean; message: string }> {
  if (seedingComplete) {
    return { success: true, message: 'Already seeded' };
  }

  if (seedingAttempted) {
    return { success: false, message: 'Seeding already attempted, database may not be ready' };
  }

  seedingAttempted = true;
  console.log('[Bootstrap] Starting required account seeding...');

  try {
    const db = getDbClient();

    const tableCheck = await db.execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists`
    );
    
    const tableExists = tableCheck.rows && tableCheck.rows.length > 0 && (tableCheck.rows[0] as any).exists;
    
    if (!tableExists) {
      console.log('[Bootstrap] Users table does not exist yet. Skipping seed until migrations are run.');
      seedingAttempted = false;
      return { success: false, message: 'Users table does not exist' };
    }

    for (const account of REQUIRED_ACCOUNTS) {
      const normalizedEmail = account.email.toLowerCase();
      
      const existingUsers = await db.execute(
        sql`SELECT id, role, verified FROM users WHERE email = ${normalizedEmail} LIMIT 1`
      );

      if (existingUsers.rows && existingUsers.rows.length > 0) {
        const existingUser = existingUsers.rows[0] as { id: string; role: string; verified: boolean };
        
        const needsUpdate = 
          existingUser.role !== account.role || 
          existingUser.verified !== account.verified;

        if (needsUpdate) {
          const passwordHash = await bcrypt.hash(account.password, 10);
          
          await db.execute(
            sql`UPDATE users SET role = ${account.role}, verified = ${account.verified}, password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${existingUser.id}::uuid`
          );

          console.log(`[Bootstrap] Updated account: ${normalizedEmail} (role=${account.role}, verified=${account.verified})`);
        } else {
          const passwordHash = await bcrypt.hash(account.password, 10);
          await db.execute(
            sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${existingUser.id}::uuid`
          );
          console.log(`[Bootstrap] Account exists, refreshed password: ${normalizedEmail}`);
        }
      } else {
        const passwordHash = await bcrypt.hash(account.password, 10);

        const result = await db.execute(
          sql`INSERT INTO users (email, username, password_hash, role, verified, created_at, updated_at) 
              VALUES (${normalizedEmail}, ${account.username}, ${passwordHash}, ${account.role}, ${account.verified}, NOW(), NOW()) 
              RETURNING id`
        );

        if (result.rows && result.rows.length > 0) {
          const newUserId = (result.rows[0] as { id: string }).id;
          
          await db.execute(
            sql`INSERT INTO profiles (user_id, display_name, created_at, updated_at) 
                VALUES (${newUserId}::uuid, ${account.username}, NOW(), NOW())`
          );

          console.log(`[Bootstrap] Created account: ${normalizedEmail} (role=${account.role}, verified=${account.verified})`);
        }
      }
    }

    seedingComplete = true;
    console.log('[Bootstrap] Required account seeding complete. All accounts are login-ready.');
    return { success: true, message: 'Seeding complete' };
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.log('[Bootstrap] Database tables not ready. Will retry on next request.');
      seedingAttempted = false;
      return { success: false, message: 'Tables not ready' };
    }
    console.error('[Bootstrap] FAILED to seed required accounts:', error);
    return { success: false, message: error?.message || 'Unknown error' };
  }
}

export function isBootstrapComplete(): boolean {
  return seedingComplete;
}

export function resetBootstrapState(): void {
  seedingComplete = false;
  seedingAttempted = false;
}
