
# Profile Settings Documentation

## Overview
The profile settings system allows users to manage their personal information, privacy settings, and AI credits.

## Components

### MyProfileSettings Component
**Location:** `apps/web/components/Profile/MyProfileSettings.tsx`

**Features:**
- Display name, first/last name, bio editing
- Phone number input with validation
- Region and genre selection (dropdowns)
- Avatar upload (TODO: implement S3/storage integration)
- Privacy toggles:
  - `showEmail`: Display email on public profile
  - `showPhone`: Display phone on public profile
  - `publicReleases`: Show releases publicly
  - `allowContactRequests`: Allow others to contact
- AI credits display (read-only)
- Real-time save/cancel with change detection

## API Endpoints

### GET /api/profile
Fetch current user's profile data.

**Headers:**
- `x-user-id`: User ID (temporary auth)

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "djuser",
    "verified": true,
    "verificationStatus": "verified_ai",
    "role": "artist"
  },
  "profile": {
    "displayName": "DJ User",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Professional DJ...",
    "avatar": "https://...",
    "phone": "+1 555-123-4567",
    "region": "North America",
    "genre": "Techno",
    "showEmail": false,
    "showPhone": false,
    "publicReleases": true,
    "allowContactRequests": true,
    "aiCredits": 100
  }
}
```

### PATCH /api/profile
Update user profile settings.

**Headers:**
- `Content-Type`: application/json
- `x-user-id`: User ID

**Request Body:**
```json
{
  "displayName": "DJ User Updated",
  "bio": "New bio...",
  "showEmail": true,
  "showPhone": false
}
```

**Response:**
```json
{
  "success": true,
  "profile": { /* updated profile */ }
}
```

## Read-Only Fields
These fields are displayed but cannot be edited via settings:
- Email (set during signup)
- Username (set during signup)
- Artist name (set during signup, linked to verification)
- Verification status
- Account role

## Privacy Settings

### showEmail
- **Default:** `false`
- **Effect:** When `true`, email is visible on public profile

### showPhone
- **Default:** `false`
- **Effect:** When `true`, phone is visible on public profile

### publicReleases
- **Default:** `true`
- **Effect:** When `true`, releases are shown on public profile

### allowContactRequests
- **Default:** `true`
- **Effect:** When `true`, users can send contact requests

## Testing

Run profile settings tests:
```bash
pnpm test tests/profile/settings.test.ts
```

Run diagnostic script:
```bash
node scripts/diag/check-profile-settings.js
```

## Future Enhancements
- Avatar upload to cloud storage
- Social links management
- Email change with verification
- Password change functionality
- Two-factor authentication settings
