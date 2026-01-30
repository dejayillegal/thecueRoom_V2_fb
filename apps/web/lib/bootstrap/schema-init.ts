import { getDbClient } from '@thecueroom/db/client';
import { sql } from 'drizzle-orm';

export async function initializeDatabaseSchema(): Promise<{ success: boolean; message: string }> {
  console.log('[Bootstrap] Checking database schema status...');
  try {
    const db = getDbClient();
    
    // Check if users table exists
    const tableCheck = await db.execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists`
    );
    
    const tableExists = tableCheck.rows && tableCheck.rows.length > 0 && (tableCheck.rows[0] as any).exists;
    
    if (!tableExists) {
      console.log('[Bootstrap] Database schema missing. Initializing tables...');
      
      // In a real production app, we would use migrations. 
      // For this environment, we can trigger a schema push if we're in a cold start.
      // However, instrumentation runs within the Next.js process, and we shouldn't 
      // spawn shell commands like 'drizzle-kit push' here as it might be unstable.
      
      return { success: false, message: 'Database schema not initialized. Please run pnpm --filter db migrate.' };
    }

    return { success: true, message: 'Schema verified' };
  } catch (error: any) {
    console.error('[Bootstrap] Schema check failed:', error);
    return { success: false, message: error?.message || 'Unknown error' };
  }
}
