export interface Profile {
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

  // 1. Uploaded image priority (metadata.avatarImage is the source of truth for uploads)
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

  // 3. Deterministic fallback (Droid)
  const seed = u.username || u.id || 'anonymous';
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
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.15 0"/>
      </filter>
    </defs>
    <rect width="100" height="100" fill="#0B0B0B"/>
    <rect width="100" height="100" filter="url(#noise)" opacity="0.5"/>
    <path d="M25 40 L75 40 L85 60 L75 85 L25 85 L15 60 Z" fill="#111" stroke="hsla(${hue}, 80%, 60%, 0.6)" stroke-width="2"/>
    <circle cx="35" cy="60" r="6" fill="#050505" stroke="hsla(${hue}, 80%, 60%, 0.9)" stroke-width="2">
      <animate attributeName="stroke-opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
    </circle>
    <rect x="55" y="58" width="12" height="4" fill="#050505" stroke="hsla(${hue}, 80%, 60%, 0.7)" stroke-width="1.5"/>
    <path d="M20 65 L15 60 L20 55" fill="none" stroke="hsla(${hue}, 100%, 70%, 1)" stroke-width="2"/>
    <rect width="100" height="2" fill="hsla(${hue}, 100%, 70%, 0.1)">
      <animate attributeName="y" from="-2" to="100" dur="4s" repeatCount="indefinite" />
    </rect>
  </svg>`;

  const svgBase64 = typeof window !== 'undefined'
    ? window.btoa(svg)
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
};
