
import { getDbClient } from '../packages/db/client';
import { users } from '../packages/db/schema';
import { eq } from 'drizzle-orm';

async function verifyTestArtist() {
  const db = getDbClient();
  
  // Update artist@example.com to verified status
  const result = await db
    .update(users)
    .set({ 
      verificationStatus: 'verified',
      role: 'artist'
    })
    .where(eq(users.email, 'artist@example.com'))
    .returning();

  if (result.length > 0) {
    console.log('✅ Artist verified:', result[0].email);
    console.log('   Role:', result[0].role);
    console.log('   Status:', result[0].verificationStatus);
  } else {
    console.log('❌ Artist not found. Creating test artist...');
    
    const created = await db.insert(users).values({
      email: 'artist@example.com',
      username: 'testartist',
      displayName: 'Test Artist',
      role: 'artist',
      verificationStatus: 'verified',
      passwordHash: '$2a$10$mockhashedpassword' // Mock hash for testing
    }).returning();
    
    console.log('✅ Created verified artist:', created[0].email);
  }
  
  process.exit(0);
}

verifyTestArtist().catch(console.error);
