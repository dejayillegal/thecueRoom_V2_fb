
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { DashboardContent } from './dashboard-content';

export const metadata = {
  title: 'Dashboard | thecueRoom',
  description: 'Your thecueRoom dashboard',
};

export default function DashboardPage() {
  // In production, this would come from session/auth
  const user = {
    name: 'Artist',
    email: 'artist@example.com',
    image: null,
  };

  return (
    <div className="grain-overlay">
      <Sidebar />
      <Header user={user} />
      <DashboardContent user={user} />
    </div>
  );
}
