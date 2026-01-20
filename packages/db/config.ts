
export const dbConfig = {
  provider: (process.env.DB_PROVIDER || 'supabase') as 'supabase' | 'neon',
  connectionString: process.env.DATABASE_URL || '',
};
