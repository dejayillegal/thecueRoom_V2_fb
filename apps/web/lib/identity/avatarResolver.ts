export interface AvatarProfile {
  avatarImage?: string; // base64 uploaded image
  generatedAvatarSvg?: string; // droid svg
  username: string;
}

export const resolveAvatar = (profile: AvatarProfile): string => {
  if (profile.avatarImage) {
    return profile.avatarImage;
  }
  
  if (profile.generatedAvatarSvg) {
    const svgBase64 = typeof window !== 'undefined' 
      ? window.btoa(profile.generatedAvatarSvg)
      : Buffer.from(profile.generatedAvatarSvg).toString('base64');
    return `data:image/svg+xml;base64,${svgBase64}`;
  }
  
  // Deterministic fallback (seeded droid-like SVG)
  const seed = profile.username || 'anonymous';
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
        <animateTransform attributeName="transform" type="scale" additive="sum" values="1;1.05;1" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="0" cy="0" r="20" fill="none" stroke="hsla(${hue}, 80%, 60%, 0.5)" stroke-width="1" stroke-dasharray="4 2" />
      <path d="M-15 -15 L15 15 M-15 15 L15 -15" stroke="hsla(${hue}, 80%, 60%, 0.9)" stroke-width="1.5">
        <animate attributeName="stroke-opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite" />
      </path>
    </g>
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  </svg>`;

  const svgBase64 = typeof window !== 'undefined' 
    ? window.btoa(svg)
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
};
