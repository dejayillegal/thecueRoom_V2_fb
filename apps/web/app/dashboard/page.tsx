1:import { Sidebar } from '@/components/dashboard/Sidebar';
2:import { Header } from '@/components/dashboard/Header';
3:import { DashboardContent } from './dashboard-content';
4:
5:export const metadata = {
6:  title: 'Dashboard | thecueRoom',
7:  description: 'Your thecueRoom dashboard',
8:};
9:
10:export default function DashboardPage() {
11:  // In production, this would come from session/auth
12:  const user = {
13:    name: 'Artist',
14:    email: 'artist@example.com',
15:    image: null,
16:  };
17:
18:  return (
19:    <div className="grain-overlay">
20:      <Sidebar />
21:      <Header user={user} />
22:      <DashboardContent user={user} />
23:    </div>
24:  );
25:}