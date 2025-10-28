
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to thecueRoom! You've successfully signed in.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Cover Art</h3>
            <p className="text-sm text-muted-foreground">
              Generate AI-powered cover art for your music
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Memes</h3>
            <p className="text-sm text-muted-foreground">
              Create and share music memes with the community
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">News</h3>
            <p className="text-sm text-muted-foreground">
              Stay updated with the latest music industry news
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Gigs</h3>
            <p className="text-sm text-muted-foreground">
              Find and book gigs in your area
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
