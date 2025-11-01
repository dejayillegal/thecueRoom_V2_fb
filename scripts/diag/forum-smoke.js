
#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function runForumSmoke() {
  console.log('🧪 Running forum smoke test...\n');

  try {
    // 1. Fetch threads
    console.log('1️⃣  Fetching threads list...');
    const threadsRes = await fetch(`${BASE_URL}/api/forum/thread?limit=3`);
    const threadsData = await threadsRes.json();
    
    if (!threadsData.threads || !Array.isArray(threadsData.threads)) {
      throw new Error('Invalid threads response shape');
    }
    
    console.log(`✅ Fetched ${threadsData.threads.length} threads\n`);

    if (threadsData.threads.length === 0) {
      console.log('⚠️  No threads to test with. Skipping detail test.\n');
      return;
    }

    // 2. Fetch first thread detail
    const firstThread = threadsData.threads[0];
    console.log(`2️⃣  Fetching thread detail: ${firstThread.id}`);
    
    const threadRes = await fetch(`${BASE_URL}/api/forum/thread/${firstThread.id}`);
    const threadData = await threadRes.json();
    
    if (!threadData.thread) {
      throw new Error('Invalid thread detail response');
    }
    
    console.log(`✅ Thread loaded: "${threadData.thread.title}"`);
    console.log(`   Replies: ${threadData.replies?.length || 0}\n`);

    // 3. Test reply endpoint (dry run - don't actually post in smoke test)
    console.log('3️⃣  Testing reply endpoint structure...');
    console.log(`   POST /api/forum/thread/${firstThread.id}/reply`);
    console.log('   (Skipped actual POST in smoke test)\n');

    // 4. Test like endpoint structure
    console.log('4️⃣  Testing like endpoint structure...');
    console.log(`   POST /api/forum/thread/${firstThread.id}/like`);
    console.log('   (Skipped actual POST in smoke test)\n');

    console.log('✅ Forum smoke test PASSED\n');
    
  } catch (error) {
    console.error('❌ Forum smoke test FAILED:', error.message);
    process.exit(1);
  }
}

runForumSmoke();
