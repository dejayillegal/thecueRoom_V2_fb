export function generateDeterministicAvatar(seed: string) {
  const hashStr = seed || "anonymous";
  let hash = 0;
  for (let i = 0; i < hashStr.length; i++) {
    hash = ((hash << 5) - hash) + hashStr.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
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
}

export function resolveAvatar(profile: any) {
  if (!profile) return generateDeterministicAvatar("guest");
  
  const p = profile.profile || profile;
  const u = profile.user || profile;
  const metadata = p.socialLinks?.metadata || p.metadata || {};
  
  if (metadata.avatarImage) return metadata.avatarImage;
  
  if (metadata.generatedAvatarSvg) {
    const svg = metadata.generatedAvatarSvg;
    if (svg.startsWith('data:image/svg+xml')) return svg;
    const svgBase64 = typeof window !== 'undefined'
      ? window.btoa(svg)
      : Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${svgBase64}`;
  }

  const seed = u.username || u.id || p.userId || "user";
  const svg = generateDeterministicAvatar(seed);
  const svgBase64 = typeof window !== 'undefined'
    ? window.btoa(svg)
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
}

export function useAvatarResolver(profile: any) {
  return resolveAvatar(profile);
}
