
import { MonthlyPlaylistConfigPanel } from '@/components/Admin/MonthlyPlaylistConfigPanel';

export const metadata = {
  title: 'Monthly Playlists - Admin',
  description: 'Manage monthly curated music playlists',
};

export default function MonthlyPlaylistsAdminPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MonthlyPlaylistConfigPanel />
    </div>
  );
}
