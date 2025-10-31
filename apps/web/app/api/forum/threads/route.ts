import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { users, profiles } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Mock data for now - replace with real database queries when forum schema is implemented
const mockThreads = [
  {
    id: '1',
    title: 'Best DAW for underground techno production?',
    categoryId: 'production',
    userId: 'mock-user-1',
    replyCount: 12,
    upvotes: 24,
    isPinned: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Upcoming warehouse parties in Berlin',
    categoryId: 'events',
    userId: 'mock-user-2',
    replyCount: 8,
    upvotes: 15,
    isPinned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Feedback on my new drum & bass track',
    categoryId: 'feedback',
    userId: 'mock-user-3',
    replyCount: 5,
    upvotes: 7,
    isPinned: false,
    createdAt: new Date().toISOString(),
  },
];

// Mock user profiles - in production, fetch from database
const mockUserProfiles = {
  'mock-user-1': {
    username: 'techno.producer',
    displayName: 'Underground Techno',
    artistName: 'DJ Minimal',
    avatar: null,
    bio: 'Berlin-based techno producer. Deep, dark, hypnotic sounds.',
    region: 'Berlin, Germany',
    genre: 'Techno, Minimal',
    verified: true,
    socialProfileUrl: 'https://soundcloud.com/underground-techno',
    aiCredits: 150,
  },
  'mock-user-2': {
    username: 'warehouse.selector',
    displayName: 'Warehouse Selector',
    artistName: 'Selector X',
    avatar: null,
    bio: 'Vinyl DJ specializing in warehouse sounds',
    region: 'London, UK',
    genre: 'House, Garage',
    verified: true,
    socialProfileUrl: 'https://soundcloud.com/selector-x',
    aiCredits: 200,
  },
  'mock-user-3': {
    username: 'dnb.beatsmith',
    displayName: 'DNB Beatsmith',
    artistName: 'LiquidBass',
    avatar: null,
    bio: 'Drum & Bass producer from Bristol',
    region: 'Bristol, UK',
    genre: 'Drum & Bass, Jungle',
    verified: false,
    socialProfileUrl: 'https://soundcloud.com/liquidbass',
    aiCredits: 75,
  },
};

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient();

    // Enrich mock threads with user profile data
    const enrichedThreads = mockThreads.map(thread => ({
      ...thread,
      userProfile: mockUserProfiles[thread.userId as keyof typeof mockUserProfiles] || {
        username: 'unknown',
        displayName: 'Unknown User',
        verified: false,
      },
    }));

    return NextResponse.json({
      threads: enrichedThreads,
    });
  } catch (error) {
    console.error('Forum threads fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads', threads: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Implement thread creation when forum schema is ready
    console.log('Thread creation requested:', body);

    return NextResponse.json({
      success: true,
      threadId: 'new-thread-id',
    });
  } catch (error) {
    console.error('Thread creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
