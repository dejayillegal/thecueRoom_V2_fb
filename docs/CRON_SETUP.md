
# Feed Ingestion Cron Setup

This document explains how to set up automatic feed ingestion for thecueRoom.

## Overview

The application supports two methods for automatic feed ingestion:

1. **Replit Scheduled Deployment** (Recommended)
2. **External Cron Service** (e.g., cron-job.org)

## Option 1: Replit Scheduled Deployment (Recommended)

### Setup Steps

1. Open your Repl workspace
2. Click on **Deployments** in the sidebar (or press **+** and search for "Deployments")
3. Select **Create Scheduled Deployment**
4. Configure the deployment:
   - **Name**: Feed Ingestion
   - **Schedule**: "Every hour" (or use cron expression `0 * * * *`)
   - **Timezone**: Select your timezone
   - **Run command**: `npx tsx scripts/ingest-feeds.ts`
5. Click **Deploy**

### Benefits
- Native integration with Replit
- $25/month in credits included with Replit Core
- Simple setup and management
- Built-in logging and monitoring

## Option 2: External Cron Service

### Setup Steps

1. **Set Environment Variable**
   - Go to Replit Secrets (Tools → Secrets)
   - Add: `CRON_SECRET` = `your-secure-random-string`

2. **Configure External Service**
   - Sign up for cron-job.org (or similar)
   - Create a new cron job:
     - **URL**: `https://your-repl-name.replit.app/api/cron/ingest`
     - **Schedule**: `0 * * * *` (every hour)
     - **HTTP Headers**: Add `Authorization: Bearer YOUR_CRON_SECRET`
     - **Method**: GET

### Benefits
- Works independently of Replit
- Can use different scheduling granularity
- Multiple backup cron services possible

## Admin Configuration Panel

Access the admin panel at `/admin/cron` to:
- View current ingestion status
- Trigger manual feed ingestion
- Configure ingestion interval
- Enable/disable automatic ingestion

### Authentication

To secure the admin panel, set the `ADMIN_SECRET` environment variable and include it in your requests:

```bash
Authorization: Bearer YOUR_ADMIN_SECRET
```

## API Endpoints

### GET `/api/cron/ingest`
Triggers feed ingestion

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "message": "Feed ingestion completed",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "duration": 15234
}
```

### POST `/api/cron/ingest`
Get ingestion status

**Response:**
```json
{
  "isRunning": false,
  "lastRun": "2025-01-27T12:00:00.000Z",
  "status": "idle"
}
```

### GET `/api/admin/cron-config`
Get current configuration

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_SECRET
```

### POST `/api/admin/cron-config`
Update configuration

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_SECRET
Content-Type: application/json
```

**Body:**
```json
{
  "enabled": true,
  "interval": 60
}
```

## Monitoring

- Check Replit logs for ingestion results
- Use the admin panel to view last run time
- Monitor the `/api/cron/ingest` endpoint for status

## Troubleshooting

### Ingestion fails
- Check DATABASE_URL is set correctly
- Verify RSS feeds are accessible
- Check logs for specific error messages

### Unauthorized errors
- Verify CRON_SECRET matches in both Replit and external service
- Check ADMIN_SECRET for admin panel access

### Concurrent runs
- The system prevents concurrent ingestion runs
- Wait for current run to complete before triggering again

## Best Practices

1. **Use Replit Scheduled Deployment** for simplicity
2. **Set strong secrets** for CRON_SECRET and ADMIN_SECRET
3. **Monitor regularly** to ensure feeds are updating
4. **Start with hourly** ingestion, adjust based on needs
5. **Use admin panel** for manual triggers during testing
