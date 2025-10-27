
# External Cron Service Setup (Free)

This guide shows you how to set up automatic feed ingestion using free external cron services instead of Replit's Scheduled Deployment.

## Recommended Free Services

1. **cron-job.org** (Recommended)
   - ✅ Free forever
   - ✅ Up to 50 cron jobs
   - ✅ Minimum interval: 1 minute
   - ✅ Custom headers support
   - ✅ Detailed execution logs

2. **EasyCron.com**
   - ✅ Free tier available
   - ✅ 20 cron jobs
   - ✅ Minimum interval: 1 hour

3. **cPanel/Custom Server**
   - If you have access to any server with cPanel

## Setup Instructions

### Step 1: Set Environment Variable

1. Go to Replit Secrets (Tools → Secrets)
2. Add a new secret:
   - **Key**: `CRON_SECRET`
   - **Value**: Generate a strong random string (e.g., use a password generator)

Example:
```
CRON_SECRET=your-super-secret-random-string-here-min-32-chars
```

### Step 2: Configure cron-job.org (Recommended)

1. **Sign up**: Go to https://cron-job.org/en/signup/
   - Free account, no credit card required

2. **Create new cron job**:
   - Click "Create cronjob" in dashboard
   - **Title**: `thecueRoom Feed Ingestion`
   - **URL**: `https://[your-repl-name].[your-username].repl.co/api/cron/ingest`
   - **Schedule**: Choose one of:
     - Every hour: `0 * * * *`
     - Every 30 minutes: `*/30 * * * *`
     - Every 2 hours: `0 */2 * * *`

3. **Add Authentication Header**:
   - Click "Request headers" section
   - Add header:
     - **Name**: `Authorization`
     - **Value**: `Bearer your-super-secret-random-string-here-min-32-chars`
   - Replace with your actual CRON_SECRET value

4. **Configure Settings**:
   - **Timeout**: 300 seconds (5 minutes)
   - **Notification**: Enable email on failure (optional)
   - **Execution time zone**: Select your timezone

5. **Save and Enable**

### Step 3: Test Your Setup

1. Click "Run now" in cron-job.org dashboard
2. Check execution logs
3. Verify feeds are being ingested in your database

### Alternative: EasyCron Setup

1. Sign up at https://www.easycron.com/
2. Create new cron job:
   - **URL**: `https://[your-repl-name].[your-username].repl.co/api/cron/ingest`
   - **Cron Expression**: `0 * * * *` (every hour)
   - **HTTP Method**: GET
   - **HTTP Headers**: Add `Authorization: Bearer YOUR_CRON_SECRET`
3. Enable and test

## Monitoring

### Check Ingestion Status

Visit your admin panel at:
```
https://[your-repl-name].[your-username].repl.co/admin/cron
```

### View Logs

1. In cron-job.org dashboard, click on your job
2. View "Execution log" tab
3. Check for successful responses (200 status)

### Manual Trigger

To manually trigger ingestion:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://[your-repl-name].[your-username].repl.co/api/cron/ingest
```

## Troubleshooting

### "Unauthorized" Error
- Verify CRON_SECRET matches in both Replit Secrets and cron service
- Check Authorization header format: `Bearer YOUR_SECRET`

### Timeout Errors
- Increase timeout in cron service settings to 300 seconds
- Some feeds may take longer to fetch

### No New Feeds
- Check that sources are enabled in database
- Verify RSS feeds are accessible
- Review execution logs for specific errors

## Best Practices

1. **Start with hourly**: Run every hour initially
2. **Monitor for a week**: Check logs regularly
3. **Adjust frequency**: Based on your needs and feed update frequency
4. **Set up alerts**: Enable email notifications for failures
5. **Keep CRON_SECRET secure**: Never commit it to version control

## Cost Comparison

| Service | Cost | Jobs | Interval |
|---------|------|------|----------|
| cron-job.org | Free | 50 | 1 min |
| EasyCron | Free | 20 | 1 hour |
| Replit Scheduled | $25/mo* | Unlimited | 1 min |

*$25 credits included with Replit Core membership

## Support

If you encounter issues:
1. Check Replit console logs
2. Review cron service execution logs
3. Test endpoint manually with curl
4. Verify DATABASE_URL is set correctly
