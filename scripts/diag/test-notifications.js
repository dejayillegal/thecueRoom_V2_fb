
#!/usr/bin/env node

const baseUrl = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : 'http://localhost:5000';

async function testNotifications() {
  console.log('🔔 Testing Notification System...\n');

  // Test 1: List notifications
  console.log('1. Testing notification list endpoint...');
  try {
    const res = await fetch(`${baseUrl}/api/notifications/list?filter=all`, {
      headers: { 'x-user-id': 'test-user-id' }
    });
    const data = await res.json();
    console.log(`✅ Found ${data.notifications?.length || 0} notifications`);
    console.log(`   Unread: ${data.unreadCount || 0}`);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
  }

  // Test 2: Filter by type
  console.log('\n2. Testing notification filters...');
  const filters = ['all', 'unread', 'verification', 'promo'];
  for (const filter of filters) {
    try {
      const res = await fetch(`${baseUrl}/api/notifications/list?filter=${filter}`, {
        headers: { 'x-user-id': 'test-user-id' }
      });
      const data = await res.json();
      console.log(`   ${filter}: ${data.notifications?.length || 0} items`);
    } catch (err) {
      console.log(`   ${filter}: Failed`);
    }
  }

  // Test 3: Mark as read
  console.log('\n3. Testing mark as read...');
  try {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-id'
      },
      body: JSON.stringify({ markAll: true })
    });
    console.log(res.ok ? '✅ Mark all as read successful' : '❌ Failed');
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
  }

  console.log('\n✅ Notification tests complete\n');
}

testNotifications().catch(console.error);
