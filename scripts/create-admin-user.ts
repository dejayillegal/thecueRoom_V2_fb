import { getDbClient, closeDbClient, schema } from '../packages/db/client';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  const email = 'dejayillegal@gmail.com';
  const password = 'Closer@82';
  
  try {
    const db = getDbClient();
    
    console.log('🔍 Checking if admin user already exists...');
    
    const existingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      if (!user) {
        throw new Error('User data is invalid');
      }
      
      console.log('ℹ️  User already exists with ID:', user.id);
      
      if (user.role !== 'admin') {
        console.log('🔧 Updating user role to admin...');
        await db
          .update(schema.users)
          .set({ role: 'admin' })
          .where(eq(schema.users.id, user.id));
        console.log('✅ User role updated to admin');
      } else {
        console.log('✅ User is already an admin');
      }
      
      console.log('\n📋 Login credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('\n✨ You can now sign in at the application');
      
      await closeDbClient();
      return;
    }
    
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('👤 Creating admin user...');
    const newUsers = await db
      .insert(schema.users)
      .values({
        email,
        username: 'admin',
        passwordHash,
        role: 'admin',
      })
      .returning();
    
    const newUser = newUsers[0];
    if (!newUser) {
      throw new Error('Failed to create user - no data returned');
    }
    
    console.log('✅ Admin user created successfully!');
    console.log('User ID:', newUser.id);
    console.log('Email:', newUser.email);
    console.log('Role:', newUser.role);
    
    console.log('📝 Creating user profile...');
    await db.insert(schema.profiles).values({
      userId: newUser.id,
      displayName: 'Admin',
      aiCredits: 1000,
    });
    console.log('✅ User profile created');
    
    console.log('\n📋 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n✨ You can now sign in at the application');
    
    await closeDbClient();
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    await closeDbClient();
    process.exit(1);
  }
}

createAdminUser();
