
import { getDbClient } from '../packages/db/client';
import { users } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function setArtistPassword() {
  const db = getDbClient();
  
  const email = 'artist@example.com';
  const password = 'Artist123!'; // Simple test password
  
  // Hash the password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Update the user
  const result = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, email))
    .returning();

  if (result.length > 0) {
    console.log('✅ Password set for:', result[0].email);
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role:', result[0].role);
    console.log('   Status:', result[0].verificationStatus);
  } else {
    console.log('❌ Artist account not found');
  }
  
  process.exit(0);
}

setArtistPassword().catch(console.error);
