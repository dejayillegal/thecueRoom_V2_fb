import { generateDeterministicAvatar } from '../artist-identity';

export interface ProfileMetadata {
  avatarImage?: string; // base64
  generatedAvatarSvg?: string;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  artistName: string;
  role: string;
  metadata: ProfileMetadata;
}

export function resolveAvatar(profile: any, userId: string): string {
  if (profile?.metadata?.avatarImage) {
    return profile.metadata.avatarImage;
  }
  
  if (profile?.metadata?.generatedAvatarSvg) {
    return profile.metadata.generatedAvatarSvg;
  }
  
  const seed = profile?.avatarSeed || userId || 'default';
  return generateDeterministicAvatar(seed);
}
