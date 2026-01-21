import { z } from 'zod';

export const feedsSourcesSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(['rss', 'json', 'atom']),
  tags: z.array(z.string()).default([]),
  config: z.any().default({}),
  enabled: z.boolean().default(true),
  minIntervalMinutes: z.number().int().min(1).default(60),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const feedsStateSchema = z.object({
  sourceId: z.string().uuid(),
  lastPolledAt: z.date().nullable().optional(),
  nextPollAt: z.date().default(() => new Date()),
  leaseOwner: z.string().nullable().optional(),
  leaseExpiresAt: z.date().nullable().optional(),
  status: z.enum(['idle', 'ingesting', 'healthy', 'error']).default('idle'),
  lastError: z.string().nullable().optional(),
  etag: z.string().nullable().optional(),
  lastModified: z.string().nullable().optional(),
  consecutiveFailures: z.number().int().default(0),
  updatedAt: z.date().optional(),
});

export const feedsItemsSchema = z.object({
  id: z.string().uuid().optional(),
  sourceId: z.string().uuid(),
  externalId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  link: z.string().url(),
  image: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  rawData: z.any().optional(),
  publishedAt: z.date(),
  createdAt: z.date().optional(),
});

export const feedsIngestionLogSchema = z.object({
  id: z.string().uuid().optional(),
  sourceId: z.string().uuid(),
  startedAt: z.date().default(() => new Date()),
  finishedAt: z.date().nullable().optional(),
  status: z.enum(['success', 'failed', 'partial']),
  itemsProcessed: z.number().int().default(0),
  itemsNew: z.number().int().default(0),
  errorMessage: z.string().nullable().optional(),
  trace: z.any().optional(),
});

export type FeedsSource = z.infer<typeof feedsSourcesSchema>;
export type FeedsState = z.infer<typeof feedsStateSchema>;
export type FeedsItem = z.infer<typeof feedsItemsSchema>;
export type FeedsIngestionLog = z.infer<typeof feedsIngestionLogSchema>;
