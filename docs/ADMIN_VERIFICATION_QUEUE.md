
# Admin Verification Queue Documentation

## Overview
The admin verification queue allows administrators to review and approve/deny artist verification requests that require manual review.

## Component

### VerificationQueue Component
**Location:** `apps/web/components/Admin/VerificationQueue.tsx`

**Features:**
- List all pending verification tasks
- Search by email, username, or profile URL
- Filter by priority (high, normal, low)
- Bulk select and approve multiple tasks
- View AI confidence score and analysis
- Add admin notes to decisions
- Approve or deny with one click

## API Endpoints

### GET /api/admin/verification
Fetch pending verification tasks.

**Headers:**
- `x-admin`: 'true' (admin authentication)

**Response:**
```json
{
  "tasks": [
    {
      "task": {
        "id": "uuid",
        "userId": "uuid",
        "jobId": "uuid",
        "status": "pending",
        "priority": "normal",
        "notes": "AI flagged for manual review",
        "createdAt": "2025-01-15T10:30:00Z"
      },
      "job": {
        "id": "uuid",
        "profileUrl": "https://soundcloud.com/artist",
        "status": "completed",
        "score": 65,
        "evidence": { /* AI analysis */ },
        "reviewNotes": "Moderate confidence, needs human review"
      },
      "user": {
        "id": "uuid",
        "email": "artist@example.com",
        "username": "djartist"
      }
    }
  ]
}
```

### PATCH /api/admin/verification
Approve or deny a verification task.

**Headers:**
- `Content-Type`: application/json
- `x-admin`: 'true'

**Request Body:**
```json
{
  "taskId": "uuid",
  "action": "approve",
  "notes": "Verified social profile matches artist name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification approved"
}
```

## Actions

### Approve
1. Updates user verification status to `verified_manual`
2. Marks verification task as resolved
3. Sends notification to user
4. Logs action in audit trail

### Deny
1. Updates user verification status to `rejected_manual`
2. Marks verification task as resolved
3. Sends notification to user with admin notes
4. Logs action in audit trail

## Priority Levels

### High
- AI score very low (<30) but suspicious patterns detected
- Repeated submission attempts
- Flagged by fraud detection

### Normal
- AI score moderate (30-70)
- Needs human judgment
- Default priority

### Low
- AI score borderline (70-85)
- Minor issues detected
- Can wait for batch processing

## Filtering and Search

**Search Fields:**
- User email
- Username
- Profile URL

**Filters:**
- Priority (high, normal, low, all)
- Status (pending only in queue view)

**Bulk Actions:**
- Select multiple tasks
- Approve all selected (high-confidence batch approval)

## Security

**Admin Authentication:**
- Current: Header-based (`x-admin: true`)
- Production: JWT-based role verification required

**Rate Limiting:**
- 100 requests/hour per admin user
- Prevents abuse of bulk actions

## Testing

Run verification queue tests:
```bash
pnpm test tests/admin/verification-queue.test.ts
```

Run diagnostic script:
```bash
node scripts/diag/check-verification-queue.js
```

## Workflow

1. AI verification worker processes signup
2. If score 30-85 or flagged, creates admin task
3. Admin reviews task in queue
4. Admin adds notes and approves/denies
5. User receives notification
6. Task removed from queue

## Future Enhancements
- Email notifications to admins for high-priority tasks
- Automated reminders for pending tasks >7 days
- Admin activity dashboard
- Verification history view
- Appeal system for rejected users
