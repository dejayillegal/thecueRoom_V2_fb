# Fly.io Deployment Guide (Free Tier)

Fly.io provides a small free allowance for apps.

## Setup Instructions

1. **Install Fly CLI and Login.**
2. **Initialize App**:
   ```bash
   fly launch
   ```
3. **Database**:
   Use an external Supabase/Neon database to keep within the 3-node free allowance.
4. **Environment Variables**:
   ```bash
   fly secrets set DATABASE_URL=... NEXT_PUBLIC_SUPABASE_URL=...
   ```
5. **Deploy**:
   ```bash
   fly deploy
   ```

## Common Failures
- **Region Availability**: Some regions might not have free tier availability.
- **Scaling**: Ensure you are using `shared-cpu-1x` and `256MB` RAM to stay free.
