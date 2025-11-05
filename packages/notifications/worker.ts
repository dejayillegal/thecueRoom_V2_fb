#!/usr/bin/env node
import { getDbClient } from '../db/client';
import { notifications, notificationAuditLog, notificationPreferences, users } from '../db/schema';
import { eq, and, isNull, lte } from 'drizzle-orm';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import Bottleneck from 'bottleneck';

const TEST_MODE = process.env.TEST_MODE === 'true';
const NOTIFICATION_CONCURRENCY = parseInt(process.env.NOTIFICATION_CONCURRENCY || '5');
const BATCH_SIZE = parseInt(process.env.NOTIFICATION_BATCH_SIZE || '50');
const POLL_INTERVAL_MS = parseInt(process.env.NOTIFICATION_POLL_INTERVAL_MS || '5000');

console.log('[Notification Worker] Starting...');
console.log('[Notification Worker] Test Mode:', TEST_MODE);
console.log('[Notification Worker] Concurrency:', NOTIFICATION_CONCURRENCY);
console.log('[Notification Worker] Batch Size:', BATCH_SIZE);
console.log('[Notification Worker] Poll Interval:', POLL_INTERVAL_MS, 'ms');

const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

const limiter = new Bottleneck({
  maxConcurrent: NOTIFICATION_CONCURRENCY,
  minTime: 100,
});

interface MockEmailAdapter {
  send: (to: string, subject: string, body: string) => Promise<{ success: boolean; messageId: string }>;
}

interface MockPushAdapter {
  send: (userId: string, title: string, body: string) => Promise<{ success: boolean; messageId: string }>;
}

const emailAdapter: MockEmailAdapter = {
  async send(to: string, subject: string, body: string) {
    if (TEST_MODE) {
      console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
      return {
        success: true,
        messageId: `mock-email-${Date.now()}`,
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
      messageId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  },
};

const pushAdapter: MockPushAdapter = {
  async send(userId: string, title: string, body: string) {
    if (TEST_MODE) {
      console.log(`[Mock Push] UserId: ${userId}, Title: ${title}`);
      return {
        success: true,
        messageId: `mock-push-${Date.now()}`,
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
      messageId: `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  },
};

async function logAudit(
  db: ReturnType<typeof getDbClient>,
  notificationId: string,
  action: string,
  channel: string,
  status: string,
  metadata?: Record<string, any>
) {
  try {
    await db.insert(notificationAuditLog).values({
      action,
      payload: {
        notificationId,
        channel,
        status,
        ...metadata,
      },
    });
  } catch (error) {
    console.error('[Audit Log] Error:', error);
  }
}

async function processNotification(notification: any) {
  const db = getDbClient();
  
  try {
    console.log(`[Worker] Processing notification ${notification.id} for user ${notification.userId}`);
    
    try {
      await rateLimiter.consume(notification.userId || 'system', 1);
    } catch (rateLimitError) {
      console.warn(`[Worker] Rate limit exceeded for user ${notification.userId}`);
      await logAudit(
        db,
        notification.id,
        'delivery_attempted',
        'in_app',
        'rate_limited',
        { reason: 'User rate limit exceeded' }
      );
      return;
    }

    const [prefs] = notification.userId
      ? await db
          .select()
          .from(notificationPreferences)
          .where(eq(notificationPreferences.userId, notification.userId))
          .limit(1)
      : [];

    if (prefs && prefs.inApp !== false) {
      await db
        .update(notifications)
        .set({ delivered: true })
        .where(eq(notifications.id, notification.id));
      
      await logAudit(
        db,
        notification.id,
        'delivered',
        'in_app',
        'success',
        { timestamp: new Date().toISOString() }
      );
      
      console.log(`[Worker] Delivered in-app notification ${notification.id}`);
    }

    if (prefs?.push && !TEST_MODE) {
      try {
        const result = await pushAdapter.send(
          notification.userId,
          notification.title,
          notification.body
        );
        
        await logAudit(
          db,
          notification.id,
          'delivered',
          'push',
          'success',
          { messageId: result.messageId }
        );
        
        console.log(`[Worker] Sent push notification ${notification.id}`);
      } catch (error: any) {
        await logAudit(
          db,
          notification.id,
          'delivery_failed',
          'push',
          'error',
          { error: error.message }
        );
      }
    }

    if (prefs?.emailDigest && notification.userId) {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, notification.userId))
          .limit(1);
        
        if (user?.email && !TEST_MODE) {
          const result = await emailAdapter.send(
            user.email,
            notification.title,
            notification.body
          );
          
          await logAudit(
            db,
            notification.id,
            'delivered',
            'email',
            'success',
            { messageId: result.messageId }
          );
          
          console.log(`[Worker] Sent email notification ${notification.id} to ${user.email}`);
        }
      } catch (error: any) {
        await logAudit(
          db,
          notification.id,
          'delivery_failed',
          'email',
          'error',
          { error: error.message }
        );
      }
    }

    console.log(`[Worker] Completed processing notification ${notification.id}`);
  } catch (error) {
    console.error(`[Worker] Error processing notification ${notification.id}:`, error);
    await logAudit(
      db,
      notification.id,
      'delivery_failed',
      'system',
      'error',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

async function pollNotifications() {
  const db = getDbClient();
  
  try {
    const pendingNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.delivered, false))
      .limit(BATCH_SIZE);

    if (pendingNotifications.length === 0) {
      return;
    }

    console.log(`[Worker] Found ${pendingNotifications.length} pending notifications`);

    const tasks = pendingNotifications.map(notification =>
      limiter.schedule(() => processNotification(notification))
    );

    await Promise.allSettled(tasks);
    console.log(`[Worker] Processed batch of ${pendingNotifications.length} notifications`);
  } catch (error) {
    console.error('[Worker] Error in poll cycle:', error);
  }
}

async function run() {
  console.log('[Notification Worker] Polling started');
  
  setInterval(pollNotifications, POLL_INTERVAL_MS);
  
  await pollNotifications();
}

run().catch(error => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n[Worker] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Worker] Shutting down...');
  process.exit(0);
});
