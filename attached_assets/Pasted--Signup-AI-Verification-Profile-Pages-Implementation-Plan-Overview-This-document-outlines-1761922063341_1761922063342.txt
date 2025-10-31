# Signup + AI Verification + Profile Pages - Implementation Plan

## Overview
This document outlines the complete implementation plan for the robust signup and verification system for thecueRoom.

---

## ✅ MVP COMPLETED (Phase 1)

### Backend Infrastructure
- ✅ Database schema updated with verification tables
  - `verification_jobs` - Tracks AI verification progress
  - `verification_tasks` - Admin manual review queue
  - `notifications` - User notification system
  - `audit_logs` - Security and compliance logging
  - Profile privacy fields (showEmail, showPhone, publicReleases, allowContactRequests)

- ✅ API Routes Implemented
  - `POST /api/auth/signup` - Full signup with validation
    - Auto-generated creative usernames
    - Artist name and email uniqueness checks
    - Password hashing with bcrypt
    - Automatic verification job creation
  
  - `POST /api/auth/check-availability` - Real-time availability checks
    - Rate limiting (20 requests/minute per IP)
    - Support for email, artist name, username checks
    
  - `GET /api/verification/job/[jobId]` - Job status polling
    - Progress tracking
    - Real-time status updates
    
  - `GET/PATCH /api/admin/verification` - Admin verification queue
    - List pending tasks
    - Approve/deny with notes
    - Automatic user notifications
    
  - `GET/PATCH /api/notifications` - Notification system
    - User notification list
    - Mark as read functionality

- ✅ Verification Worker System
  - `packages/verification/worker.ts` - Main worker process
    - TEST_MODE support for deterministic testing
    - Concurrent job processing (configurable)
    - Job metadata logging to AI_TEMP_DIR
    
  - `packages/verification/utils.ts` - Verification utilities
    - safeFetch with timeout and error handling
    - Social signal extraction (artist name, releases, followers)
    - Confidence scoring algorithm
    - Platform recognition (SoundCloud, Spotify, etc.)

- ✅ Environment Configuration
  - `.env.example` with all required variables
  - TEST_MODE for development/testing
  - Configurable rate limiting
  - Verification worker concurrency settings

---

## 🚧 PHASE 2: Frontend Components (In Progress)

### Priority 1: Signup Flow

#### SignupModal Component (`apps/web/src/components/Auth/SignupModal.tsx`)
**Status:** Needs Implementation

**Requirements:**
```typescript
interface SignupFormData {
  firstName: string;
  lastName: string;
  artistName: string;
  email: string;
  password: string;
  confirmPassword: string;
  region: string;
  genre: string;
  socialLinks: string[]; // Max 5
}
```

**Features Needed:**
- [ ] Form validation with Zod schema
- [ ] Real-time availability checks (debounced 500ms)
  - Green checkmark for available
  - Red X for taken
  - Inline error messages
- [ ] Auto-username generator
  - Shows preview on artistName blur
  - "Regenerate" button with 3 alternatives
  - Uses creative suffixes (sub, grid, void, etc.)
- [ ] Password strength indicator
  - Min 10 chars
  - Must include number or symbol
  - Confirm password match validation
- [ ] Social links array (0-5 links)
  - Add/remove functionality
  - URL validation
- [ ] Submit handling
  - Disable button until all validations pass
  - Loading spinner during submission
  - Open VerificationModal on success

**UI/UX:**
- Match dashboard dark theme
- Responsive design (mobile-first)
- Keyboard navigation support
- ARIA labels for accessibility

---

#### VerificationModal Component (`apps/web/src/components/Auth/VerificationModal.tsx`)
**Status:** Needs Implementation

**Requirements:**
```typescript
interface VerificationModalProps {
  jobId: string;
  onComplete: () => void;
}
```

**Features Needed:**
- [ ] Real-time status polling (every 2 seconds)
  - Alternative: SSE/EventSource for push updates
