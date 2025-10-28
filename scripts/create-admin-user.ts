
import { adminAuth } from '../src/lib/firebaseAdmin';

async function createAdminUser() {
  const email = 'dejayillegal@gmail.com';
  const password = 'Closer@82';
  
  try {
    if (!adminAuth) {
      console.error('❌ Firebase Admin SDK not initialized');
      process.exit(1);
    }

    // Check if user already exists
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
      console.log('✅ User already exists:', user.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create the user
        user = await adminAuth.createUser({
          email,
          password,
          emailVerified: true,
          disabled: false,
        });
        console.log('✅ Admin user created successfully!');
        console.log('User ID:', user.uid);
        console.log('Email:', user.email);
      } else {
        throw error;
      }
    }

    // Set custom claims to mark as admin
    await adminAuth.setCustomUserClaims(user.uid, {
      admin: true,
      role: 'admin',
    });
    
    console.log('✅ Admin privileges granted');
    console.log('\n📋 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n✨ You can now sign in at the application');
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
