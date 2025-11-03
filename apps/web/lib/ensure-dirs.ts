/**
 * Ensure required directories exist on startup
 */
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

export async function ensureDirectories() {
  const dirs = [
    process.env.AI_TEMP_DIR || '/tmp/thecueroom-ai',
    process.env.VERIFY_TEMP_DIR || '/tmp/thecueroom/verify',
    './.local'
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  }
}