- [ ] Progress bar with steps:
  1. Queued → 2. Fetching links → 3. Analyzing → 4. AI Decision → 5. Complete
- [ ] Status displays:
  - **Verified:** Show success, badge animation, "Go to Dashboard" button
    - Auto-redirect after 3 seconds
  - **Pending Admin:** Show "Manual review required" message
    - Explain admin has been notified
  - **Rejected:** Show detailed feedback
    - Link to edit social links and retry
- [ ] Confidence score visualization
- [ ] Evidence/reasons display
- [ ] Close prevention during processing
- [ ] Keyboard shortcuts (ESC to close when complete)

---

### Priority 2: Profile System

#### PublicProfile Component (`apps/web/src/components/Profile/PublicProfile.tsx`)
**Status:** Needs Implementation

**Features Needed:**
- [ ] User header
  - Avatar, display name, username
  - Verified badge (if applicable)
  - Region, genres
- [ ] Bio section
- [ ] Social links (open in new tab)
- [ ] Stats section (followers, gigs count, releases)
- [ ] Recent releases (if publicReleases = true)
- [ ] Privacy-aware rendering
  - Hide email unless showEmail = true
  - Hide phone unless showPhone = true
  - Respect other privacy flags
- [ ] Actions for signed-in users
  - Follow/Unfollow button
  - Report button
  - Contact button (if allowContactRequests = true)

---

#### MyProfileSettings Component (`apps/web/src/components/Profile/MyProfileSettings.tsx`)
**Status:** Needs Implementation

**Features Needed:**
- [ ] Privacy toggles
  - Show email to public (boolean)
  - Show phone to public (boolean)
  - Public releases visibility (boolean)
  - Allow contact requests (boolean)
- [ ] Profile editing
  - Bio, avatar upload
  - Social links management
  - Region/genre updates
- [ ] Save/cancel buttons
- [ ] Confirmation on privacy changes
- [ ] Real-time save status

---

### Priority 3: Admin Dashboard

#### VerificationQueue Component (`apps/web/src/components/Admin/VerificationQueue.tsx`)
**Status:** Needs Implementation

**Features Needed:**
- [ ] Table view of pending verifications
  - User info (name, email, username)
  - Submitted date
  - AI confidence score
  - Social links
  - Job evidence
- [ ] Filter/sort options
  - By date, score, priority
  - Search by username/email
- [ ] Quick actions
  - Approve with one click
  - Deny with required notes
  - View full user profile
- [ ] Bulk actions
  - Select multiple
  - Batch approve/deny
- [ ] Admin notes/comments
  - Internal notes on each task
  - History of actions

---

## 🧪 PHASE 3: Testing Suite

### Unit Tests (`tests/`)

#### `tests/auth/signup.unit.test.ts`
**Status:** Needs Implementation

**Test Coverage:**
```typescript
describe('Signup Validation', () => {
  it('validates required fields');
  it('enforces password rules (min 10 chars, number/symbol)');
  it('validates confirm password matches');
  it('validates email format');
  it('validates social links (max 5, valid URLs)');
  it('generates unique usernames with creative suffixes');
  it('sanitizes user inputs (XSS prevention)');
});

describe('Availability Checks', () => {
  it('returns available for unique email');
  it('returns unavailable for existing email');
  it('returns available for unique artist name');
  it('returns unavailable for taken artist name');
  it('respects rate limiting');
});
```

---

#### `tests/verification/worker.unit.test.ts`
**Status:** Needs Implementation

**Test Coverage:**
```typescript
describe('Verification Worker', () => {
  it('processes jobs with TEST_MODE deterministic results');
  it('respects VERIF_CONCURRENCY limit');
  it('creates job metadata files in AI_TEMP_DIR');
  it('handles fetch timeouts gracefully');
  it('extracts social signals from fixture HTML');
  it('scores signals correctly');
  it('creates admin tasks for pending decisions');
  it('sends notifications on completion');
});

describe('Heuristics', () => {
  it('recognizes known platforms');
  it('detects artist name presence');
  it('identifies release indicators');
  it('calculates confidence scores');
  it('makes correct verify/pending/reject decisions');
});
```

