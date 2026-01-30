import { getDbClient } from '@thecueroom/db/client';
import bcrypt from 'bcryptjs';
import {
  users,
  profiles,
  gigs,
  forumThreads,
  forumCategories,
  spotlightItems,
  playlists,
  memes,
} from '@thecueroom/db/schema';

export async function seedDemoData() {
  const db = getDbClient();
  const now = new Date();

  try {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return { ok: true, message: 'Demo data already exists, skipping seed' };
    }

    const demoUserData = [
      {
        email: 'dejayillegal@gmail.com',
        username: 'admin',
        role: 'admin',
        verified: true,
        password: 'Closer@82',
      },
      ...Array.from({ length: 50 }, (_, i) => ({
        email: `user${i + 1}@demo.thecueroom.com`,
        username: `user${i + 1}`,
        role: i < 12 ? 'artist' : 'user',
        verified: true,
        password: 'Test123!',
      })),
    ];

    const insertedUsers = await db.insert(users).values(
      await Promise.all(demoUserData.map(async (u) => ({
        email: u.email,
        username: u.username,
        passwordHash: await bcrypt.hash(u.password, 10),
        role: u.role,
        verified: u.verified,
        createdAt: new Date(),
        updatedAt: new Date(),
      })))
    ).returning({ id: users.id, email: users.email, role: users.role });

    const artistUsers = insertedUsers.filter((u: { id: string; email: string; role: string }) => u.role === 'artist');
    const allUsers = insertedUsers;

    await db.insert(profiles).values(
      artistUsers.map((u: { id: string; email: string; role: string }, index: number) => ({
        userId: u.id,
        displayName: `Artist ${index + 1}`,
        artistName: `DJ Demo ${index + 1}`,
        bio: `Passionate electronic music artist specializing in techno and house. ${50 + index} shows played worldwide.`,
        genre: index % 2 === 0 ? 'Techno' : 'House',
        aiCredits: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    const categories = ['Production', 'Scene', 'Career', 'Discussion', 'Marketing'];
    const categoryIds = await db
      .insert(forumCategories)
      .values(
        categories.map((cat) => ({
          name: cat,
          slug: cat.toLowerCase(),
          description: `Discussions about ${cat.toLowerCase()}`,
          threadCount: 0,
          createdAt: new Date(),
        }))
      )
      .returning({ id: forumCategories.id });

    await db.insert(forumThreads).values(
      Array.from({ length: 50 }, (_, i) => ({
        categoryId: categoryIds[i % categories.length]!.id,
        userId: allUsers[i % allUsers.length]!.id,
        title: `Demo Thread ${i + 1}: ${['Tips', 'Discussion', 'Question', 'News', 'Help'][i % 5]}`,
        slug: `demo-thread-${i + 1}`,
        body: `This is a demo thread about ${categories[i % categories.length]}. Join the discussion!`,
        tags: JSON.stringify([categories[i % categories.length]!.toLowerCase()]),
        viewCount: Math.floor(Math.random() * 500),
        replyCount: Math.floor(Math.random() * 100),
        likesCount: Math.floor(Math.random() * 200),
        moderationStatus: 'approved',
        createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      }))
    );

    const venues = [
      { name: 'Fabric', city: 'London' },
      { name: 'Berghain', city: 'Berlin' },
      { name: 'Output', city: 'Brooklyn' },
      { name: 'Printworks', city: 'London' },
      { name: 'Warehouse Project', city: 'Manchester' },
    ];

    await db.insert(gigs).values(
      Array.from({ length: 30 }, (_, i) => {
        const venue = venues[i % venues.length]!;
        const daysAhead = i + 1;
        return {
          userId: artistUsers[i % artistUsers.length]!.id,
          title: `${venue.name} - ${['Techno Night', 'House Session', 'Underground', 'Showcase', 'Festival'][i % 5]}`,
          description: `An amazing night of electronic music at ${venue.name}`,
          venue: venue.name,
          location: venue.city,
          city: venue.city,
          startTime: new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
          ticketUrl: i % 2 === 0 ? `https://example.com/tickets/${i}` : null,
          genres: JSON.stringify(['techno', 'house']),
          approved: true,
          visibility: 'public',
          status: 'approved',
          createdAt: new Date(),
        };
      })
    );

    await db.insert(spotlightItems).values([
      {
        title: 'New Techno Release: Dark Horizons',
        excerpt: 'Listen to the latest from Berlin underground',
        content: 'Full article content here',
        image: '/api/og-fallback?title=Techno',
        link: '/music/releases/dark-horizons',
        category: 'New Release',
        featured: true,
        publishedAt: new Date(),
        createdAt: new Date(),
      },
      {
        title: 'Upcoming Festival: Digital Dreams 2025',
        excerpt: 'Three days of cutting-edge electronic music',
        content: 'Full article content here',
        image: '/api/og-fallback?title=Festival',
        link: '/events/digital-dreams',
        category: 'Festival',
        featured: true,
        publishedAt: new Date(),
        createdAt: new Date(),
      },
      {
        title: 'Artist Interview: DJ Pulse',
        excerpt: 'Inside the mind of a rising star',
        content: 'Full interview content here',
        image: '/api/og-fallback?title=Interview',
        link: '/news/dj-pulse-interview',
        category: 'Interview',
        featured: true,
        publishedAt: new Date(),
        createdAt: new Date(),
      },
      {
        title: 'Production Tutorial: Advanced Basslines',
        excerpt: 'Master the art of deep, rolling bass',
        content: 'Full tutorial content here',
        image: '/api/og-fallback?title=Tutorial',
        link: '/tutorials/advanced-basslines',
        category: 'Tutorial',
        featured: true,
        publishedAt: new Date(),
        createdAt: new Date(),
      },
      {
        title: 'Vinyl Spotlight: Classic House Gems',
        excerpt: 'Rediscover the golden era',
        content: 'Full article content here',
        image: '/api/og-fallback?title=Vinyl',
        link: '/vinyl/classic-house',
        category: 'Vinyl',
        featured: true,
        publishedAt: new Date(),
        createdAt: new Date(),
      },
    ]);

    await db.insert(playlists).values([
      {
        title: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()} - Curated Selection`,
        description: 'The best tracks of the month',
        platform: 'spotify',
        platformId: '37i9dQZF1DXcBWIGoYBM5M',
        embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
        soundcloudUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
        monthOf: new Date(now.getFullYear(), now.getMonth(), 1),
        featured: true,
        visibility: 'public',
        status: 'live',
        curatedAt: new Date(now.getFullYear(), now.getMonth(), 1),
        createdAt: new Date(),
      },
    ]);

    await db.insert(memes).values(
      Array.from({ length: 20 }, (_, i) => ({
        userId: allUsers[i % allUsers.length]!.id,
        template: `template-${i % 5}`,
        textTop: `When the drop hits`,
        textBottom: `Just right`,
        imageUrl: `/api/og-fallback?title=Meme${i}`,
        upvotes: Math.floor(Math.random() * 100),
        createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }))
    );

    return {
      ok: true,
      message: 'Demo data seeded successfully',
      counts: {
        users: allUsers.length,
        artists: artistUsers.length,
        categories: 5,
        threads: 50,
        gigs: 30,
        spotlight: 5,
        playlists: 1,
        memes: 20,
      },
    };
  } catch (error) {
    console.error('Demo seed error:', error);
    throw error;
  }
}
