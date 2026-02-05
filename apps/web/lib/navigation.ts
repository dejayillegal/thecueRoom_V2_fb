export function getArtistProfileHref(username: string) {
  if (!username) return '#';
  return `/artist/u/${username}`;
}
