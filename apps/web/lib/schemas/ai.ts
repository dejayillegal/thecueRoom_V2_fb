
import { z } from 'zod';

export const aiJobTypeSchema = z.enum(['cover-art', 'meme', 'epk', 'avatar']);

export const aiJobCreateRequestSchema = z.object({
  type: aiJobTypeSchema,
  prompt: z.string().min(1, 'Prompt is required'),
  params: z.record(z.any()).optional(),
  userId: z.string().uuid('Invalid user ID'),
});

export const aiJobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export const aiJobResponseSchema = z.object({
  id: z.string().uuid(),
  type: aiJobTypeSchema,
  prompt: z.string(),
  params: z.record(z.any()).optional().nullable(),
  status: aiJobStatusSchema,
  resultUrl: z.string().url().optional().nullable(),
  error: z.string().optional().nullable(),
  retryCount: z.number().int().min(0),
  progress: z.number().min(0).max(100).optional(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional().nullable(),
});

export type AIJobType = z.infer<typeof aiJobTypeSchema>;
export type AIJobCreateRequest = z.infer<typeof aiJobCreateRequestSchema>;
export type AIJobStatus = z.infer<typeof aiJobStatusSchema>;
export type AIJobResponse = z.infer<typeof aiJobResponseSchema>;
