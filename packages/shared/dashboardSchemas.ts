import { z } from 'zod';

export const SpotlightItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  imageUrl: z.string(),
  link: z.string(),
  tag: z.string().optional(),
});

export const GigItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  venue: z.string(),
  city: z.string().optional(),
  date: z.string(),
  isTicketed: z.boolean(),
  ticketUrl: z.string().optional(),
});

export const TrendingThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  replies: z.number(),
  likes: z.number(),
  category: z.string().optional(),
  author: z.string(),
  createdAt: z.string(),
});

export const MonthlyPlaylistSchema = z.object({
  id: z.string(),
  title: z.string(),
  embedUrl: z.string().optional(),
  externalUrl: z.string().optional(),
  trackCount: z.number().optional(),
  curatedAt: z.string().optional(),
}).nullable();

export const AIToolUsageSchema = z.object({
  usage: z.number(),
  newTemplates: z.number(),
  recentCount: z.number().optional(),
});

export const DashboardOverviewSchema = z.object({
  stats: z.object({
    users: z.number(),
    artists: z.number(),
    gigsUpcoming: z.number(),
    threadsCount: z.number(),
    likes: z.number(),
  }),
  spotlight: z.array(SpotlightItemSchema),
  gigs: z.array(GigItemSchema),
  trendingThreads: z.array(TrendingThreadSchema),
  monthlyPlaylist: MonthlyPlaylistSchema,
  aiTools: z.object({
    coverArt: AIToolUsageSchema,
    epk: AIToolUsageSchema,
    meme: AIToolUsageSchema,
  }),
});

export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>;
export type SpotlightItem = z.infer<typeof SpotlightItemSchema>;
export type GigItem = z.infer<typeof GigItemSchema>;
export type TrendingThread = z.infer<typeof TrendingThreadSchema>;
export type MonthlyPlaylist = z.infer<typeof MonthlyPlaylistSchema>;
export type AIToolUsage = z.infer<typeof AIToolUsageSchema>;
