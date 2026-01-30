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
    username: 'illegal_mastercue',
    role: 'admin',
    verified: true,
  },
  {
    email: 'dj.phoenix@thecueroom.dev',
    password: 'Artist@123',
    username: 'dj_phoenix',
    role: 'artist',
    verified: true,
  },
  {
    email: 'producer.nova@thecueroom.dev',
    password: 'Artist@123',
    username: 'producer_nova',
    role: 'artist',
    verified: true,
  }
];

let seedingComplete = false;
let retryTimer: NodeJS.Timeout | null = null;

export async function ensureRequiredAccounts(): Promise<{ success: boolean; message: string }> {
  if (seedingComplete) return { success: true, message: 'Already seeded' };

  try {
    const db = getDbClient();
    const tableCheck = await db.execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists`
    );
    
    if (!(tableCheck.rows?.[0] as any)?.exists) {
      console.log('[Bootstrap] Users table missing. Scheduling retry...');
      scheduleRetry();
      return { success: false, message: 'Waiting for schema' };
    }

    console.log('[Bootstrap] Starting required account seeding...');
    for (const account of REQUIRED_ACCOUNTS) {
      const normalizedEmail = account.email.toLowerCase();
      const existing = await db.execute(sql`SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1`);
      const passwordHash = await bcrypt.hash(account.password, 10);

      if (existing.rows?.length > 0) {
        await db.execute(sql`UPDATE users SET role = ${account.role}, verified = ${account.verified}, password_hash = ${passwordHash}, username = ${account.username}, updated_at = NOW() WHERE email = ${normalizedEmail}`);
        console.log(`[Bootstrap] Updated account: ${normalizedEmail}`);
      } else {
        const nameConflict = await db.execute(sql`SELECT id FROM users WHERE username = ${account.username} AND email != ${normalizedEmail} LIMIT 1`);
        if (nameConflict.rows?.length > 0) {
           console.log(`[Bootstrap] Username conflict for ${account.username}. Skipping.`);
           continue;
        }
        const res = await db.execute(sql`INSERT INTO users (email, username, password_hash, role, verified, created_at, updated_at) VALUES (${normalizedEmail}, ${account.username}, ${passwordHash}, ${account.role}, ${account.verified}, NOW(), NOW()) RETURNING id`);
        if (res.rows?.[0]) {
          const userId = (res.rows[0] as any).id;
          // Simple insert for profiles to avoid ON CONFLICT inference issues in bootstrap
          try {
            await db.execute(sql`INSERT INTO profiles (user_id, display_name, created_at, updated_at) VALUES (${userId}::uuid, ${account.username}, NOW(), NOW())`);
          } catch (profileErr) {
            console.log(`[Bootstrap] Profile for ${account.username} might already exist, skipping.`);
          }
          console.log(`[Bootstrap] Created account: ${normalizedEmail}`);
        }
      }
    }

    seedingComplete = true;
    if (retryTimer) clearInterval(retryTimer);
    return { success: true, message: 'Seeding complete' };
  } catch (error: any) {
    console.error('[Bootstrap] FAILED account seed:', error);
    scheduleRetry();
    return { success: false, message: error.message };
  }
}

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setInterval(() => {
    ensureRequiredAccounts().catch(err => console.error('[Bootstrap] Retry error:', err));
  }, 30000); // Retry every 30 seconds
}
