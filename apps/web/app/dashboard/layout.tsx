
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | thecueRoom',
  description: 'Your thecueRoom dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
