import { PublicProfile } from '@/components/Profile/PublicProfile';

export default function ArtistProfilePage({
  params,
}: {
  params: { username: string };
}) {
  return <PublicProfile username={params.username} />;
}
