
#!/usr/bin/env node

const baseUrl = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : 'http://localhost:5000';

async function testSocialPromo() {
  console.log('🎨 Testing Social Promo System...\n');

  // Test 1: Generate promo
  console.log('1. Testing promo generation...');
  try {
    const res = await fetch(`${baseUrl}/api/ai/social-promo/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'release',
        title: 'New EP Out Now',
        description: 'My latest techno EP is live on all platforms!',
        platforms: ['instagram', 'twitter'],
        themeColor: '#D1FF3D',
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Promo generated successfully');
      console.log(`   ID: ${data.id}`);
      console.log(`   Caption: ${data.content?.caption?.substring(0, 50)}...`);
      console.log(`   Tags: ${data.content?.tags?.slice(0, 3).join(', ')}`);
    } else {
      console.log('❌ Generation failed:', res.status);
    }
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
  }

  console.log('\n✅ Social promo tests complete\n');
}

testSocialPromo().catch(console.error);
