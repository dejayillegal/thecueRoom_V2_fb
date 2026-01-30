import { getDbClient } from '@thecueroom/db/client';
import { sql } from 'drizzle-orm';

let retryTimer: NodeJS.Timeout | null = null;
let schemaVerified = false;

export async function initializeDatabaseSchema(): Promise<{ success: boolean; message: string }> {
  if (schemaVerified) return { success: true, message: 'Schema verified' };

  console.log('[Bootstrap] Checking database schema status...');
  try {
    const db = getDbClient();
    
    // Check if users table exists
    const tableCheck = await db.execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists`
    );
    
    const tableExists = tableCheck.rows && tableCheck.rows.length > 0 && (tableCheck.rows[0] as any).exists;
    
    if (!tableExists) {
      console.log('[Bootstrap] Database schema missing. Scheduling check retry...');
      scheduleCheck();
      return { success: false, message: 'Waiting for schema' };
    }

    schemaVerified = true;
    if (retryTimer) clearInterval(retryTimer);
    console.log('[Bootstrap] Database schema verified.');
    return { success: true, message: 'Schema verified' };
  } catch (error: any) {
    console.error('[Bootstrap] Schema check failed:', error);
    scheduleCheck();
    return { success: false, message: error?.message || 'Unknown error' };
  }
}

function scheduleCheck() {
  if (retryTimer) return;
  retryTimer = setInterval(() => {
    initializeDatabaseSchema().catch(err => console.error('[Bootstrap] Schema retry error:', err));
  }, 30000);
}
