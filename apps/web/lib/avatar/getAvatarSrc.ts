export interface Profile {
  avatarUrl?: string;
  avatarType?: string;
  avatarSeed?: string;
  username?: string;
  id?: string;
  socialLinks?: {
    metadata?: {
      avatarImage?: string;
      generatedAvatarSvg?: string;
    };
  };
}

export const getAvatarSrc = (profile: any): string => {
  if (!profile) return '';

  // Handle both flat and nested profile structures
  const p = profile.profile || profile;
  const u = profile.user || profile;

  // 1. Uploaded/Custom image priority
  if (p.avatarType === 'custom' && p.avatarUrl) {
    return p.avatarUrl;
  }
  
  if (p.socialLinks?.metadata?.avatarImage) {
    return p.socialLinks.metadata.avatarImage;
  }

  // 2. Generated SVG priority
  if (p.socialLinks?.metadata?.generatedAvatarSvg) {
    const svgBase64 = typeof window !== 'undefined'
      ? window.btoa(p.socialLinks.metadata.generatedAvatarSvg)
      : Buffer.from(p.socialLinks.metadata.generatedAvatarSvg).toString('base64');
    return `data:image/svg+xml;base64,${svgBase64}`;
  }

  // 3. Deterministic fallback seeded by username/id
  const seed = p.avatarSeed || u.username || u.id || 'anonymous';
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const hash = getHash(seed);
  const hue = hash % 360;
  const rotation = (hash % 8) * 45;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#0B0B0B"/>
    <g transform="translate(50 50) rotate(${rotation})">
      <circle cx="0" cy="0" r="30" fill="none" stroke="hsla(${hue}, 80%, 60%, 0.8)" stroke-width="2">
        <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="0" cy="0" r="20" fill="none" stroke="hsla(${hue}, 80%, 60%, 0.5)" stroke-width="1" stroke-dasharray="4 2" />
      <path d="M-15 -15 L15 15 M-15 15 L15 -15" stroke="hsla(${hue}, 80%, 60%, 0.9)" stroke-width="1.5" />
    </g>
  </svg>`;

  const svgBase64 = typeof window !== 'undefined'
    ? window.btoa(svg)
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
};
