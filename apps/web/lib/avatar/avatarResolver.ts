export function generateDeterministicAvatar(seed: string) {
  const colors = ["#D7FF3C", "#873BBF", "#FF3D7F", "#3DFFCB"];
  let hash = 0;
  const s = seed || "default";
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  
  return `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#0B0B0B"/>
    <rect x="20" y="20" width="60" height="60" stroke="${color}" stroke-width="4" fill="${color}" fill-opacity="0.1"/>
    <rect x="35" y="35" width="30" height="30" fill="${color}" fill-opacity="0.8"/>
    <path d="M10 50 L90 50 M50 10 L50 90" stroke="${color}" stroke-width="2" opacity="0.5"/>
    <circle cx="50" cy="50" r="5" fill="#fff" opacity="0.9"/>
  </svg>`;
}

export function resolveAvatar(profile: any) {
  if (!profile) return generateDeterministicAvatar("guest");
  
  const metadata = profile.socialLinks?.metadata || {};
  return (
    metadata.avatarImage ||
    metadata.generatedAvatarSvg ||
    generateDeterministicAvatar(profile.userId || profile.id || "user")
  );
}
