export function getArtistProfileHref(usernameOrId: string) {
  if (!usernameOrId) return '#';
  return `/artist/${usernameOrId}`;
}
