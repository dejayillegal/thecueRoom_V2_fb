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
  'comment',
  'gig',
  'event',
  'announcement',
  'admin_message',
  'release',
]);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  payload: z.record(z.any()).nullable().optional(),
  link: z.string().nullable().optional(),
  read: z.boolean().default(false),
  delivered: z.boolean().default(false),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const notificationTargetSchema = z.object({
  userIds: z.array(z.string().uuid()).optional(),
  role: z.enum(['admin', 'artist', 'user']).optional(),
  all: z.boolean().optional(),
}).refine(
  (data) => data.userIds || data.role || data.all,
  { message: 'Must specify userIds, role, or all' }
);

export type NotificationTarget = z.infer<typeof notificationTargetSchema>;

export const notificationSendSchema = z.object({
  target: notificationTargetSchema,
  type: notificationTypeSchema,
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1000),
  payload: z.record(z.any()).optional(),
  link: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
  scheduleFor: z.string().datetime().optional(),
});

export type NotificationSend = z.infer<typeof notificationSendSchema>;

export const notificationListQuerySchema = z.object({
  type: notificationTypeSchema.optional(),
  read: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  cursor: z.string().optional(),
  filter: z.enum(['all', 'unread', 'read']).optional().default('all'),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const notificationListResponseSchema = z.object({
  items: z.array(notificationSchema),
  data: z.array(notificationSchema),
  total: z.number(),
  unreadCount: z.number(),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;

export const markNotificationReadSchema = z.object({
  notificationId: z.string().optional(),
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
  read: z.boolean().default(true),
}).refine(
  (data) => data.notificationId || data.ids || data.all,
  { message: 'Must specify notificationId, ids, or all' }
);

export type MarkNotificationRead = z.infer<typeof markNotificationReadSchema>;

export const markAllNotificationsReadSchema = z.object({
  type: notificationTypeSchema.optional(),
});

export type MarkAllNotificationsRead = z.infer<typeof markAllNotificationsReadSchema>;

export const createNotificationSchema = z.object({
  userId: z.string().nullable().optional(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  payload: z.record(z.any()).optional(),
  link: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateNotification = z.infer<typeof createNotificationSchema>;

export const notificationDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type NotificationDelete = z.infer<typeof notificationDeleteSchema>;

export const notificationPreferencesSchema = z.object({
  emailDigest: z.boolean().optional(),
  inApp: z.boolean().optional(),
  push: z.boolean().optional(),
  dndStart: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  dndEnd: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  mutedTypes: z.array(notificationTypeSchema).optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const toastTypeSchema = z.enum([
  'success',
  'error',
  'info',
  'warning',
  'pending',
]);

export type ToastType = z.infer<typeof toastTypeSchema>;

export const toastStatusSchema = z.enum([
  'pending',
  'updated',
  'dismissed',
  'completed',
]);

export type ToastStatus = z.infer<typeof toastStatusSchema>;

export const toastCreateSchema = z.object({
  type: toastTypeSchema,
  title: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(500),
  duration: z.number().int().positive().optional(),
  action: z.object({
    label: z.string().min(1).max(50),
    onClick: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

export type ToastCreate = z.infer<typeof toastCreateSchema>;

export const toastUpdateSchema = z.object({
  id: z.string().uuid(),
  type: toastTypeSchema.optional(),
  title: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(500).optional(),
  status: toastStatusSchema.optional(),
});

export type ToastUpdate = z.infer<typeof toastUpdateSchema>;

export const toastTrackSchema = z.object({
  toastId: z.string().uuid(),
  action: z.enum(['shown', 'dismissed', 'action_clicked']),
  metadata: z.record(z.any()).optional(),
});

export type ToastTrack = z.infer<typeof toastTrackSchema>;
