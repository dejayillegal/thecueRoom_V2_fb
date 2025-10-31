const musicPrefixes = [
  'bass', 'sub', 'deep', 'dark', 'acid', 'cyber', 'synth', 'analog', 'dub', 'echo',
  'groove', 'rhythm', 'beat', 'drum', 'kick', 'hi', 'lo', 'raw', 'dirty', 'clean',
  'wave', 'sound', 'noise', 'sonic', 'freq', 'vibe', 'crate', 'dig', 'wax', 'vinyl',
  'underground', 'warehouse', 'rave', 'club', 'floor', 'booth', 'deck', 'mix', 'spin', 'scratch'
];

const musicSuffixes = [
  'selector', 'digger', 'hunter', 'seeker', 'pusher', 'junkie', 'addict', 'fiend',
  'head', 'lover', 'freak', 'wizard', 'master', 'ninja', 'guru', 'sage', 'prophet',
  'phantom', 'ghost', 'shadow', 'spirit', 'soul', 'entity', 'force', 'power',
  'shaman', 'alchemist', 'architect', 'builder', 'creator', 'maker', 'producer',
  'engineer', 'technician', 'operator', 'controller', 'commander', 'pilot', 'navigator',
  'voyager', 'traveler', 'explorer', 'wanderer', 'nomad', 'mystic', 'oracle'
];

const genres = [
  'techno', 'house', 'minimal', 'dub', 'ambient', 'industrial', 'hardcore',
  'jungle', 'dnb', 'breaks', 'garage', 'grime', 'dubstep', 'trap', 'bass',
  'electro', 'disco', 'funk', 'soul', 'jazz', 'hip', 'hop', 'idm', 'experimental'
];

const numbers = ['101', '202', '303', '404', '505', '606', '707', '808', '909'];

export function generateMusicUsername(): string {
  const patterns = [
    () => {
      const prefix = musicPrefixes[Math.floor(Math.random() * musicPrefixes.length)];
      const suffix = musicSuffixes[Math.floor(Math.random() * musicSuffixes.length)];
      return `${prefix}${suffix}`;
    },
    () => {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const suffix = musicSuffixes[Math.floor(Math.random() * musicSuffixes.length)];
      return `${genre}${suffix}`;
    },
    () => {
      const prefix = musicPrefixes[Math.floor(Math.random() * musicPrefixes.length)];
      const number = numbers[Math.floor(Math.random() * numbers.length)];
      return `${prefix}${number}`;
    },
    () => {
      const prefix = musicPrefixes[Math.floor(Math.random() * musicPrefixes.length)];
      const genre = genres[Math.floor(Math.random() * genres.length)];
      return `${prefix}${genre}`;
    },
    () => {
      const genre1 = genres[Math.floor(Math.random() * genres.length)];
      const genre2 = genres[Math.floor(Math.random() * genres.length)];
      if (genre1 === genre2) {
        return `${genre1}${musicSuffixes[Math.floor(Math.random() * musicSuffixes.length)]}`;
      }
      return `${genre1}${genre2}`;
    }
  ];

  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  let username = pattern();

  if (Math.random() > 0.7) {
    username += Math.floor(Math.random() * 100);
  }

  return username;
}

export function generateUniqueUsernames(count: number = 3): string[] {
  const usernames = new Set<string>();
  
  while (usernames.size < count) {
    usernames.add(generateMusicUsername());
  }
  
  return Array.from(usernames);
}
