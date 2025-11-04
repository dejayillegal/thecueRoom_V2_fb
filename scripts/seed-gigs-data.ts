
import { getDbClient } from '@thecueroom/db';
import { events, artistEvents, users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

async function seedGigs() {
  console.log('🎫 Seeding gigs data...\n');

  const db = getDbClient();
  console.log('✅ Database client initialized');

  // Sample gig events with more variety
  const gigs = [
    {
      title: 'Techno Night @ Bangalore Underground',
      venue: 'Underground Warehouse',
      location: 'Bangalore, Karnataka',
      city: 'Bangalore',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ticketUrl: 'https://insider.in',
      imageUrl: 'https://picsum.photos/seed/gig1/800/600',
      genres: ['Techno', 'Electronic'],
      source: 'thecueRoom',
      artistUsernames: ['dj_phoenix', 'producer_nova'],
      status: 'approved',
      approved: true,
    },
    {
      title: 'House Music Festival - Goa Beach',
      venue: 'Sunset Beach Resort',
      location: 'Anjuna, Goa',
      city: 'Goa',
      startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      ticketUrl: 'https://bookmyshow.com',
      imageUrl: 'https://picsum.photos/seed/gig2/800/600',
      genres: ['House', 'Deep House'],
      source: 'BookMyShow',
      artistUsernames: ['mixer_zen'],
      status: 'approved',
      approved: true,
    },
    {
      title: 'Mumbai Underground Sessions',
      venue: 'The Junction',
      location: 'Lower Parel, Mumbai',
      city: 'Mumbai',
      startTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      ticketUrl: 'https://insider.in',
      imageUrl: 'https://picsum.photos/seed/gig3/800/600',
      genres: ['Techno', 'Minimal'],
      source: 'Insider',
      artistUsernames: ['dj_phoenix', 'mixer_zen'],
      status: 'approved',
      approved: true,
    },
    {
      title: 'Delhi Electronic Music Showcase',
      venue: 'Studio XL',
      location: 'Hauz Khas, Delhi',
      city: 'Delhi',
      startTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      ticketUrl: 'https://zomato.com',
      imageUrl: 'https://picsum.photos/seed/gig4/800/600',
      genres: ['Electronic', 'Ambient'],
      source: 'Zomato Live',
      artistUsernames: ['producer_nova'],
      status: 'approved',
      approved: true,
    },
    {
      title: 'Psytrance Night - Kasol Mountains',
      venue: 'Mountain View Cafe',
      location: 'Kasol, Himachal Pradesh',
      city: 'Kasol',
      startTime: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://picsum.photos/seed/gig5/800/600',
      genres: ['Psytrance', 'Progressive'],
      source: 'thecueRoom',
      artistUsernames: ['techno.wizard'],
      status: 'approved',
      approved: true,
    },
    {
      title: 'Drum & Bass Warehouse Party',
      venue: 'Secret Location',
      location: 'Bangalore, Karnataka',
      city: 'Bangalore',
      startTime: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://picsum.photos/seed/gig6/800/600',
      genres: ['Drum & Bass', 'Jungle'],
      source: 'thecueRoom',
      artistUsernames: ['liquidbass'],
      status: 'pending',
      approved: false,
    },
    {
      title: 'Experimental Electronic Showcase',
      venue: 'Art District Gallery',
      location: 'Kala Ghoda, Mumbai',
      city: 'Mumbai',
      startTime: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000),
      ticketUrl: 'https://insider.in',
      imageUrl: 'https://picsum.photos/seed/gig7/800/600',
      genres: ['Experimental', 'Ambient', 'IDM'],
      source: 'Insider',
      artistUsernames: ['underground.events'],
      status: 'approved',
      approved: true,
    },
  ];

  // Insert gigs into events table
  for (const gig of gigs) {
    try {
      const [insertedEvent] = await db.insert(events).values({
        title: gig.title,
        venue: gig.venue,
        location: gig.location,
        city: gig.city,
        startTime: gig.startTime,
        ticketUrl: gig.ticketUrl,
        imageUrl: gig.imageUrl,
        genres: gig.genres,
        source: gig.source,
        status: gig.status,
        approved: gig.approved,
        visibility: 'public',
      }).returning();

      console.log(`✅ Created gig: ${gig.title}`);

      // Link artists to gigs
      if (gig.artistUsernames && gig.artistUsernames.length > 0) {
        for (const artistUsername of gig.artistUsernames) {
          // Get artist user ID
          const artistResult = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.username, artistUsername))
            .limit(1);

          if (artistResult.length > 0) {
            const artistId = artistResult[0].id;
            
            // Create artist-event relationship
            await db.insert(artistEvents).values({
              artistId: artistId,
              eventId: insertedEvent.id,
            }).onConflictDoNothing();
            
            console.log(`  ↳ Linked artist ${artistUsername} to gig`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error creating gig ${gig.title}:`, error);
    }
  }

  console.log('\n✨ Gigs seeded successfully!');
  console.log('\n📋 Test Gigs Created:');
  gigs.forEach(gig => {
    console.log(`  - ${gig.title} (${gig.city})`);
  });
}

seedGigs().catch(console.error);
