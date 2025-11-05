
import { z } from 'zod';

export const validatePlaylistUrlSchema = z.object({
  url: z.string().url().regex(/spotify\.com\/playlist\/[a-zA-Z0-9]+/, 'Invalid Spotify playlist URL'),
});

export const createPlaylistSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  platform: z.literal('spotify').default('spotify'),
  platformId: z.string().min(1),
  embedUrl: z.string().url(),
  coverImage: z.string().url().optional(),
  trackCount: z.number().int().min(0).optional(),
  autoCurated: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const publishPlaylistSchema = z.object({
  adminPlaylistId: z.string().uuid(),
  publishNow: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
});

export const rollbackPlaylistSchema = z.object({
  historyId: z.string().uuid(),
});

export const toggleAutoCurationSchema = z.object({
  enabled: z.boolean(),
});

export const playlistMetadataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  trackCount: z.number().int(),
  platformId: z.string(),
  embedUrl: z.string().url(),
  owner: z.string().optional(),
});

export type ValidatePlaylistUrl = z.infer<typeof validatePlaylistUrlSchema>;
export type CreatePlaylist = z.infer<typeof createPlaylistSchema>;
export type PublishPlaylist = z.infer<typeof publishPlaylistSchema>;
export type RollbackPlaylist = z.infer<typeof rollbackPlaylistSchema>;
export type ToggleAutoCuration = z.infer<typeof toggleAutoCurationSchema>;
export type PlaylistMetadata = z.infer<typeof playlistMetadataSchema>;
