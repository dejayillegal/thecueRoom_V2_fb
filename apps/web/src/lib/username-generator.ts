
const CREATIVE_SUFFIXES = ['sub', 'grid', 'void', 'flux', 'edge', 'freq', 'rave', 'wave', 'core', 'drop', 'sync', 'beat'];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
    .substring(0, 20); // Limit base length
}

function generateRandomSuffix(): string {
  const suffix = CREATIVE_SUFFIXES[Math.floor(Math.random() * CREATIVE_SUFFIXES.length)];
  const randomChars = Math.random().toString(36).substring(2, 4);
  return `.${suffix}${randomChars}`;
}

export function generateUsername(artistName: string): string {
  const normalized = normalize(artistName);

  if (!normalized) {
    return `user${Math.random().toString(36).substring(2, 8)}`;
  }

  // Always add a suffix to reduce initial collisions
  return normalized + generateRandomSuffix();
}
