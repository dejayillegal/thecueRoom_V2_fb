import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome back!</h2>
          <p className="text-muted-foreground mb-2">Email: {user.email}</p>
          <p className="text-muted-foreground mb-2">Role: {user.role}</p>
          <p className="text-muted-foreground">User ID: {user.uid}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">News Feeds</h3>
            <p className="text-3xl font-bold text-primary">Active</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <p className="text-3xl font-bold text-green-500">Online</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Access Level</h3>
            <p className="text-3xl font-bold text-purple-500">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}