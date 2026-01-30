import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function checkArtistAccess() {
  const session = await getSession();
  
  if (!session) {
    redirect('/');
  }
  
  if (session.role !== 'artist' && session.role !== 'admin') {
    redirect('/dashboard');
  }
  
  return session;
}
