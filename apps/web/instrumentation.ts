export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Next.js server starting...');
    
    try {
      const { ensureRequiredAccounts } = await import('./lib/bootstrap/seed-accounts');
      const result = await ensureRequiredAccounts();
      console.log(`[Instrumentation] Bootstrap result: ${result.message}`);
    } catch (error) {
      console.error('[Instrumentation] Bootstrap error (non-fatal):', error);
    }
  }
}
