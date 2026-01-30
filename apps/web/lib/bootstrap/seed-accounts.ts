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
  },
  {
    email: 'mixer.zen@thecueroom.dev',
    password: 'Artist@123',
    username: 'mixer_zen',
    role: 'artist',
    verified: true,
  },
  {
    email: 'techno.wizard@thecueroom.dev',
    password: 'Artist@123',
    username: 'techno_wizard',
    role: 'artist',
    verified: true,
  },
  {
    email: 'liquid.bass@thecueroom.dev',
    password: 'Artist@123',
    username: 'liquidbass',
    role: 'artist',
    verified: true,
  },
  {
    email: 'community.manager@thecueroom.dev',
    password: 'Staff@123',
    username: 'community_manager',
    role: 'user',
    verified: true,
  },
];

let seedingComplete = false;
let seedingAttempted = false;

export async function ensureRequiredAccounts(): Promise<{ success: boolean; message: string }> {
  if (seedingComplete) return { success: true, message: 'Already seeded' };
  if (seedingAttempted) return { success: false, message: 'Seeding already attempted' };

  seedingAttempted = true;
  console.log('[Bootstrap] Starting required account seeding...');

  try {
    const db = getDbClient();

    const tableCheck = await db.execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists`
    );
    
    if (!(tableCheck.rows?.[0] as any)?.exists) {
      console.log('[Bootstrap] Users table does not exist. Skipping seeding.');
      return { success: false, message: 'Users table missing' };
    }

    for (const account of REQUIRED_ACCOUNTS) {
      const normalizedEmail = account.email.toLowerCase();
      const existing = await db.execute(sql`SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1`);

      const passwordHash = await bcrypt.hash(account.password, 10);
      if (existing.rows?.length > 0) {
        await db.execute(sql`UPDATE users SET role = ${account.role}, verified = ${account.verified}, password_hash = ${passwordHash}, username = ${account.username}, updated_at = NOW() WHERE email = ${normalizedEmail}`);
        console.log(`[Bootstrap] Updated account: ${normalizedEmail}`);
      } else {
        // Check if username exists for another email to avoid conflict
        const nameConflict = await db.execute(sql`SELECT id FROM users WHERE username = ${account.username} AND email != ${normalizedEmail} LIMIT 1`);
        if (nameConflict.rows?.length > 0) {
           console.log(`[Bootstrap] Username conflict for ${account.username}. Skipping.`);
           continue;
        }
        const res = await db.execute(sql`INSERT INTO users (email, username, password_hash, role, verified, created_at, updated_at) VALUES (${normalizedEmail}, ${account.username}, ${passwordHash}, ${account.role}, ${account.verified}, NOW(), NOW()) RETURNING id`);
        if (res.rows?.[0]) {
          const userId = (res.rows[0] as any).id;
          await db.execute(sql`INSERT INTO profiles (user_id, display_name, created_at, updated_at) VALUES (${userId}::uuid, ${account.username}, NOW(), NOW()) ON CONFLICT (user_id) DO NOTHING`);
          console.log(`[Bootstrap] Created account: ${normalizedEmail}`);
        }
      }
    }

    seedingComplete = true;
    return { success: true, message: 'Seeding complete' };
  } catch (error: any) {
    console.error('[Bootstrap] FAILED account seed:', error);
    seedingAttempted = false;
    return { success: false, message: error.message };
  }
}
