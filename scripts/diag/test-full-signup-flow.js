
#!/usr/bin/env node

const baseUrl = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : 'http://localhost:5000';

async function testFullSignupFlow() {
  console.log('🚀 Testing Full Signup & Verification Flow...\n');

  const testUser = {
    firstName: 'Test',
    lastName: 'Artist',
    artistName: `TestDJ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!',
    region: 'London, UK',
    genre: 'Techno, House',
    socialLinks: ['https://soundcloud.com/testartist'],
  };

  // Step 1: Check availability
  console.log('1. Checking email availability...');
  try {
    const res = await fetch(`${baseUrl}/api/auth/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email', value: testUser.email }),
    });
    const data = await res.json();
    console.log(data.available ? '✅ Email available' : '❌ Email taken');
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
  }

  // Step 2: Sign up
  console.log('\n2. Creating account...');
  let jobId = null;
  try {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    
    if (data.ok) {
      console.log('✅ Account created successfully');
      console.log(`   User ID: ${data.userId}`);
      jobId = data.jobId;
      if (jobId) {
        console.log(`   Verification Job: ${jobId}`);
      }
    } else {
      console.log('❌ Signup failed:', data.error);
    }
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
  }

  // Step 3: Poll verification status
  if (jobId) {
    console.log('\n3. Polling verification status...');
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`${baseUrl}/api/verification/job/${jobId}`);
        const data = await res.json();
        
        console.log(`   Attempt ${attempts + 1}: ${data.status} (${data.progress || 0}%)`);
        
        if (data.status === 'completed') {
          console.log(`✅ Verification complete: ${data.result}`);
          if (data.score) {
            console.log(`   Score: ${data.score}/100`);
          }
          break;
        }
        
        if (data.status === 'failed') {
          console.log(`❌ Verification failed: ${data.error}`);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (err) {
        console.log(`❌ Polling error: ${err.message}`);
        break;
      }
    }
  }

  console.log('\n✅ Full signup flow test complete\n');
}

testFullSignupFlow().catch(console.error);
