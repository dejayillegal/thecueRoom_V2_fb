#!/usr/bin/env tsx

/**
 * Setup script for thecueRoom V2
 * Runs migrations and seeds the database with admin user and sources
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command: string, description: string) {
  console.log(`\n🔧 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error: any) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function setup() {
  console.log('🚀 Starting thecueRoom V2 setup...\n');
  console.log('═'.repeat(60));

  // Step 1: Run database migrations
  const migrateSuccess = await runCommand(
    'pnpm migrate',
    'Running database migrations'
  );

  if (!migrateSuccess) {
    console.log('\n⚠️  Migration failed. Continuing with setup...');
  }

  // Step 2: Seed admin user
  const adminSuccess = await runCommand(
    'pnpm seed:admin',
    'Seeding admin user'
  );

  if (!adminSuccess) {
    console.error('\n❌ Admin seeding failed. Please check your DATABASE_URL');
    process.exit(1);
  }

  // Step 3: Seed forum categories
  const forumCategoriesSuccess = await runCommand(
    'tsx scripts/seed-forum-data.ts',
    'Seeding forum categories and initial content'
  );

  if (!forumCategoriesSuccess) {
    console.log('\n⚠️  Forum categories seeding failed. You can run it manually later with: tsx scripts/seed-forum-data.ts');
  }

  // Step 4: Seed test users and forum content
  const testUsersSuccess = await runCommand(
    'tsx scripts/seed-test-users.ts',
    'Seeding test users and community posts'
  );

  if (!testUsersSuccess) {
    console.log('\n⚠️  Test users seeding failed. You can run it manually later with: tsx scripts/seed-test-users.ts');
  }

  // Step 5: Seed news sources
  const sourcesSuccess = await runCommand(
    'pnpm seed:sources',
    'Seeding news sources'
  );

  if (!sourcesSuccess) {
    console.log('\n⚠️  Sources seeding failed. You can run it manually later with: pnpm seed:sources');
  }

  // Step 6: Run initial feed ingestion
  console.log('\n📰 Fetching initial news feeds (this may take a minute)...');
  const ingestSuccess = await runCommand(
    'pnpm ingest',
    'Ingesting feeds from all sources'
  );

  if (!ingestSuccess) {
    console.log('\n⚠️  Feed ingestion failed. You can run it manually later with: pnpm ingest');
    console.log('   Note: Make sure your news sources are properly configured in data/sources.json');
  }

  // Step 7: Verify verification worker setup
  console.log('\n🔍 Verifying artist verification worker setup...');
  const verifyDirSuccess = await runCommand(
    'mkdir -p /tmp/thecueroom/verify',
    'Creating verification temp directory'
  );

  if (!verifyDirSuccess) {
    console.log('\n⚠️  Could not create verification temp directory');
  }

  // Step 8: Test database connectivity
  console.log('\n🔌 Testing database connectivity...');
  const dbTestSuccess = await runCommand(
    'tsx -e "import { getDbClient } from \'./packages/db/client\'; getDbClient(); console.log(\'✅ Database connected\')"',
    'Testing database connection'
  );

  if (!dbTestSuccess) {
    console.log('\n⚠️  Database connectivity test failed. Please check your DATABASE_URL');
  }

  console.log('\n═'.repeat(60));
  console.log('✨ Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Run "pnpm dev" to start the development server');
  console.log('  2. Visit /dashboard and sign in with admin credentials');
  console.log('  3. Check /community/forum to see test users and discussions');
  console.log('  4. Check the news feeds and admin panel\n');
  console.log('💡 Tips:');
  console.log('   • Run "pnpm ingest" periodically to fetch new feeds');
  console.log('   • Test user password: Test123!');
  console.log('═'.repeat(60));
}

setup().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
