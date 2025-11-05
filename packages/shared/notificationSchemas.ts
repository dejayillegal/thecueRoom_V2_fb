import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'system',
  'verification_pending',
  'verification_approved',
  'verification_rejected',
  'promo_generated',
  'promo_exported',
  'mention',
  'reply',
  'like',
  'follow',
]);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  link: z.string().nullable().optional(),
  read: z.boolean().default(false),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const notificationListQuerySchema = z.object({
  type: notificationTypeSchema.optional(),
  read: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  cursor: z.string().optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const notificationListResponseSchema = z.object({
  items: z.array(notificationSchema),
  total: z.number(),
  unreadCount: z.number(),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;

export const markNotificationReadSchema = z.object({
  notificationId: z.string(),
});

export type MarkNotificationRead = z.infer<typeof markNotificationReadSchema>;

export const markAllNotificationsReadSchema = z.object({
  type: notificationTypeSchema.optional(),
});

export type MarkAllNotificationsRead = z.infer<typeof markAllNotificationsReadSchema>;

export const createNotificationSchema = z.object({
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  link: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateNotification = z.infer<typeof createNotificationSchema>;
