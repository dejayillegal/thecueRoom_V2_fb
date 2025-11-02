
#!/usr/bin/env node

/**
 * Automated signup API checks via curl
 */

const BASE_URL = process.env.BASE_URL || 'http://0.0.0.0:5000';

async function checkSignupAPI() {
  console.log('🧪 Testing Signup API\n');
  console.log('═'.repeat(60));

  // Test 1: Normal user signup
  console.log('\n1️⃣  Testing normal user signup...');
  try {
    const normalUserResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: `testuser+${Date.now()}@example.test`,
        password: 'Str0ng!Passw0rd',
        confirmPassword: 'Str0ng!Passw0rd',
        username: `testuser${Date.now()}`,
        isArtist: false,
      }),
    });

    const normalUserData = await normalUserResponse.json();
    
    if (normalUserData.ok && normalUserData.userId && normalUserData.role === 'user') {
      console.log('   ✅ Normal user created successfully');
      console.log(`      User ID: ${normalUserData.userId}`);
      console.log(`      Role: ${normalUserData.role}`);
    } else {
      console.log('   ❌ Normal user signup failed:', normalUserData);
    }
  } catch (error) {
    console.error('   ❌ Normal user signup error:', error.message);
  }

  // Test 2: Artist signup
  console.log('\n2️⃣  Testing artist signup...');
  try {
    const artistResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Artist',
        email: `artist+${Date.now()}@example.test`,
        password: 'Str0ng!Passw0rd',
        confirmPassword: 'Str0ng!Passw0rd',
        username: `artist${Date.now()}`,
        artistName: 'Test Artist',
        isArtist: true,
        profileUrl: 'https://soundcloud.com/test-artist',
        region: 'Berlin, EU',
        genre: 'Techno, House',
      }),
    });

    const artistData = await artistResponse.json();
    
    if (artistData.ok && artistData.userId && artistData.role === 'artist') {
      console.log('   ✅ Artist created successfully');
      console.log(`      User ID: ${artistData.userId}`);
      console.log(`      Role: ${artistData.role}`);
      console.log(`      Job ID: ${artistData.jobId || 'N/A'}`);
      
      // Test 3: Poll verification job if exists
      if (artistData.jobId) {
        console.log('\n3️⃣  Polling verification job...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const jobResponse = await fetch(`${BASE_URL}/api/verification/job/${artistData.jobId}`);
        const jobData = await jobResponse.json();
        
        console.log(`   Status: ${jobData.status || 'unknown'}`);
        console.log(`   Progress: ${jobData.progress || 0}%`);
        if (jobData.result) {
          console.log(`   Decision: ${jobData.result.decision || 'pending'}`);
          console.log(`   Score: ${jobData.result.score || 0}`);
        }
      }
    } else {
      console.log('   ❌ Artist signup failed:', artistData);
    }
  } catch (error) {
    console.error('   ❌ Artist signup error:', error.message);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n✨ Signup API checks complete!');
}

checkSignupAPI().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
