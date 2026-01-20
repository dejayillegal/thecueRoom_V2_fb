
import { createSupabaseProvider } from './supabase';
import { createNeonProvider } from './neon';

export function getProvider(provider: 'supabase' | 'neon', connectionString: string) {
  if (provider === 'neon') {
    return createNeonProvider(connectionString);
  }
  return createSupabaseProvider(connectionString);
}
