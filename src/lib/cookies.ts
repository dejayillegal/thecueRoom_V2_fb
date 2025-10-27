
// src/lib/cookies.ts
export function serializeCookie(name: string, value: string, opts: { maxAge?: number; path?: string; httpOnly?: boolean; secure?: boolean; sameSite?: 'lax'|'strict'|'none' } = {}) {
  const pairs: string[] = [];
  pairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  if (opts.maxAge != null) pairs.push(`Max-Age=${opts.maxAge}`);
  pairs.push(`Path=${opts.path ?? '/'}`);
  if (opts.httpOnly) pairs.push('HttpOnly');
  if (opts.secure) pairs.push('Secure');
  if (opts.sameSite) pairs.push(`SameSite=${opts.sameSite}`);
  return pairs.join('; ');
}
