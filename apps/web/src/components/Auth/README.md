
# Authentication Components

## SignupModal

The `SignupModal` component provides a comprehensive sign-up experience with support for both regular users and artist/DJ accounts with AI verification.

### Features

#### Artist Signup Flow
- **Artist Checkbox**: Visible, accessible checkbox to enable artist-specific fields
- **Artist-only Fields** (shown when checkbox is checked):
  - Artist Name (with availability checking)
  - Region (select with common options + custom)
  - Primary Genre
  - Public Profile URL
  - Required Music Platform Link (validated against allowed domains)
  - Social Links (up to 5, with add/remove functionality)

#### Validation
- Client-side validation for all fields
- Real-time availability checking for email and artist name (debounced 400ms)
- URL validation for profile and platform links
- Music platform domain restrictions (SoundCloud, Spotify, Bandcamp, Mixcloud, Beatport, YouTube, Instagram)
- Password requirements: min 10 characters with number or special character
- Artist name validation: min 2 characters, no emoji-only names

#### Accessibility
- Full keyboard navigation support
- ARIA labels and descriptions for all fields
- Focus trap within modal
- Screen reader announcements for validation errors
- ESC to close modal
- WCAG AA contrast compliance

#### User Experience
- Inline field-level error messages
- Loading states during submission
- Success/error toast notifications
- Verification queue notification for artists
- Responsive design (mobile-first)

### Usage

```tsx
import SignupModal from '@/src/components/Auth/SignupModal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <SignupModal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
    />
  );
}
```

### API Integration

The component integrates with the following backend endpoints:

#### POST /api/auth/signup
Request payload:
```json
{
  "display_name": "Alex Rivera",
  "bio": "Optional bio text",
  "email": "alex@example.com",
  "password": "SecurePass123!",
  "is_artist": true,
  "artist_name": "DJ Phoenix",
  "region": "berlin-eu",
  "primary_genre": "Techno, House",
  "public_profile_url": "https://soundcloud.com/djphoenix",
  "music_platform_link": "https://soundcloud.com/djphoenix/tracks",
  "social_links": [
    "https://instagram.com/djphoenix",
    "https://twitter.com/djphoenix"
  ]
}
```

Response (success):
```json
{
  "ok": true,
  "userId": "uuid",
  "jobId": "uuid", // If artist signup
  "message": "Account created successfully"
}
```

Response (validation error):
```json
{
  "ok": false,
  "error": "Validation failed",
  "fieldErrors": [
    { "field": "artistName", "message": "Artist name is not available" }
  ]
}
```

#### POST /api/auth/check-availability
Request:
```json
{
  "type": "email" | "artist",
  "value": "test@example.com"
}
```

Response:
```json
{
  "available": true,
  "reason": "Email already registered" // If not available
}
```

### Allowed Music Platforms

- soundcloud.com
- bandcamp.com
- spotify.com
- mixcloud.com
- beatport.com
- youtube.com
- instagram.com

### Constants

```typescript
const PASSWORD_MIN_LENGTH = 10;
const MAX_SOCIAL_LINKS = 5;

const REGIONS = [
  { value: "berlin-eu", label: "Berlin, EU" },
  { value: "london-uk", label: "London, UK" },
  // ... more regions
  { value: "other", label: "Other" }
];
```

### Testing

#### Unit Tests
```bash
pnpm test apps/web/tests/unit/signup-modal-artist.test.tsx
```

Tests cover:
- Artist checkbox visibility and toggle
- Field requirement validation
- Artist name validation (min length, no emoji-only)
- Social links management (add up to 5, remove)
- Music platform URL validation
- Keyboard accessibility
- Region selection and custom input

#### E2E Tests
```bash
pnpm test:e2e apps/web/tests/e2e/signup-artist-flow.spec.ts
```

Tests cover:
- Complete signup flow
- Social links management
- URL validation
- Keyboard navigation
- Accessibility attributes
- Error states

### Feature Flags

To disable artist signup functionality:
```typescript
const ENABLE_ARTIST_SIGNUP = process.env.NEXT_PUBLIC_ENABLE_ARTIST_SIGNUP !== 'false';
```

### Analytics Events

The component logs the following events (integrate with your analytics):
- `signup_artist_checked`: When artist checkbox is checked
- `signup_artist_fields_filled`: When all artist fields are filled
- `signup_artist_submitted`: When artist signup is submitted
- `signup_artist_verification_queued`: When AI verification is queued

### Localization

All user-facing text is defined in component constants and can be extracted for i18n:
```typescript
const COPY = {
  artistCheckboxLabel: "Sign up as Artist / DJ",
  artistNamePlaceholder: "e.g. Dotslash, Brutal Frequencies, or DJ Alias",
  // ... more copy
};
```

### Styling

The component uses Tailwind CSS with the following color scheme:
- Background: `#0a0a0a` / `#000000`
- Border: `#2a2a2a`
- Accent: `#D7FF3C` (lime)
- Text: `white` / `gray-400`

### Best Practices

1. **Validation**: Always validate on both client and server
2. **Debouncing**: Availability checks are debounced to reduce API calls
3. **Accessibility**: All interactive elements have proper ARIA labels
4. **Error Handling**: Show inline errors for better UX
5. **Loading States**: Disable submit button during API calls
6. **Focus Management**: Auto-focus first error field on validation failure

### Known Limitations

- Social links are validated for URL format only, not content
- Artist name availability check doesn't prevent race conditions (server-side check is authoritative)
- Custom region input has no auto-suggest (future enhancement)

### Contributing

When modifying this component:
1. Update unit tests for any behavior changes
2. Update E2E tests for flow changes
3. Update this README for API or feature changes
4. Ensure accessibility with screen reader testing
5. Test on mobile devices

### Rollout Checklist

Before deploying artist signup:
- [ ] Backend `/api/auth/signup` endpoint supports artist fields
- [ ] Backend `/api/auth/check-availability` endpoint is live
- [ ] Database schema includes artist profile fields
- [ ] AI verification worker is running
- [ ] Feature flag is enabled
- [ ] Analytics events are configured
- [ ] Sentry error tracking is configured
- [ ] Tests are passing (unit + E2E)
- [ ] Accessibility audit completed
- [ ] Mobile testing completed

### Support

For issues or questions:
- Create an issue with the `authentication` label
- Tag @frontend-team for UI/UX issues
- Tag @backend-team for API integration issues
- Tag @a11y-team for accessibility concerns
