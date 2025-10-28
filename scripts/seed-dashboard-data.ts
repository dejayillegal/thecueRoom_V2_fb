import { db } from '../packages/db';
import { users, profiles, gigs, forumThreads, memes } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedDashboardData() {
  console.log('🌱 Seeding dashboard test data...\n');

  try {
    const adminEmail = 'dejayillegal@gmail.com';
    const adminPassword = 'Closer@82';

    const existingUsers = await db.select().from(users).where(eq(users.email, adminEmail));
    
    let adminUser;
    if (existingUsers.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const [newUser] = await db.insert(users).values({
        email: adminEmail,
        passwordHash,
        role: 'admin',
      }).returning();
      adminUser = newUser;
      console.log('✅ Created admin user:', adminEmail);

      await db.insert(profiles).values({
        userId: adminUser.id,
        displayName: 'DJ Illegal',
        bio: 'Electronic music producer and DJ',
        aiCredits: 100,
      });
      console.log('✅ Created admin profile');
    } else {
      adminUser = existingUsers[0];
      console.log('✅ Admin user already exists');
    }

    const testUsers = [
      { email: 'dj.hollow@example.com', displayName: 'DJ Hollow' },
      { email: 'mara.flux@example.com', displayName: 'Mara Flux' },
      { email: 'basement22@example.com', displayName: 'Basement22' },
      { email: 'linx.audio@example.com', displayName: 'Linx Audio' },
    ];

    const createdUsers = [];
    for (const testUser of testUsers) {
      const existing = await db.select().from(users).where(eq(users.email, testUser.email));
      
      if (existing.length === 0) {
        const passwordHash = await bcrypt.hash('test123', 10);
        const [newUser] = await db.insert(users).values({
          email: testUser.email,
          passwordHash,
          role: 'user',
        }).returning();
        
        await db.insert(profiles).values({
          userId: newUser.id,
          displayName: testUser.displayName,
          aiCredits: 100,
        });
        
        createdUsers.push(newUser);
        console.log(`✅ Created user: ${testUser.displayName}`);
      } else {
        createdUsers.push(existing[0]);
      }
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 0, 0, 0);

    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(1, 0, 0, 0);

    const existingGigs = await db.select().from(gigs);
    if (existingGigs.length === 0 && createdUsers.length > 0) {
      await db.insert(gigs).values([
        {
          userId: createdUsers[0].id,
          title: 'Undercurrent x 303',
          description: 'Underground techno night featuring local and international artists',
          venue: 'De School',
          location: 'Amsterdam',
          startTime: tomorrow,
          status: 'approved',
        },
        {
          userId: createdUsers[2]?.id || createdUsers[0].id,
          title: 'Vault Rave',
          description: 'Secret location warehouse party',
          venue: 'TBA',
          location: 'Berlin',
          startTime: dayAfter,
          status: 'pending',
        },
      ]);
      console.log('✅ Created test gigs');
    }

    const existingThreads = await db.select().from(forumThreads);
    if (existingThreads.length === 0 && createdUsers.length > 0) {
      await db.insert(forumThreads).values([
        {
          userId: createdUsers[0].id,
          title: 'New mix: Subfloor 02',
          content: 'Just dropped a new techno mix focusing on deep, hypnotic sounds. Check it out!',
          tags: ['techno', 'mix', 'deep'],
          upvotes: 12,
          commentCount: 3,
        },
        {
          userId: createdUsers[1]?.id || createdUsers[0].id,
          title: 'Cover art concept for upcoming EP',
          content: 'Working on visual concepts for my next release. Would love to get feedback from the community.',
          tags: ['art', 'design', 'feedback'],
          upvotes: 8,
          commentCount: 5,
        },
      ]);
      console.log('✅ Created test forum threads');
    }

    const existingMemes = await db.select().from(memes);
    if (existingMemes.length === 0 && createdUsers.length > 0) {
      await db.insert(memes).values([
        {
          userId: createdUsers[0].id,
          template: 'drake',
          textTop: 'Using presets',
          textBottom: 'Sound designing from scratch',
          imageUrl: '/placeholder-meme.jpg',
          upvotes: 25,
        },
      ]);
      console.log('✅ Created test memes');
    }

    console.log('\n✨ Dashboard data seeding complete!');
    console.log('\n📋 Test credentials:');
    console.log('Admin Email:', adminEmail);
    console.log('Admin Password:', adminPassword);
    
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
    throw error;
  }
}

seedDashboardData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
