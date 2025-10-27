import { z } from 'zod';

export const FeedItemSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string().nullable(),
  link: z.string().url(),
  image: z.string().url().nullable(),
  tags: z.array(z.string()),
  publishedAt: z.date(),
  contentHash: z.string(),
  rawData: z.any().nullable(),
  createdAt: z.date(),
});

export const SpotlightItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  excerpt: z.string().nullable(),
  content: z.string().nullable(),
  image: z.string().url(),
  link: z.string().url().nullable(),
  category: z.string(),
  featured: z.boolean(),
  publishedAt: z.date(),
  createdAt: z.date(),
});

export const PlaylistSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  soundcloudUrl: z.string().url().nullable(),
  embedHtml: z.string().nullable(),
  thumbnail: z.string().url().nullable(),
  weekOf: z.date(),
  featured: z.boolean(),
  createdAt: z.date(),
});

export const GigSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  venue: z.string(),
  location: z.string(),
  lat: z.string().nullable(),
  lng: z.string().nullable(),
  startTime: z.date(),
  endTime: z.date().nullable(),
  isPrivate: z.boolean(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.date(),
});

export const ThreadSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  tags: z.array(z.string()),
  upvotes: z.number().int(),
  commentCount: z.number().int(),
  isPinned: z.boolean(),
  isLocked: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CommentSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1),
  upvotes: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const EPKRequestSchema = z.object({
  title: z.string().min(1),
  bio: z.string().min(50),
  discography: z.array(z.object({
    title: z.string(),
    year: z.number(),
    label: z.string().optional(),
    link: z.string().url().optional(),
  })),
  pressQuotes: z.array(z.string()),
  images: z.array(z.string().url()),
});

export const MemeRequestSchema = z.object({
  template: z.string(),
  textTop: z.string().max(100).optional(),
  textBottom: z.string().max(100).optional(),
});

export const AvatarRequestSchema = z.object({
  prompt: z.string().min(3).max(500),
  style: z.enum(['realistic', 'cartoon', 'abstract', 'minimal']),
  seed: z.number().int().optional(),
});

export const AIJobSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['cover-art', 'epk', 'meme', 'avatar']),
  prompt: z.string(),
  params: z.any(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  resultUrl: z.string().url().nullable(),
  error: z.string().nullable(),
  retryCount: z.number().int(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
});

export const CreateFeedSchema = z.object({
  sourceId: z.string().uuid(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string().nullable(),
  link: z.string().url(),
  image: z.string().url().nullable(),
  tags: z.array(z.string()),
  publishedAt: z.string().datetime(),
});

export const CreateGigSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  venue: z.string().min(1),
  location: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  isPrivate: z.boolean().default(false),
});

export type FeedItem = z.infer<typeof FeedItemSchema>;
export type SpotlightItem = z.infer<typeof SpotlightItemSchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
export type Gig = z.infer<typeof GigSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type EPKRequest = z.infer<typeof EPKRequestSchema>;
export type MemeRequest = z.infer<typeof MemeRequestSchema>;
export type AvatarRequest = z.infer<typeof AvatarRequestSchema>;
export type AIJob = z.infer<typeof AIJobSchema>;
