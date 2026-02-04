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

  // 1. Uploaded/Custom image priority (metadata.avatarImage is the source of truth for uploads)
  if (p.socialLinks?.metadata?.avatarImage) {
    return p.socialLinks.metadata.avatarImage;
  }
  
  if (p.avatarType === 'custom' && p.avatarUrl) {
    return p.avatarUrl;
  }

  // 2. Generated SVG priority
  if (p.socialLinks?.metadata?.generatedAvatarSvg) {
    const svgBase64 = typeof window !== 'undefined'
      ? window.btoa(p.socialLinks.metadata.generatedAvatarSvg)
      : Buffer.from(p.socialLinks.metadata.generatedAvatarSvg).toString('base64');
    return `data:image/svg+xml;base64,${svgBase64}`;
  }

  // 3. Deterministic fallback seeded by username/id (The "Droid" SVG)
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
  
  // Advanced Droid SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.15 0"/>
      </filter>
    </defs>
    <rect width="100" height="100" fill="#0B0B0B"/>
    <rect width="100" height="100" filter="url(#noise)" opacity="0.5"/>
    
    <!-- Segmented Geometry Body -->
    <path d="M25 40 L75 40 L85 60 L75 85 L25 85 L15 60 Z" fill="#111" stroke="hsla(${hue}, 80%, 60%, 0.3)" stroke-width="0.5"/>
    
    <!-- Layered Plates -->
    <path d="M30 45 L70 45 L75 55 L25 55 Z" fill="#1a1a1a" stroke="hsla(${hue}, 80%, 60%, 0.2)" stroke-width="0.5"/>
    
    <!-- Asymmetric Eyes/Sensors -->
    <circle cx="35" cy="60" r="6" fill="#050505" stroke="hsla(${hue}, 80%, 60%, 0.8)" stroke-width="1.5">
      <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
    </circle>
    <rect x="55" y="58" width="12" height="4" fill="#050505" stroke="hsla(${hue}, 80%, 60%, 0.6)" stroke-width="1">
       <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
    </rect>
    
    <!-- Neon Accent Strokes -->
    <path d="M20 65 L15 60 L20 55" fill="none" stroke="hsla(${hue}, 100%, 70%, 0.8)" stroke-width="1"/>
    <path d="M80 55 L85 60 L80 65" fill="none" stroke="hsla(${hue}, 100%, 70%, 0.8)" stroke-width="1"/>
    
    <!-- Scanline Drift (Subtle) -->
    <rect width="100" height="2" fill="hsla(${hue}, 100%, 70%, 0.05)">
      <animate attributeName="y" from="-2" to="100" dur="4s" repeatCount="indefinite" />
    </rect>
  </svg>`;

  const svgBase64 = typeof window !== 'undefined'
    ? window.btoa(svg)
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
};
