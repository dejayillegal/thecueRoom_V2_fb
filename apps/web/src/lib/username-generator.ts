
// Underground music culture-inspired username suffixes
const UNDERGROUND_SUFFIXES = [
  // Classic underground/club culture
  'mastercue', 'vinylhead', 'crate.digger', 'selector', 'basshead',
  'digger', 'soundboy', 'dubplate', 'riddim', 'steppa',
  
  // Genre-specific
  'dnb', 'dubstep', 'techno', 'breaks', 'jungle',
  'garage', 'grime', 'bassline', 'footwork', 'juke',
  
  // Studio/production vibes
  'beatsmith', 'producer', 'sampler', 'mixer', 'sequencer',
  'analog', 'modular', 'synth.head', 'drum.machine', 'looper',
  
  // Underground scene
  'raver', 'warehouse', 'afterhours', 'underground', 'basement',
  'latenight', 'deepcuts', 'rarities', 'vault', 'archive',
  
  // DJ culture
  'spinz', 'decks', 'turntables', 'crossfader', 'backspin',
  'blend', 'scratch', 'cutup', 'juggler', 'mashup',
  
  // Modern underground
  'lofi', 'chillwave', 'vaporwave', 'beat.tape', 'bedroom',
  'soundcloud', 'bandcamp', 'lowkey', 'indie', 'diy',
  
  // Classic electronic
  'rave', 'wave', 'core', 'drop', 'sync', 'beat',
  'sub', 'grid', 'void', 'flux', 'edge', 'freq'
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
    .substring(0, 20); // Limit base length
}

function generateRandomSuffix(): string {
  const suffix = UNDERGROUND_SUFFIXES[Math.floor(Math.random() * UNDERGROUND_SUFFIXES.length)];
  const randomNum = Math.floor(Math.random() * 99);
  
  // Mix up the format for variety
  const formats = [
    `.${suffix}`,           // artist.mastercue
    `.${suffix}${randomNum}`,  // artist.vinylhead42
    `_${suffix}`,           // artist_selector
    `${randomNum}.${suffix}` // artist88.digger
  ];
  
  return formats[Math.floor(Math.random() * formats.length)];
}

export function generateUsername(artistName: string): string {
  const normalized = normalize(artistName);

  if (!normalized) {
    return `underground${Math.random().toString(36).substring(2, 8)}`;
  }

  // Always add a suffix to reduce initial collisions
  return normalized + generateRandomSuffix();
}
