
import { MonthlyPlaylistConfigPanel } from '@/components/Admin/MonthlyPlaylistConfigPanel';

export const metadata = {
  title: 'Monthly Playlists - Admin',
  description: 'Manage monthly curated music playlists',
};

export default function MonthlyPlaylistsAdminPage() {
  return <MonthlyPlaylistConfigPanel />;
}
