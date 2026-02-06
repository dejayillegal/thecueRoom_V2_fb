import ArtistSocialProfile from '@/components/artist/ArtistSocialProfile';

export default function ArtistProfilePage({
  params,
}: {
  params: { username: string };
}) {
  return <ArtistSocialProfile username={params.username} />;
}
