export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Next.js server starting...');
    
    try {
      const { ensureRequiredAccounts } = await import('./lib/bootstrap/seed-accounts');
      const accountResult = await ensureRequiredAccounts();
      console.log(`[Instrumentation] Account bootstrap: ${accountResult.message}`);

      const { ensureForumContent } = await import('./lib/bootstrap/seed-forum');
      const forumResult = await ensureForumContent();
      console.log(`[Instrumentation] Forum bootstrap: ${forumResult.message}`);
    } catch (error) {
      console.error('[Instrumentation] Bootstrap error (non-fatal):', error);
    }
  }
}
