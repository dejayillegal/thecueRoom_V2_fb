# Railway Deployment Guide (Free Tier)

Railway offers a trial/free tier suitable for full-stack apps.

## Setup Instructions

1. **Connect your GitHub repository to Railway.**
2. **Add a Database Service**:
   - Provision a PostgreSQL database within Railway or use an external Supabase/Neon URL.
3. **Configure Variables**:
   - Set `PORT=5000` (or leave default for Railway to handle).
   - Set all variables from `.env.example`.
4. **Start Command**:
   Railway should detect the monorepo. Use: `pnpm start`.

## Common Failures
- **Memory Limits**: The free tier has limited RAM. If build fails, try building locally and pushing.
- **Credits**: Monitor usage to stay within the free trial limits.
