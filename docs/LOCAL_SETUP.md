# Local Setup Guide

Follow these steps to run thecueRoom V2 on your local machine.

## Prerequisites
- Node.js 18+
- pnpm 8+
- A Supabase account (Free Tier)

## Step-by-Step Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd thecueroom-v2
   ```

2. **Set up Environment Variables**
   Copy `.env.example` to `.env` and fill in your Supabase credentials.
   ```bash
   cp .env.example .env
   ```
   Required fields:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Install Dependencies**
   ```bash
   pnpm install
   ```

4. **Initialize Database**
   ```bash
   pnpm setup
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

## Common Failures
- **Database Connection Error**: Ensure your IP is whitelisted in Supabase settings or use `DATABASE_URL` with transaction mode disabled if using a pooler.
- **Node Version**: Ensure `node -v` returns 18 or higher.
