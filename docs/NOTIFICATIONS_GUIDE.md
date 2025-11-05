# Toast & Notifications System Guide

Comprehensive guide for using the Toast and Notifications system in thecueRoom.

## Table of Contents

1. [Toast System](#toast-system)
2. [Notifications System](#notifications-system)
3. [API Reference](#api-reference)
4. [Worker Configuration](#worker-configuration)

---

## Toast System

### Installation

The Toast system is already integrated. Add the Toaster component to your app layout:

```tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### Basic Usage

```tsx
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast, success, error, warning, info, pending } = useToast()

  const handleAction = async () => {
    const t = pending('Processing your request...')
    
    try {
      await someAsyncOperation()
      t.update({ variant: 'success', title: 'Success!', description: 'Operation completed' })
    } catch (err) {
      t.update({ variant: 'error', title: 'Error', description: 'Something went wrong' })
    }
  }

  return (
    <button onClick={handleAction}>Do Something</button>
  )
}
```

### Toast Variants

```tsx
// Success toast
success('Profile updated successfully')
success({ title: 'Success', description: 'Your changes have been saved' })

// Error toast
error('Failed to save changes')
error({ title: 'Error', description: 'Please try again later' })

// Warning toast
warning('Your session will expire soon')

// Info toast
info('New features available!')

// Pending toast (doesn't auto-dismiss)
const t = pending('Loading...')
// Later: t.update({ variant: 'success', description: 'Done!' })
// Or: t.dismiss()
```

### Advanced Toast Options

```tsx
const { toast } = useToast()

toast({
  variant: 'success',
  title: 'Upload Complete',
  description: '5 files uploaded successfully',
  duration: 8000, // Auto-dismiss after 8 seconds
  action: <ToastAction altText="View">View Files</ToastAction>
})
```

---

## Notifications System

### Adding Notifications Button to UI

```tsx
import { NotificationsButton } from '@/components/notifications'
import { useEffect, useState } from 'react'

function AppHeader() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    const res = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data.notifications)
    setUnreadCount(data.unreadCount)
    setLoading(false)
  }

  const handleMarkAsRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id })
    })
    fetchNotifications()
  }

  const handleMarkAllAsRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true })
    })
    fetchNotifications()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    fetchNotifications()
  }

  return (
    <header>
      <NotificationsButton
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        isLoading={loading}
      />
    </header>
  )
}
```

---

## API Reference

### GET /api/notifications

Fetch notifications for the current user.

**Query Parameters:**
- `type` - Filter by notification type (optional)
- `filter` - `all`, `unread`, or `read` (default: `all`)
- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "notifications": [...],
  "unreadCount": 5,
  "total": 20,
  "hasMore": false
}
```

### POST /api/notifications (Admin Only)

Send notifications to users.

**Request Body:**
```json
{
  "target": {
    "userIds": ["user-uuid-1", "user-uuid-2"]
  },
  "type": "announcement",
  "title": "New Feature Available",
  "body": "Check out our latest update!",
  "link": "/features/new"
}
```

### PATCH /api/notifications

Mark notifications as read.

**Request Body:**
```json
{
  "notificationId": "notification-uuid"
}
// OR
{
  "markAll": true
}
```

### DELETE /api/notifications

Delete notifications.

**Query Parameters:**
- `id` - Notification ID to delete
- `all=true` - Delete all read notifications

### GET /api/notifications/preferences

Get user notification preferences.

**Response:**
```json
{
  "preferences": {
    "emailDigest": true,
    "inApp": true,
    "push": false,
    "dndStart": "22:00",
    "dndEnd": "08:00"
  }
}
```

### PUT /api/notifications/preferences

Update notification preferences.

**Request Body:**
```json
{
  "emailDigest": false,
  "push": true,
  "dndStart": "23:00",
  "dndEnd": "07:00"
}
```

---

## Worker Configuration

The notification worker processes and delivers notifications in the background.

### Environment Variables

```env
TEST_MODE=true                      # Enable test mode (mock adapters)
NOTIFICATION_CONCURRENCY=5           # Concurrent processing (default: 5)
NOTIFICATION_BATCH_SIZE=50           # Notifications per batch (default: 50)
NOTIFICATION_POLL_INTERVAL_MS=5000   # Polling interval (default: 5000ms)
```

