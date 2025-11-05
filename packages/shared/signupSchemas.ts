import { z } from 'zod';

export const signupRequestSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  isArtist: z.boolean().default(false),
  displayName: z.string().min(1).max(100).optional(),
  artistName: z.string().min(1).max(100).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  region: z.string().max(60).optional(),
  genre: z.string().max(120).optional(),
  publicProfile: z.boolean().default(true).optional(),
  platformUrl: z.string().url().optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string().url(),
  })).max(5).optional(),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const signupResponseSchema = z.object({
  success: z.boolean(),
  userId: z.string().optional(),
  profileId: z.string().optional(),
  verificationStatus: z.enum(['queued', 'pending', 'approved', 'rejected', 'not_required']).optional(),
  message: z.string(),
});

export type SignupResponse = z.infer<typeof signupResponseSchema>;

export const verificationStatusSchema = z.enum([
  'pending',
  'processing',
  'approved',
  'rejected',
  'manual_review',
]);

export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const verificationDecisionSchema = z.enum([
  'approve',
  'reject',
  'manual_review',
]);

export type VerificationDecision = z.infer<typeof verificationDecisionSchema>;

export const aiVerificationResultSchema = z.object({
  decision: verificationDecisionSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  artistName: z.string().optional(),
  profileUrl: z.string().optional(),
  platformLink: z.string().optional(),
  flags: z.array(z.string()).optional(),
});

export type AIVerificationResult = z.infer<typeof aiVerificationResultSchema>;

export const verificationCheckSchema = z.object({
  userId: z.string(),
  profileId: z.string(),
});

export type VerificationCheck = z.infer<typeof verificationCheckSchema>;

export const verificationStatusResponseSchema = z.object({
  status: verificationStatusSchema,
  decision: verificationDecisionSchema.optional(),
  result: aiVerificationResultSchema.optional(),
  createdAt: z.string(),
  processedAt: z.string().nullable().optional(),
});

export type VerificationStatusResponse = z.infer<typeof verificationStatusResponseSchema>;
