# Vercel Deployment Guide (Free Tier)

Deploy the frontend to Vercel for free.

## Setup Instructions

1. **Push code to GitHub/GitLab/Bitbucket.**
2. **Import project into Vercel.**
3. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
4. **Environment Variables**:
   Add all variables from `.env.example`.
5. **Database**: Use Supabase or Neon (Free Tiers).

## Cron Jobs
Vercel's built-in cron requires a Pro plan for frequent runs. Use [cron-job.org](https://cron-job.org) (Free) to ping `/api/cron/ingest` hourly.

## Common Failures
- **Build Errors**: Ensure `pnpm-workspace.yaml` is recognized at the root.
- **Environment Variables**: Ensure `NEXT_PUBLIC_` prefix is present for client-side variables.
