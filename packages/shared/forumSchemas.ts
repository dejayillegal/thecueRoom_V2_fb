import { z } from 'zod';

export const threadCreateSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be at most 200 characters'),
  body: z.string().min(10, 'Body must be at least 10 characters').max(10000, 'Body must be at most 10,000 characters'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  visibility: z.enum(['public', 'members', 'private']).default('public'),
  mentions: z.array(z.object({
    userId: z.string().uuid(),
    username: z.string(),
  })).optional(),
  embedLinks: z.array(z.string().url()).max(5, 'Maximum 5 embed links allowed').optional(),
});

export const threadUpdateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  body: z.string().min(10).max(10000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  visibility: z.enum(['public', 'members', 'private']).optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

export const replyCreateSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1, 'Reply cannot be empty').max(10000, 'Reply must be at most 10,000 characters'),
  parentReplyId: z.string().uuid().optional(),
  mentions: z.array(z.object({
    userId: z.string().uuid(),
    username: z.string(),
  })).optional(),
});

export const replyUpdateSchema = z.object({
  body: z.string().min(1).max(10000),
});

export const draftSaveSchema = z.object({
  title: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  body: z.string().max(10000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  visibility: z.enum(['public', 'members', 'private']).optional(),
  metadata: z.object({
    mentions: z.array(z.object({
      userId: z.string().uuid(),
      username: z.string(),
    })).optional(),
    attachments: z.array(z.object({
      type: z.string(),
      url: z.string(),
      filename: z.string().optional(),
    })).optional(),
  }).optional(),
});

export const mentionResolveSchema = z.object({
  q: z.string().min(1, 'Query must not be empty').max(50),
  limit: z.number().int().min(1).max(20).default(10),
  verified_only: z.boolean().optional(),
});

export const reactionCreateSchema = z.object({
  targetType: z.enum(['thread', 'reply']),
  targetId: z.string().uuid(),
  reaction: z.enum(['like', 'love', 'fire', 'laugh']).default('like'),
});

export const viewRecordSchema = z.object({
  targetType: z.enum(['thread', 'reply', 'profile']),
  targetId: z.string().uuid(),
});

export const moderationFlagSchema = z.object({
  targetType: z.enum(['thread', 'reply']),
  targetId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be at most 500 characters'),
});

export const moderationReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'lock', 'ban_user', 'blacklist']),
  notes: z.string().max(1000).optional(),
});

export const aiSuggestSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(500, 'Prompt must be at most 500 characters'),
  applyTo: z.array(z.enum(['title', 'body', 'tags'])).min(1, 'Must specify at least one target'),
  tone: z.enum(['neutral', 'concise', 'technical', 'friendly']).default('neutral'),
  checkAuthenticity: z.boolean().default(false),
  flagSpam: z.boolean().default(true),
});

export const aiModerateSchema = z.object({
  contentType: z.enum(['thread', 'reply']),
  text: z.string().min(1).max(10000),
  attachments: z.array(z.object({
    type: z.string(),
    url: z.string(),
  })).optional(),
  userId: z.string().uuid(),
});

export const threadFollowSchema = z.object({
  threadId: z.string().uuid(),
  notifyOnReply: z.boolean().default(true),
  notifyOnMention: z.boolean().default(true),
});

export const attachmentCreateSchema = z.object({
  postType: z.enum(['thread', 'reply']),
  postId: z.string().uuid(),
  type: z.enum(['image', 'ai_meme', 'ai_cover', 'file', 'audio']),
  url: z.string().url(),
  filename: z.string().optional(),
  size: z.number().int().positive().optional(),
  aiJobId: z.string().uuid().optional(),
});

export const threadListQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.enum(['newest', 'trending', 'unanswered', 'most_liked']).default('newest'),
  filter: z.enum(['all', 'pinned', 'locked', 'answered', 'unanswered']).optional(),
  visibility: z.enum(['public', 'members', 'private']).optional(),
});

export const contributorsQuerySchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  period: z.enum(['week', 'month', 'all_time']).default('week'),
});

export type ThreadCreate = z.infer<typeof threadCreateSchema>;
export type ThreadUpdate = z.infer<typeof threadUpdateSchema>;
export type ReplyCreate = z.infer<typeof replyCreateSchema>;
export type ReplyUpdate = z.infer<typeof replyUpdateSchema>;
export type DraftSave = z.infer<typeof draftSaveSchema>;
export type MentionResolve = z.infer<typeof mentionResolveSchema>;
export type ReactionCreate = z.infer<typeof reactionCreateSchema>;
export type ViewRecord = z.infer<typeof viewRecordSchema>;
export type ModerationFlag = z.infer<typeof moderationFlagSchema>;
export type ModerationReview = z.infer<typeof moderationReviewSchema>;
export type AISuggest = z.infer<typeof aiSuggestSchema>;
export type AIModerate = z.infer<typeof aiModerateSchema>;
export type ThreadFollow = z.infer<typeof threadFollowSchema>;
export type AttachmentCreate = z.infer<typeof attachmentCreateSchema>;
export type ThreadListQuery = z.infer<typeof threadListQuerySchema>;
export type ContributorsQuery = z.infer<typeof contributorsQuerySchema>;
