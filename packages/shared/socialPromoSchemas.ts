import { z } from 'zod';

export const promoTypeSchema = z.enum([
  'release',
  'gig',
  'announcement',
  'general',
]);

export type PromoType = z.infer<typeof promoTypeSchema>;

export const promoPlatformSchema = z.enum([
  'instagram',
  'soundcloud',
  'bandcamp',
  'mixcloud',
  'spotify',
  'facebook',
  'twitter',
  'tiktok',
]);

export type PromoPlatform = z.infer<typeof promoPlatformSchema>;

export const promoStatusSchema = z.enum([
  'draft',
  'generating',
  'ready',
  'exported',
  'shared',
  'failed',
]);

export type PromoStatus = z.infer<typeof promoStatusSchema>;

export const generatePromoRequestSchema = z.object({
  type: promoTypeSchema.default('general'),
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500),
  tags: z.array(z.string()).max(10).optional(),
  platforms: z.array(promoPlatformSchema).min(1).optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type GeneratePromoRequest = z.infer<typeof generatePromoRequestSchema>;

export const aiPromoContentSchema = z.object({
  title: z.string(),
  caption: z.string(),
  tags: z.array(z.string()),
  backgroundPrompt: z.string(),
  themeColor: z.string(),
  tone: z.string().optional(),
});

export type AIPromoContent = z.infer<typeof aiPromoContentSchema>;

export const generatePromoResponseSchema = z.object({
  id: z.string(),
  content: aiPromoContentSchema,
  status: promoStatusSchema,
  imageUrl: z.string().nullable().optional(),
  animationUrl: z.string().nullable().optional(),
  message: z.string().optional(),
});

export type GeneratePromoResponse = z.infer<typeof generatePromoResponseSchema>;

export const exportFormatSchema = z.enum([
  'png',
  'mp4',
  'gif',
]);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

export const exportPromoRequestSchema = z.object({
  promoId: z.string(),
  format: exportFormatSchema.default('png'),
  width: z.number().min(512).max(1920).optional(),
  height: z.number().min(512).max(1920).optional(),
});

export type ExportPromoRequest = z.infer<typeof exportPromoRequestSchema>;

export const exportPromoResponseSchema = z.object({
  success: z.boolean(),
  downloadUrl: z.string().optional(),
  format: exportFormatSchema,
  message: z.string().optional(),
});

export type ExportPromoResponse = z.infer<typeof exportPromoResponseSchema>;

export const socialPromoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: promoTypeSchema,
  title: z.string(),
  caption: z.string(),
  tags: z.array(z.string()),
  imageUrl: z.string().nullable().optional(),
  animationUrl: z.string().nullable().optional(),
  aiPrompt: z.string().nullable().optional(),
  aiImagePrompt: z.string().nullable().optional(),
  themeColor: z.string().nullable().optional(),
  platforms: z.array(promoPlatformSchema),
  status: promoStatusSchema,
  downloadUrl: z.string().nullable().optional(),
  generatedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SocialPromo = z.infer<typeof socialPromoSchema>;

export const promoListQuerySchema = z.object({
  type: promoTypeSchema.optional(),
  status: promoStatusSchema.optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  cursor: z.string().optional(),
});

export type PromoListQuery = z.infer<typeof promoListQuerySchema>;

export const promoListResponseSchema = z.object({
  items: z.array(socialPromoSchema),
  total: z.number(),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type PromoListResponse = z.infer<typeof promoListResponseSchema>;