### Running the Worker

```bash
# Development (with test mode)
TEST_MODE=true tsx packages/notifications/worker.ts

# Production
NOTIFICATION_CONCURRENCY=10 tsx packages/notifications/worker.ts
```

### Worker Features

- **Batching**: Processes up to 50 notifications per cycle
- **Rate Limiting**: 100 notifications per minute per user
- **Concurrency Control**: Processes 5 notifications in parallel (configurable)
- **Mock Adapters**: Test mode uses mock email/push adapters
- **Audit Logging**: All delivery attempts are logged

---

## Notification Types

The system supports these notification types:

- `system` - System notifications
- `verification_pending` - Verification status updates
- `verification_approved` - Verification approved
- `verification_rejected` - Verification rejected
- `promo_generated` - Promo material ready
- `mention` - User mentions
- `reply` - Comment replies
- `like` - Content likes
- `follow` - New followers
- `gig` - Gig updates
- `event` - Event updates
- `announcement` - Platform announcements
- `admin_message` - Admin messages

---

## Best Practices

### 1. Use Toasts for Immediate Feedback

```tsx
// Good: Immediate user action feedback
const handleSave = async () => {
  const t = pending('Saving...')
  try {
    await saveProfile()
    t.update({ variant: 'success', description: 'Profile saved!' })
  } catch (err) {
    t.update({ variant: 'error', description: 'Failed to save' })
  }
}
```

### 2. Use Notifications for Important Updates

```tsx
// Good: Important updates that users should review
await createNotification({
  userId: user.id,
  type: 'verification_approved',
  title: 'Profile Verified!',
  body: 'Your artist profile has been verified',
  link: '/profile'
})
```

### 3. Respect User Preferences

Always check notification preferences before sending:

```tsx
const prefs = await getNotificationPreferences(userId)
if (prefs.inApp) {
  // Send in-app notification
}
if (prefs.emailDigest) {
  // Queue for email digest
}
```

### 4. Don't Spam Users

- Batch similar notifications
- Respect DND (Do Not Disturb) hours
- Allow users to mute specific notification types
- Use rate limiting

---

## Testing

### Test Toast System

```tsx
// In any component
const { success, error, warning, info, pending } = useToast()

// Test all variants
success('Success toast')
error('Error toast')
warning('Warning toast')
info('Info toast')
const t = pending('Pending toast')
setTimeout(() => t.update({ variant: 'success', description: 'Done!' }), 2000)
```

### Test Notification System

```bash
# 1. Start the worker in test mode
TEST_MODE=true tsx packages/notifications/worker.ts

# 2. Send a test notification via API
curl -X POST http://localhost:5000/api/notifications \
  -H "Content-Type: application/json" \
  -H "x-admin: true" \
  -d '{
    "target": { "userIds": ["your-user-id"] },
    "type": "announcement",
    "title": "Test Notification",
    "body": "This is a test notification"
  }'

# 3. Check your notifications panel
```

---

## Troubleshooting

### Toasts Not Appearing

1. Verify `<Toaster />` is added to your app layout
2. Check console for import errors
3. Ensure you're calling `useToast()` inside a React component

### Notifications Not Delivering

1. Check worker is running: `ps aux | grep worker`
2. Verify database connection
3. Check worker logs for errors
4. Ensure notifications table has undelivered items

### Worker Performance Issues

1. Reduce `NOTIFICATION_CONCURRENCY` if database is overloaded
2. Increase `NOTIFICATION_POLL_INTERVAL_MS` to reduce polling frequency
3. Monitor rate limits and adjust if needed
4. Check audit logs for delivery failures

---

## Migration from Old System

If you have an existing notification system:

1. Update database schema (migrations already applied)
2. Replace old toast calls with `useToast` hook
3. Update API endpoints to use new routes
4. Start notification worker
5. Test thoroughly before removing old code

---

## Support

For issues or questions:
- Check the troubleshooting section
- Review worker logs: `tail -f logs/notification-worker.log`
- Check database for stuck notifications
- Review audit logs for delivery failures
