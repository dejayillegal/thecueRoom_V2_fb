import { z } from 'zod';

export const feedsSourcesSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(['rss', 'json', 'atom']),
  tags: z.array(z.string()).default([]),
  config: z.record(z.any()).default({}),
  enabled: z.boolean().default(true),
  minIntervalMinutes: z.number().int().min(1).default(60),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const feedsStateSchema = z.object({
  sourceId: z.string().uuid(),
  lastFetchedAt: z.date().nullable().optional(),
  nextFetchAt: z.date().default(() => new Date()),
  leaseOwner: z.string().nullable().optional(),
  leaseExpiresAt: z.date().nullable().optional(),
  etag: z.string().nullable().optional(),
  lastModified: z.string().nullable().optional(),
  cursor: z.string().nullable().optional(),
  consecutiveFailures: z.number().int().default(0),
  lastStatusCode: z.number().int().nullable().optional(),
  updatedAt: z.date().optional(),
});

export const feedsItemsSchema = z.object({
  id: z.string().uuid().optional(),
  sourceId: z.string().uuid(),
  externalId: z.string(),
  title: z.string(),
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
