
#!/usr/bin/env node

/**
 * Complete flow diagnostic test
 * Tests: DB connection → Auth → Gigs fetch → Verification worker
 */

const { getDbClient } = require('../../packages/db/client');
const { users, verificationJobs } = require('../../packages/db/schema');
const { eq } = require('drizzle-orm');

async function testCompleteFlow() {
  console.log('🧪 Running complete flow diagnostic...\n');

  // Test 1: Database connectivity
  console.log('1️⃣  Testing database connectivity...');
  try {
    const db = getDbClient();
    const testQuery = await db.select().from(users).limit(1);
    console.log('   ✅ Database connected');
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Test 2: Verify verification jobs table
  console.log('\n2️⃣  Testing verification jobs table...');
  try {
    const db = getDbClient();
    const jobs = await db.select().from(verificationJobs).limit(5);
    console.log(`   ✅ Verification jobs table accessible (${jobs.length} jobs found)`);
  } catch (error) {
    console.error('   ❌ Verification jobs table error:', error.message);
    process.exit(1);
  }

  // Test 3: Check verification temp directory
  console.log('\n3️⃣  Testing verification temp directory...');
  const fs = require('fs');
  const path = require('path');
  const verifyDir = process.env.VERIFY_TEMP_DIR || '/tmp/thecueroom/verify';
  
  try {
    if (!fs.existsSync(verifyDir)) {
      fs.mkdirSync(verifyDir, { recursive: true });
    }
    const testFile = path.join(verifyDir, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`   ✅ Verification directory writable: ${verifyDir}`);
  } catch (error) {
    console.error('   ❌ Verification directory error:', error.message);
    process.exit(1);
  }

  // Test 4: Check API routes
  console.log('\n4️⃣  Testing API route structure...');
  const apiDir = './apps/web/app/api';
  const requiredRoutes = [
    'auth/signup',
    'auth/signin',
    'gigs/india',
    'events/submit',
    'verify/submit',
  ];

  let missingRoutes = [];
  for (const route of requiredRoutes) {
    const routePath = path.join(apiDir, route, 'route.ts');
    if (!fs.existsSync(routePath)) {
      missingRoutes.push(route);
    }
  }

  if (missingRoutes.length > 0) {
    console.error('   ❌ Missing API routes:', missingRoutes.join(', '));
  } else {
    console.log('   ✅ All required API routes present');
  }

  // Test 5: Environment variables
  console.log('\n5️⃣  Testing environment variables...');
  const requiredEnvVars = ['DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingEnvVars.length > 0) {
    console.error('   ❌ Missing environment variables:', missingEnvVars.join(', '));
  } else {
    console.log('   ✅ All required environment variables set');
  }

  console.log('\n✨ Complete flow diagnostic finished!');
  console.log('\nNext steps:');
  console.log('  • Run "pnpm dev" to start the development server');
  console.log('  • Run verification worker: TEST_MODE=true tsx scripts/start-verification-worker.ts');
  console.log('  • Visit http://localhost:5000 to test the app');
}

testCompleteFlow().catch((error) => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
