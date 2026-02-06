import { PublicProfile } from '@/components/Profile/PublicProfile';

export default async function ArtistProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await props.params;
  return <PublicProfile username={username} />;
}
