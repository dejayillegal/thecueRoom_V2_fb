
#!/usr/bin/env tsx

import { getDbClient } from '@thecueroom/db';
import { nanoid } from 'nanoid';

async function seedGigs() {
  console.log('🎫 Seeding gigs data...\n');

  const db = await getDbClient();
  console.log('✅ Database client initialized');

  // Sample gig events
  const gigs = [
    {
      id: nanoid(),
      title: 'Techno Night @ Bangalore Underground',
      venue: 'Underground Warehouse',
      city: 'Bangalore',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      time: '22:00',
      price: 'Free Entry',
      ticketUrl: '#',
      imageUrl: 'https://picsum.photos/seed/gig1/800/600',
      description: 'Deep techno night with local and international DJs',
      artists: ['dj_phoenix', 'producer_nova'],
      genre: ['Techno', 'Electronic'],
      source: 'thecueRoom',
      sourceUrl: '#',
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'House Music Festival - Goa Beach',
      venue: 'Sunset Beach Resort',
      city: 'Goa',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      time: '18:00',
      price: '₹1500',
      ticketUrl: 'https://bookmyshow.com',
      imageUrl: 'https://picsum.photos/seed/gig2/800/600',
      description: 'Beach house music festival featuring top DJs',
      artists: ['mixer_zen'],
      genre: ['House', 'Deep House'],
      source: 'BookMyShow',
      sourceUrl: 'https://bookmyshow.com',
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'Mumbai Underground Sessions',
      venue: 'The Junction',
      city: 'Mumbai',
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      time: '21:00',
      price: '₹800',
      ticketUrl: '#',
      imageUrl: 'https://picsum.photos/seed/gig3/800/600',
      description: 'Monthly underground music sessions',
      artists: ['dj_phoenix', 'mixer_zen'],
      genre: ['Techno', 'Minimal'],
      source: 'Insider',
      sourceUrl: '#',
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'Delhi Electronic Music Showcase',
      venue: 'Studio XL',
      city: 'Delhi',
      date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      time: '20:00',
      price: 'Free',
      ticketUrl: '#',
      imageUrl: 'https://picsum.photos/seed/gig4/800/600',
      description: 'Showcase of emerging electronic music artists',
      artists: ['producer_nova'],
      genre: ['Electronic', 'Ambient'],
      source: 'Zomato Live',
      sourceUrl: '#',
      createdAt: new Date().toISOString(),
    },
  ];

  // Insert gigs into events table
  for (const gig of gigs) {
    try {
      await db.execute({
        sql: `
          INSERT INTO events (
            id, title, venue, city, event_date, event_time, 
            price, ticket_url, image_url, description, 
            genre, source, source_url, created_at, updated_at, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `,
        args: [
          gig.id,
          gig.title,
          gig.venue,
          gig.city,
          gig.date,
          gig.time || null,
          gig.price || null,
          gig.ticketUrl || null,
          gig.imageUrl || null,
          gig.description || null,
          JSON.stringify(gig.genre),
          gig.source,
          gig.sourceUrl,
          gig.createdAt,
          gig.createdAt,
          'approved',
        ],
      });

      console.log(`✅ Created gig: ${gig.title}`);

      // Link artists to gigs
      if (gig.artists && gig.artists.length > 0) {
        for (const artistUsername of gig.artists) {
          // Get artist user ID
          const artistResult = await db.execute({
            sql: 'SELECT id FROM users WHERE username = ?',
            args: [artistUsername],
          });

          if (artistResult.rows.length > 0) {
            const artistId = artistResult.rows[0].id as string;
            
            // Create artist-event relationship
            await db.execute({
              sql: `
                INSERT INTO artist_events (artist_id, event_id, created_at)
                VALUES (?, ?, ?)
                ON CONFLICT(artist_id, event_id) DO NOTHING
              `,
              args: [artistId, gig.id, new Date().toISOString()],
            });
            
            console.log(`  ↳ Linked artist ${artistUsername} to gig`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error creating gig ${gig.title}:`, error);
    }
  }

  await db.close();

  console.log('\n✨ Gigs seeded successfully!');
  console.log('\n📋 Test Gigs Created:');
  gigs.forEach(gig => {
    console.log(`  - ${gig.title} (${gig.city}) - ${gig.date.slice(0, 10)}`);
  });
}

seedGigs().catch(console.error);
