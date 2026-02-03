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
  const hue = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${hue}, 70%, 80%)"/><circle cx="50" cy="50" r="30" fill="hsl(${hue}, 70%, 40%)"/></svg>`;
};
