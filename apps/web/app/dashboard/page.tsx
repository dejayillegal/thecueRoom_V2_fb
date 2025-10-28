import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Search, Plus, Users, BarChart3, CheckCircle2, Calendar, Sparkles, Play, Eye, Flag } from 'lucide-react';
import Link from 'next/link';
import { db } from '@thecueroom/db';
import { feeds, gigs, forumThreads, memes, users, profiles } from '@thecueroom/db/schema';
import { desc, eq, gte, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getDashboardData(userId: string, userRole: string) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const now = new Date();

  const userProfile = await db.select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const userThreads = await db.select()
    .from(forumThreads)
    .where(
      and(
        eq(forumThreads.userId, userId),
        gte(forumThreads.createdAt, oneWeekAgo)
      )
    );

  const userMemes = await db.select()
    .from(memes)
    .where(
      and(
        eq(memes.userId, userId),
        gte(memes.createdAt, oneWeekAgo)
      )
    );

  const userGigs = await db.select()
    .from(gigs)
    .where(
      and(
        eq(gigs.userId, userId),
        gte(gigs.createdAt, oneWeekAgo)
      )
    );

  const totalThreadUpvotes = userThreads.reduce((sum, t) => sum + (t.upvotes || 0), 0);
  const totalMemeUpvotes = userMemes.reduce((sum, m) => sum + (m.upvotes || 0), 0);
  const totalEngagement = totalThreadUpvotes + totalMemeUpvotes;
  
  const playsThisWeek = totalThreadUpvotes * 10 + totalMemeUpvotes * 5 + userGigs.length * 50;
  const newFollowers = Math.floor(totalEngagement / 2) + userGigs.length * 3;
  
  const stats = {
    playsThisWeek,
    newFollowers,
    profileStatus: userRole === 'admin' ? 'Verified' : 'Active',
    aiCredits: userProfile[0]?.aiCredits || 100,
    postsThisWeek: userThreads.length + userMemes.length + userGigs.length,
    totalEngagement
  };

  const recentThreads = await db.select({
    id: forumThreads.id,
    userId: forumThreads.userId,
    title: forumThreads.title,
    content: forumThreads.content,
    createdAt: forumThreads.createdAt,
    upvotes: forumThreads.upvotes,
    commentCount: forumThreads.commentCount,
    userEmail: users.email,
    displayName: profiles.displayName,
    avatar: profiles.avatar,
  })
  .from(forumThreads)
  .leftJoin(users, eq(forumThreads.userId, users.id))
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .orderBy(desc(forumThreads.createdAt))
  .limit(5);

  const recentMemes = await db.select({
    id: memes.id,
    userId: memes.userId,
    template: memes.template,
    imageUrl: memes.imageUrl,
    createdAt: memes.createdAt,
    upvotes: memes.upvotes,
    userEmail: users.email,
    displayName: profiles.displayName,
    avatar: profiles.avatar,
  })
  .from(memes)
  .leftJoin(users, eq(memes.userId, users.id))
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .orderBy(desc(memes.createdAt))
  .limit(5);

  const recentGigs = await db.select({
    id: gigs.id,
    userId: gigs.userId,
    title: gigs.title,
    venue: gigs.venue,
    location: gigs.location,
    startTime: gigs.startTime,
    createdAt: gigs.createdAt,
    status: gigs.status,
    userEmail: users.email,
    displayName: profiles.displayName,
    avatar: profiles.avatar,
  })
  .from(gigs)
  .leftJoin(users, eq(gigs.userId, users.id))
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .orderBy(desc(gigs.createdAt))
  .limit(5);

  const activities = [
    ...recentThreads.map(t => ({
      id: t.id,
      type: 'forum_post',
      title: t.title,
      content: t.content?.substring(0, 100),
      timestamp: t.createdAt,
      user: {
        name: t.displayName || t.userEmail?.split('@')[0] || 'Anonymous',
        avatar: t.avatar
      },
      metadata: {
        upvotes: t.upvotes,
        comments: t.commentCount
      }
    })),
    ...recentMemes.map(m => ({
      id: m.id,
      type: 'meme',
      title: `Posted a ${m.template} meme`,
      timestamp: m.createdAt,
      user: {
        name: m.displayName || m.userEmail?.split('@')[0] || 'Anonymous',
        avatar: m.avatar
      },
      metadata: {
        upvotes: m.upvotes,
        imageUrl: m.imageUrl
      }
    })),
    ...recentGigs.map(g => ({
      id: g.id,
      type: 'gig',
      title: g.title,
      content: `${g.venue} - ${g.location}`,
      timestamp: g.createdAt,
      user: {
        name: g.displayName || g.userEmail?.split('@')[0] || 'Anonymous',
        avatar: g.avatar
      },
      metadata: {
        status: g.status,
        startTime: g.startTime
      }
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  .slice(0, 10);

  const upcomingGigs = await db.select({
    id: gigs.id,
    title: gigs.title,
    description: gigs.description,
    venue: gigs.venue,
    location: gigs.location,
    startTime: gigs.startTime,
    endTime: gigs.endTime,
    status: gigs.status,
    createdAt: gigs.createdAt,
    userId: gigs.userId,
    userEmail: users.email,
    displayName: profiles.displayName,
    avatar: profiles.avatar,
  })
  .from(gigs)
  .leftJoin(users, eq(gigs.userId, users.id))
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .where(gte(gigs.startTime, now))
  .orderBy(gigs.startTime)
  .limit(10);

  const newsFeeds = await db.select()
    .from(feeds)
    .orderBy(desc(feeds.publishedAt))
    .limit(5);

  let adminQueue: any[] = [];
  if (userRole === 'admin') {
    const pendingGigs = await db.select({
      id: gigs.id,
      title: gigs.title,
      venue: gigs.venue,
      location: gigs.location,
      startTime: gigs.startTime,
      status: gigs.status,
      createdAt: gigs.createdAt,
      userId: gigs.userId,
      userEmail: users.email,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
    })
    .from(gigs)
    .leftJoin(users, eq(gigs.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(gigs.status, 'pending'))
    .orderBy(desc(gigs.createdAt))
    .limit(5);

    const recentUsers = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      displayName: profiles.displayName,
      avatar: profiles.avatar,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.role, 'user'))
    .orderBy(desc(users.createdAt))
    .limit(5);

    adminQueue = [
      ...pendingGigs.map(g => ({
        id: g.id,
        type: 'gig_review',
        title: `Review gig: ${g.title}`,
        description: `${g.venue} - ${g.location}`,
        timestamp: g.createdAt,
        user: {
          name: g.displayName || g.userEmail?.split('@')[0] || 'Anonymous',
          email: g.userEmail,
          avatar: g.avatar
        },
        status: 'pending'
      })),
      ...recentUsers.map(u => ({
        id: u.id,
        type: 'verification_request',
        title: `Artist verification request`,
        description: `Request from @${u.email?.split('@')[0]}`,
        timestamp: u.createdAt,
        user: {
          name: u.displayName || u.email?.split('@')[0] || 'Anonymous',
          email: u.email,
          avatar: u.avatar
        },
        status: 'pending'
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
  }

  return {
    stats,
    activities,
    gigs: upcomingGigs,
    news: newsFeeds,
    adminQueue
  };
}

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function formatGigTime(date: Date | string) {
  const d = new Date(date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days[d.getDay()];
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${hours}:${mins}`;
}

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/');
  }

  const data = await getDashboardData(user.uid, user.role);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar userRole={user.role} />
      
      <main className="flex-1">
        <header className="border-b border-[#1a2a1a] bg-[#0f0f0f] sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search artists, labels, gigs"
                  className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#c8ff00] focus:ring-1 focus:ring-[#c8ff00]"
                />
              </div>
            </div>
            <button className="ml-4 flex items-center gap-2 px-4 py-2 bg-[#c8ff00] text-black rounded-lg font-medium text-sm hover:bg-[#d4ff33] transition-colors">
              <Plus className="w-4 h-4" />
              Create Post
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-[#0f0f0f] border border-[#1a2a1a] rounded-lg p-6">
              <h2 className="text-[#c8ff00] text-xl font-semibold mb-6">Welcome back</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Plays this week</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{data.stats.playsThisWeek}</div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">New followers</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{data.stats.newFollowers}</div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Profile status</span>
                  </div>
                  <div className="text-3xl font-bold text-[#c8ff00]">{data.stats.profileStatus}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#1a2a1a] rounded-lg p-6">
              <h2 className="text-[#c8ff00] text-xl font-semibold mb-4">Upcoming Gigs</h2>
              
              <div className="space-y-3">
                {data.gigs.length > 0 ? (
                  data.gigs.slice(0, 2).map((gig: any) => (
                    <div key={gig.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatGigTime(gig.startTime)} | {gig.location}</span>
                          </div>
                          <div className="text-white font-medium">{gig.title}</div>
                        </div>
                      </div>
                      <button className="w-full mt-2 px-3 py-1.5 bg-[#c8ff00] text-black rounded text-xs font-medium hover:bg-[#d4ff33] transition-colors">
                        Details
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No upcoming gigs scheduled
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#0f0f0f] border border-[#1a2a1a] rounded-lg p-6">
              <h2 className="text-[#c8ff00] text-xl font-semibold mb-4">Community Feed</h2>
              
              <div className="space-y-3">
                {data.activities.length > 0 ? (
                  data.activities.slice(0, 3).map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-[#c8ff00]">
                        {activity.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">
                          {activity.user.name} {activity.type === 'forum_post' ? 'posted' : activity.type === 'meme' ? 'shared' : 'announced'}: "{activity.title}"
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No recent community activity
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#1a2a1a] rounded-lg p-6">
              <h2 className="text-[#c8ff00] text-xl font-semibold mb-4">News</h2>
              
              <div className="space-y-3">
                {data.news.length > 0 ? (
                  data.news.slice(0, 2).map((item: any) => (
                    <a 
                      key={item.id} 
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#c8ff00] transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-[#2a2a2a] rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium line-clamp-2">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Read</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No news feeds available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#1a2a1a] rounded-lg p-6">
              <h2 className="text-[#c8ff00] text-xl font-semibold mb-4">AI Tools</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">Generate cover art concepts</span>
                  </div>
                  <button className="px-3 py-1 bg-[#c8ff00] text-black rounded text-xs font-medium hover:bg-[#d4ff33] transition-colors">
                    Open
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">Master track preview</span>
                  </div>
                  <button className="px-3 py-1 bg-[#c8ff00] text-black rounded text-xs font-medium hover:bg-[#d4ff33] transition-colors">
                    Open
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">Verify promoter authenticity</span>
                  </div>
                  <button className="px-3 py-1 bg-[#c8ff00] text-black rounded text-xs font-medium hover:bg-[#d4ff33] transition-colors">
                    Run
                  </button>
                </div>
              </div>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="bg-[#0f0f0f] border border-[#1a2a1a] rounded-lg p-6">
              <h2 className="text-[#c8ff00] text-xl font-semibold mb-4">Admin Queue</h2>
              
              <div className="space-y-3">
                {data.adminQueue.length > 0 ? (
                  data.adminQueue.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="flex items-start gap-3 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm font-bold text-[#c8ff00]">
                        {item.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                      </div>
                      <button className="px-3 py-1 bg-[#2a2a2a] text-white rounded text-xs font-medium hover:bg-[#3a3a3a] transition-colors">
                        {item.status === 'pending' ? 'Pending' : 'Review'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No pending admin requests
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
