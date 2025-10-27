
'use client';

import { ReactNode } from 'react';
import DashboardPage from '../dashboard/page';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <DashboardPage>{children}</DashboardPage>;
}
