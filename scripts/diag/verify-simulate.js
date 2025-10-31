
const { getDbClient } = require('@thecueroom/db/client');
const { verificationJobs } = require('@thecueroom/db/schema');
const { eq } = require('drizzle-orm');

async function simulate() {
  console.log('🧪 Verification Simulation Test');
  console.log('================================\n');

  const testUrls = [
    'https://soundcloud.com/test-accept',
    'https://soundcloud.com/test-reject',
    'https://instagram.com/test-review',
    'https://bandcamp.com/test-accept',
  ];

  const db = getDbClient();
  const jobIds = [];

  // Create test jobs
  console.log('Creating test jobs...');
  for (const url of testUrls) {
    const response = await fetch('http://localhost:5000/api/verify/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000000',
        profileUrl: url,
      }),
    });

    if (response.ok) {
      const { jobId } = await response.json();
      jobIds.push(jobId);
      console.log(`✓ Created job ${jobId} for ${url}`);
    }
  }

  console.log('\n⏳ Waiting for worker to process jobs...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Check results
  console.log('\n📊 Results:');
  for (const jobId of jobIds) {
    const [job] = await db.select().from(verificationJobs).where(eq(verificationJobs.id, jobId));
    
    if (job) {
      console.log(`\nJob ${jobId}:`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Decision: ${job.decision || 'pending'}`);
      console.log(`  Score: ${job.score || 'N/A'}`);
    }
  }

  console.log('\n✅ Simulation complete');
}

simulate().catch(err => {
  console.error('Simulation error:', err);
  process.exit(1);
});
