import { z } from 'zod';

export const PlayerPlatformSchema = z.enum(['spotify', 'soundcloud', 'mixcloud', 'bandcamp', 'youtube_music']);

export const MetadataRequestSchema = z.object({
  platform: PlayerPlatformSchema,
  id: z.string().min(1, 'ID is required'),
});

export const TrackMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  duration: z.number().int().positive().optional(),
  coverImage: z.string().url().optional(),
  url: z.string().url(),
  previewUrl: z.string().url().optional(),
});

export const PlaylistMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  platform: PlayerPlatformSchema,
  ownerName: z.string().optional(),
  coverImage: z.string().url().optional(),
  trackCount: z.number().int().positive(),
  tracks: z.array(TrackMetadataSchema).optional(),
  embedUrl: z.string().url(),
  webUrl: z.string().url(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const MetadataResponseSchema = z.object({
  ok: z.boolean(),
  data: PlaylistMetadataSchema.optional(),
  error: z.string().optional(),
  cached: z.boolean().optional(),
});

export const EmbedConfigSchema = z.object({
  platform: PlayerPlatformSchema,
  embedUrl: z.string().url(),
  width: z.number().int().positive().optional().default(300),
  height: z.number().int().positive().optional().default(380),
  theme: z.enum(['dark', 'light']).optional().default('dark'),
  autoPlay: z.boolean().optional().default(false),
});

export const ExternalLinkSchema = z.object({
  platform: PlayerPlatformSchema,
  url: z.string().url(),
  label: z.string().optional(),
  icon: z.string().optional(),
});

export type PlayerPlatform = z.infer<typeof PlayerPlatformSchema>;
export type MetadataRequest = z.infer<typeof MetadataRequestSchema>;
export type TrackMetadata = z.infer<typeof TrackMetadataSchema>;
export type PlaylistMetadata = z.infer<typeof PlaylistMetadataSchema>;
export type MetadataResponse = z.infer<typeof MetadataResponseSchema>;
export type EmbedConfig = z.infer<typeof EmbedConfigSchema>;
export type ExternalLink = z.infer<typeof ExternalLinkSchema>;
