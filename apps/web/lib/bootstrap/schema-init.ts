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
      
      const { execSync } = await import('child_process');
      try {
        // Use --force for non-interactive mode
        execSync('pnpm --filter db exec drizzle-kit push --force', { 
          stdio: 'inherit',
          env: { ...process.env, CI: 'true' }
        });
        console.log('[Bootstrap] Schema migration completed successfully');
        return { success: true, message: 'Schema initialized successfully' };
      } catch (migrateError: any) {
        console.error('[Bootstrap] Schema migration failed:', migrateError);
        return { success: false, message: 'Database schema initialization failed' };
      }
    }

    return { success: true, message: 'Schema verified' };
  } catch (error: any) {
    console.error('[Bootstrap] Schema check failed:', error);
    return { success: false, message: error?.message || 'Unknown error' };
  }
}
