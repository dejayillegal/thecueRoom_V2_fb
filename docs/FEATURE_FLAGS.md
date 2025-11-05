
# Feature Flags & Configuration

## Environment Variables

### Notifications System
- `ENABLE_NOTIFICATIONS` (default: true) - Enable/disable notification system
- `NOTIFICATION_POLLING_INTERVAL` (default: 30000) - Polling interval in ms

### AI Social Promo
- `ENABLE_SOCIAL_PROMO` (default: true) - Enable social promo generator
- `MAX_PROMOS_PER_USER` (default: 50) - Maximum promos per user
- `PROMO_IMAGE_SIZE` (default: 1080) - Generated image size in pixels

### Artist Verification
- `AI_VERIFICATION_ENABLED` (default: true) - Enable AI verification
- `VERIFICATION_TIMEOUT_MS` (default: 60000) - Verification timeout
- `MIN_VERIFICATION_SCORE` (default: 70) - Minimum score for auto-approval

### AI Providers
- `HF_TOKEN` - Hugging Face API token
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_API_KEY` - Google Gemini API key
- `PERPLEXITY_KEY` - Perplexity API key

## Feature Toggles

To disable a feature, set its environment variable to `false` in Replit Secrets:

```bash
ENABLE_NOTIFICATIONS=false
ENABLE_SOCIAL_PROMO=false
AI_VERIFICATION_ENABLED=false
```

## Testing Modes

Set `TEST_MODE=true` for deterministic AI responses and faster testing.