---

### E2E Tests (`tests/e2e/`)

#### `tests/e2e/signup.flow.spec.ts`
**Status:** Needs Implementation

**Test Scenarios:**
```typescript
test('Complete signup flow - AI auto-verify path', async ({ page }) => {
  // 1. Open signup modal
  // 2. Fill all fields
  // 3. Check real-time availability (green ticks)
  // 4. Generate username, see alternatives
  // 5. Submit form
  // 6. See verification modal
  // 7. Poll progress to completion
  // 8. Verify "verified" status
  // 9. Auto-redirect to dashboard
});

test('Signup flow - admin approval path', async ({ page }) => {
  // 1-5. Same as above
  // 6. See verification modal
  // 7. Receive "pending_admin" decision
  // 8. Admin logs in
  // 9. Admin approves
  // 10. User receives notification
  // 11. User becomes verified
});

test('Rate limiting on availability checks', async ({ page }) => {
  // Rapidly check availability
  // Verify rate limit message appears
});
```

---

#### `tests/e2e/profile.spec.ts`
**Status:** Needs Implementation

**Test Scenarios:**
```typescript
test('Public profile respects privacy settings', async ({ page }) => {
  // 1. Create user with showEmail=false
  // 2. View as another user
  // 3. Verify email is hidden
  // 4. Toggle showEmail=true
  // 5. Verify email now visible
});

test('Profile privacy toggles work correctly', async ({ page }) => {
  // Test all 4 privacy flags
  // Verify changes persist
  // Verify other users see updated privacy
});
```

---

## 🔧 PHASE 4: Diagnostics & Monitoring

### Diagnostic Scripts (`scripts/diag/`)

#### `scripts/diag/check-signup-rate-limit.js`
**Status:** Needs Implementation

**Purpose:**
- Simulate 30 rapid availability check requests
- Verify rate limiting kicks in at 20 requests
- Measure response times
- Output: Pass/Fail + stats

---

#### `scripts/diag/run-verif-worker-sim.js`
**Status:** Needs Implementation

**Purpose:**
- Create 10 test verification jobs
- Run worker with VERIF_CONCURRENCY=2
- Monitor memory usage (should stay < 50MB)
- Verify concurrent processing
- Check all jobs complete successfully
- Validate job metadata files created
- Output: Performance report

---

#### `scripts/diag/test-verification-heuristics.js`
**Status:** Needs Implementation

**Purpose:**
- Test signal extraction on fixture HTML files
- Verify scoring algorithm
- Test all decision paths (verified/pending/rejected)
- Validate platform recognition
- Output: Accuracy metrics

---

## 📊 PHASE 5: Acceptance Criteria Validation

### Checklist

- [ ] **TypeScript Compilation**
  ```bash
  pnpm -w tsc --noEmit → 0 errors
  ```

- [ ] **Unit Tests Pass**
  ```bash
  pnpm test
  ```

- [ ] **E2E Tests Pass**
  ```bash
  pnpm test:e2e
  ```

- [ ] **Verification Worker**
  - [ ] Logs present in `AI_TEMP_DIR/verification/*.json`
  - [ ] TEST_MODE deterministic results
  - [ ] Concurrency respected
  - [ ] No memory leaks (< 50MB sustained)

- [ ] **Signup Flow**
  - [ ] Live tick marks for availability
  - [ ] Auto-username generation works
  - [ ] "Regenerate" provides alternatives
  - [ ] All validations enforced

- [ ] **Verification Flow**
  - [ ] Modal shows progress steps
  - [ ] Verified users auto-redirect
  - [ ] Pending users see appropriate message
  - [ ] Rejected users can retry

- [ ] **Profile System**
  - [ ] Privacy toggles work
  - [ ] Sensitive info hidden when flags = false
  - [ ] Public profiles render correctly

