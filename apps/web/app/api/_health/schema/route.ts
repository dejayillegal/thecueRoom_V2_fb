import { NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDbClient();
  const requiredTables = [
    'users',
    'profiles',
    'login_attempts',
    'forumThreads',
    'comments'
  ];

  const tableStatus: Record<string, boolean> = {
    users: false,
    profiles: false,
    login_attempts: false,
    forumThreads: false,
    comments: false
  };

  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (${sql.join(requiredTables.map(t => sql.raw(`'${t}'`)), sql`, `)})
    `);

    const existingTables = result.rows.map((row: any) => row.table_name);
    
    requiredTables.forEach(table => {
      tableStatus[table] = existingTables.includes(table);
    });

  } catch (error) {
    console.error('Schema check error:', error);
    // Continue with all false if error
  }

  const ready = Object.values(tableStatus).every(v => v === true);

  return NextResponse.json({
    ready,
    tables: tableStatus
  });
}
