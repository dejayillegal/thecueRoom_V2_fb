import { z } from 'zod';

export const newsListQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(), // Comma-separated list
  category: z.string().optional(),
  platform: z.enum(['spotify', 'soundcloud', 'bandcamp', 'all']).optional(),
  sort: z.enum(['latest', 'popular']).default('latest'),
  dateFrom: z.string().optional(), // ISO 8601 date
  dateTo: z.string().optional(), // ISO 8601 date
  verifiedOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(24),
  offset: z.coerce.number().min(0).default(0),
  cursor: z.string().optional(),
});

export type NewsListQuery = z.infer<typeof newsListQuerySchema>;

export const newsListResponseSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    link: z.string(),
    image: z.string().nullable(),
    tags: z.array(z.string()).nullable(),
    publishedAt: z.string(),
    sourceId: z.string(),
    sourceName: z.string().nullable(),
  })),
  total: z.number().optional(),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type NewsListResponse = z.infer<typeof newsListResponseSchema>;
