
'use client';

import { ReactNode } from 'react';
import DashboardPage from '../dashboard/page';

export default function AICoverArtLayout({ children }: { children: ReactNode }) {
  return <DashboardPage>{children}</DashboardPage>;
}
