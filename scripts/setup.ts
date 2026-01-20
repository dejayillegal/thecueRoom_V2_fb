#!/usr/bin/env tsx

/**
 * Setup script for thecueRoom V2
 * Validates environment, runs migrations, and seeds the database
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

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

  // Step 1: Validate Environment Variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('📝 Please check your .env file.');
    process.exit(1);
  }

  // Step 2: Check Database Connectivity
  console.log('\n🔌 Checking database connectivity...');
  try {
    const { getDbClient } = await import('../packages/db/client');
    const db = getDbClient();
    if (!db) throw new Error('Failed to get database client');
    console.log('✅ Database connected');
  } catch (error: any) {
    console.error('❌ Database connectivity test failed:', error.message);
    console.error('📝 Please check your DATABASE_URL.');
    process.exit(1);
  }

  // Step 3: Run database migrations
  const migrateSuccess = await runCommand(
    'pnpm migrate',
    'Running database migrations'
  );

  if (!migrateSuccess) {
    console.log('\n⚠️  Migration failed. Continuing with setup...');
  }

  // Step 4: Seed admin user
  const adminSuccess = await runCommand(
    'pnpm seed:admin',
    'Seeding admin user'
  );

  if (!adminSuccess) {
    console.error('\n❌ Admin seeding failed.');
    process.exit(1);
  }

  // Step 5: Seed news sources
  const sourcesSuccess = await runCommand(
    'pnpm seed:sources',
    'Seeding news sources'
  );

  if (!sourcesSuccess) {
    console.log('\n⚠️  Sources seeding failed.');
  }

  // Step 6: Run initial feed ingestion
  console.log('\n📰 Fetching initial news feeds (this may take a minute)...');
  const ingestSuccess = await runCommand(
    'pnpm ingest',
    'Ingesting feeds from all sources'
  );

  if (!ingestSuccess) {
    console.log('\n⚠️  Feed ingestion failed.');
  }

  // Final success message
  console.log('\n═'.repeat(60));
  console.log('✨ Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Run "pnpm dev" to start the development server');
  console.log('  2. Visit /dashboard and sign in with admin credentials\n');
  console.log('═'.repeat(60));
}

setup().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
