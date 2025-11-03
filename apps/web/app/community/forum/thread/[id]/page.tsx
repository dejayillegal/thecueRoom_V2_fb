
import { ThreadView } from '@/components/forum/ThreadView';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ThreadView threadId={id} />;
}