- [ ] **Security**
  - [ ] Rate limiting active
  - [ ] Input sanitization (no XSS)
  - [ ] Passwords hashed with bcrypt
  - [ ] CSRF protection (if applicable)

- [ ] **Admin Queue**
  - [ ] Pending tasks appear
  - [ ] Approve/deny updates user status
  - [ ] Notifications sent on action
  - [ ] Audit log entries created

---

## 🚀 PHASE 6: Production Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured
  - [ ] DATABASE_URL set
  - [ ] JWT_SECRET generated
  - [ ] SMTP_URL configured (or email queue fallback)
  - [ ] HF_TOKEN added if using Hugging Face
  - [ ] TEST_MODE=false in production

- [ ] Database migrations applied
  ```bash
  pnpm db:push --force
  ```

- [ ] Verification worker running
  ```bash
  node packages/verification/worker.js
  # OR as background service/PM2/systemd
  ```

- [ ] Email templates reviewed
  - Verification success
  - Verification pending
  - Verification denied
  - Admin approval notification

- [ ] Monitoring configured
  - Worker health checks
  - Error logging (Sentry/similar)
  - Performance metrics
  - Rate limit alerts

---

## 📝 Documentation Tasks

### User Documentation
- [ ] Signup guide with screenshots
- [ ] Verification process explanation
- [ ] Privacy settings guide
- [ ] FAQ section

### Developer Documentation
- [ ] API endpoint documentation
- [ ] Verification worker architecture
- [ ] Database schema diagrams
- [ ] Heuristics algorithm explanation
- [ ] TEST_MODE usage guide
- [ ] Local development setup

### Admin Documentation
- [ ] Admin dashboard user guide
- [ ] Verification approval best practices
- [ ] Common rejection reasons
- [ ] Escalation procedures

---

## ⏱️ Estimated Time Breakdown

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Backend (MVP) | ✅ Completed | 4 hours |
| Phase 2: Frontend | SignupModal, VerificationModal, Profiles, Admin | 8-10 hours |
| Phase 3: Testing | Unit + E2E tests | 6-8 hours |
| Phase 4: Diagnostics | Scripts + monitoring | 2-3 hours |
| Phase 5: Acceptance | Validation + fixes | 2-4 hours |
| Phase 6: Deployment | Setup + docs | 2-3 hours |
| **Total** | | **24-32 hours** |

---

## 🎯 Next Steps (Priority Order)

1. **Immediate (Next 2-4 hours):**
   - Implement SignupModal component
   - Implement VerificationModal component
   - Basic manual testing

2. **Short-term (Next 8 hours):**
   - Implement PublicProfile component
   - Implement MyProfileSettings component
   - Implement Admin VerificationQueue component
   - Add unit tests for critical paths

3. **Medium-term (Next 16 hours):**
   - Complete E2E test suite
   - Create diagnostic scripts
   - Run full acceptance validation
   - Fix any discovered issues

4. **Pre-launch:**
   - Documentation completion
   - Production environment setup
   - Load testing
   - Security audit

---

## 🐛 Known Issues / TODOs

1. **TypeScript Errors:** 2 LSP diagnostics in `scripts/seed-admin.ts` - review and fix
2. **Email System:** Currently using DB-queue fallback, implement SMTP integration
3. **HF Integration:** Optional Hugging Face verification enhancement
4. **WebSocket Support:** Consider replacing polling with WebSocket for real-time updates
5. **Avatar Upload:** Implement image upload for profile avatars
6. **Social Link Validation:** Add deeper validation beyond URL format check

---

## 📧 Support & Questions

For implementation questions or issues:
1. Check this plan first
2. Review existing API code in `apps/web/app/api/`
3. Check worker implementation in `packages/verification/`
4. Refer to `.env.example` for configuration

---

**Last Updated:** October 31, 2025  
**Status:** Phase 1 Complete | Phase 2 In Progress
