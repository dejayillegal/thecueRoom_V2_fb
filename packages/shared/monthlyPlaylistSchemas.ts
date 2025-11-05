import { z } from 'zod';

export const PlatformSchema = z.enum(['spotify', 'soundcloud', 'mixcloud']);

export const PlaylistStatusSchema = z.enum(['draft', 'queued', 'scheduled', 'live', 'archived']);

export const PlaylistUrlSchema = z.object({
  url: z.string().url('Invalid URL format'),
  platform: PlatformSchema.optional(),
});

export const ValidatePlaylistInputSchema = z.object({
  url: z.string().url('Invalid playlist URL'),
  platform: PlatformSchema.optional(),
});

export const ValidatePlaylistResponseSchema = z.object({
  ok: z.boolean(),
  valid: z.boolean(),
  platform: PlatformSchema.optional(),
  platformId: z.string().optional(),
  embedUrl: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  trackCount: z.number().int().positive().optional(),
  metadata: z.record(z.any()).optional(),
  error: z.string().optional(),
});

export const CreateMonthlyPlaylistInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  platform: PlatformSchema,
  platformId: z.string().min(1, 'Platform ID is required'),
  embedUrl: z.string().url('Invalid embed URL'),
  coverImage: z.string().url('Invalid cover image URL').optional(),
  monthOf: z.string().datetime('Invalid date format').or(z.date()),
  trackCount: z.number().int().positive().optional(),
  metadata: z.record(z.any()).optional(),
  status: PlaylistStatusSchema.optional().default('draft'),
});

export const UpdateMonthlyPlaylistInputSchema = z.object({
  id: z.string().uuid('Invalid playlist ID'),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  coverImage: z.string().url().optional(),
  monthOf: z.string().datetime().or(z.date()).optional(),
  trackCount: z.number().int().positive().optional(),
  metadata: z.record(z.any()).optional(),
  status: PlaylistStatusSchema.optional(),
});

export const SchedulePlaylistInputSchema = z.object({
  id: z.string().uuid('Invalid playlist ID'),
  scheduledAt: z.string().datetime('Invalid date format').or(z.date()),
  notifyFollowers: z.boolean().optional().default(false),
});

export const PublishPlaylistInputSchema = z.object({
  id: z.string().uuid('Invalid playlist ID'),
  archivePrevious: z.boolean().optional().default(true),
  notifyFollowers: z.boolean().optional().default(true),
});

export const RollbackPlaylistInputSchema = z.object({
  id: z.string().uuid('Invalid playlist ID'),
  toHistoryId: z.string().uuid('Invalid history ID'),
  reason: z.string().max(500).optional(),
});

export const ToggleAutoFallbackInputSchema = z.object({
  enabled: z.boolean(),
  autoPublishOnConfidence: z.boolean().optional().default(false),
  confidenceThreshold: z.number().min(0).max(100).optional().default(70),
  runWindowHours: z.number().int().positive().optional().default(24),
});

export const ListPlaylistsQuerySchema = z.object({
  status: PlaylistStatusSchema.optional(),
  platform: PlatformSchema.optional(),
  autoCurated: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

export const AIAutoGenerateInputSchema = z.object({
  monthOf: z.string().datetime().or(z.date()),
  fallbackMode: z.boolean().optional().default(true),
  historyMonths: z.number().int().positive().optional().default(6),
  genrePreferences: z.array(z.string()).optional(),
  minConfidence: z.number().min(0).max(100).optional().default(70),
});

export const AIAutoGenerateResponseSchema = z.object({
  ok: z.boolean(),
  jobId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  error: z.string().optional(),
});

export const PlaylistItemSchema = z.object({
  trackPlatform: PlatformSchema,
  trackId: z.string().min(1),
  trackTitle: z.string().min(1),
  artistName: z.string().min(1),
  trackUrl: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  position: z.number().int().nonnegative(),
  aiScore: z.number().min(0).max(100).optional(),
  aiRationale: z.string().max(500).optional(),
});

export const MonthlyPlaylistSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  platform: PlatformSchema,
  platformId: z.string(),
  embedUrl: z.string().url(),
  coverImage: z.string().url().nullable(),
  curatorId: z.string().uuid().nullable(),
  status: PlaylistStatusSchema,
  autoCurated: z.boolean(),
  monthOf: z.string().datetime().or(z.date()),
  scheduledAt: z.string().datetime().nullable().or(z.date().nullable()),
  publishedAt: z.string().datetime().nullable().or(z.date().nullable()),
  publishedBy: z.string().uuid().nullable(),
  trackCount: z.number().int().positive().nullable(),
  aiConfidenceScore: z.number().nullable(),
  metadata: z.record(z.any()),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export type Platform = z.infer<typeof PlatformSchema>;
export type PlaylistStatus = z.infer<typeof PlaylistStatusSchema>;
export type ValidatePlaylistInput = z.infer<typeof ValidatePlaylistInputSchema>;
export type ValidatePlaylistResponse = z.infer<typeof ValidatePlaylistResponseSchema>;
export type CreateMonthlyPlaylistInput = z.infer<typeof CreateMonthlyPlaylistInputSchema>;
export type UpdateMonthlyPlaylistInput = z.infer<typeof UpdateMonthlyPlaylistInputSchema>;
export type SchedulePlaylistInput = z.infer<typeof SchedulePlaylistInputSchema>;
export type PublishPlaylistInput = z.infer<typeof PublishPlaylistInputSchema>;
export type RollbackPlaylistInput = z.infer<typeof RollbackPlaylistInputSchema>;
export type ToggleAutoFallbackInput = z.infer<typeof ToggleAutoFallbackInputSchema>;
export type ListPlaylistsQuery = z.infer<typeof ListPlaylistsQuerySchema>;
export type AIAutoGenerateInput = z.infer<typeof AIAutoGenerateInputSchema>;
export type AIAutoGenerateResponse = z.infer<typeof AIAutoGenerateResponseSchema>;
export type PlaylistItem = z.infer<typeof PlaylistItemSchema>;
export type MonthlyPlaylist = z.infer<typeof MonthlyPlaylistSchema>;
