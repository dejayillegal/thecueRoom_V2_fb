
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
  
  try {
    // Step 1: Check database connection
    await checkDatabase();
    
    // Step 2: Run migrations
    await runCommand(
      'cd packages/db && pnpm drizzle-kit push',
      'Step 1/4: Running database migrations'
    );
    
    // Step 3: Seed sources
    await runCommand(
      'tsx scripts/seed-sources.ts',
      'Step 2/4: Seeding news sources'
    );
    
    // Step 4: Create admin user
    await runCommand(
      'tsx scripts/create-admin-user.ts',
      'Step 3/4: Creating admin user'
    );
    
    // Step 5: Run initial ingestion
    await runCommand(
      'tsx scripts/enhanced-ingest.ts',
      'Step 4/4: Running initial feed ingestion'
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ Initialization Complete!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  ✓ Database migrations applied');
    console.log('  ✓ News sources seeded');
    console.log('  ✓ Admin user created');
    console.log('  ✓ Initial feeds ingested');
    console.log('\n🎉 Your thecueRoom instance is ready!\n');
    console.log('🔐 Admin Login:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'dejayillegal@gmail.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Closer@82'}`);
    console.log('\n💡 Next steps:');
    console.log('   1. The server is already running');
    console.log('   2. Visit the app in the webview');
    console.log('   3. Sign in with admin credentials\n');
    
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
