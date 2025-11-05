
import { execSync } from 'child_process';
import { getDbClient } from '../packages/db';
import { sql } from 'drizzle-orm';

async function runCommand(command: string, description: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`\n✅ ${description} - Complete\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} - Failed\n`);
    throw error;
  }
}

async function checkDatabase() {
  console.log('\n🔍 Checking database connection...\n');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    const db = getDbClient();
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function main() {
  console.log('\n🚀 thecueRoom Full Initialization\n');
  console.log(`${'='.repeat(60)}\n`);

  const testMode = process.env.TEST_ACCOUNTS === 'true';
  const testEnv = testMode ? 'TEST_MODE=true TEST_ACCOUNTS=true ' : '';

  try {
    // Step 1: Check database connection
    await checkDatabase();

    // Step 2: Run migrations
    await runCommand(
      'pnpm --filter @thecueroom/db migrate',
      'Step 1/9: Running database migrations'
    );

    // Step 3: Seed sources
    await runCommand(
      `${testEnv}pnpm tsx scripts/seed-sources.ts`,
      'Step 2/9: Seeding news sources'
    );

    // Step 4: Create admin user
    await runCommand(
      `${testEnv}pnpm tsx scripts/seed-admin.ts`,
      'Step 3/9: Creating admin user'
    );

    // Step 5: Seed test accounts
    await runCommand(
      `${testEnv}pnpm tsx scripts/seed-test-accounts.ts`,
      'Step 4/9: Seeding test user accounts'
    );

    // Step 6: Seed forum data
    await runCommand(
      `${testEnv}pnpm tsx scripts/seed-forum-data.ts`,
      'Step 5/9: Seeding forum categories and threads'
    );

    // Step 7: Seed gigs data
    await runCommand(
      `${testEnv}pnpm tsx scripts/seed-gigs-data.ts`,
      'Step 6/9: Seeding gigs and events'
    );

    // Step 8: Seed playlist data (before dashboard to ensure it exists)
    await runCommand(
      `${testEnv}pnpm tsx scripts/seed-playlist.ts`,
      'Step 7/9: Seeding weekly playlist'
    );

    // Step 9: Seed dashboard data
    await runCommand(
      `${testEnv}pnpm tsx scripts/seed-dashboard-data.ts`,
      'Step 8/9: Seeding dashboard test data'
    );

    // Step 10: Run initial ingestion
    await runCommand(
      `${testEnv}pnpm tsx scripts/enhanced-ingest.ts`,
      'Step 9/9: Running initial feed ingestion'
    );

    console.log('\n' + '='.repeat(60));
    console.log('✨ Initialization Complete!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  ✓ Database migrations applied');
    console.log('  ✓ News sources seeded');
    console.log('  ✓ Admin user created');
    console.log('  ✓ Test accounts created (artists & users)');
    console.log('  ✓ Forum data seeded (categories, threads, replies)');
    console.log('  ✓ Gigs and events seeded');
    console.log('  ✓ Dashboard data seeded');
    console.log('  ✓ Weekly playlist seeded');
    console.log('  ✓ Initial feeds ingested');
    console.log('\n🎉 Your thecueRoom instance is ready!\n');
    console.log('🔐 Admin Login:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'dejayillegal@gmail.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Closer@82'}`);
    
    if (testMode) {
      console.log('\n🧪 Test Mode Enabled:');
      console.log('   All test accounts created with password: Test123!');
    }
    
    console.log('\n💡 Next steps:');
    console.log('   1. The server is already running');
    console.log('   2. Visit the app in the webview');
    console.log('   3. Sign in with admin credentials');
    console.log('   4. Check /music/weekly for the seeded playlist\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure DATABASE_URL is set in Secrets');
    console.error('   2. Check database is accessible');
    console.error('   3. Review error messages above\n');
    process.exit(1);
  }
}

main();
