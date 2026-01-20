# Database Providers

thecueRoom V2 is architected to be provider-flexible.

## Supported Providers

### 1. Supabase (Default)
- **Features**: Database, Auth, Storage, Edge Functions.
- **Connection**: standard `pg` driver via pooling or direct URL.
- **Free Tier**: Includes 500MB database and generous Auth limits.

### 2. Neon (Optional)
- **Features**: Serverless PostgreSQL, Point-in-Time Recovery.
- **Connection**: Uses `@neondatabase/serverless` (HTTP-based).
- **Free Tier**: Includes 500MB storage and autoscaling to zero.

## Configuration

To switch providers, update `DB_PROVIDER` in your `.env`:

```bash
# For Supabase
DB_PROVIDER=supabase
DATABASE_URL=postgres://...

# For Neon
DB_PROVIDER=neon
DATABASE_URL=postgres://...
```

## Hybrid Mode (Recommended)
You can use **Neon** for the database while keeping **Supabase Auth**. This is a powerful free-tier combination.
1. Deploy to Vercel.
2. Use Neon for `DATABASE_URL`.
3. Use Supabase for `NEXT_PUBLIC_SUPABASE_URL` and Auth logic.
