import type { AIAdapter } from './types';
import { OpenAIAdapter } from './openai-adapter';
import { LocalFallbackAdapter } from './local-fallback-adapter';

export function getAdapter(): AIAdapter {
  const openai = new OpenAIAdapter();
  if (openai.isAvailable()) {
    console.log('Using OpenAI adapter');
    return openai;
  }

  console.log('Using local fallback adapter');
  return new LocalFallbackAdapter();
}
