'use client';

import { memo } from 'react';
import { DashboardContent } from './dashboard-content';

// In production, this would come from session/auth
const mockUser = {
  name: 'Artist',
  email: 'artist@example.com',
  image: null,
};

export default memo(function DashboardPage() {
  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <DashboardContent user={mockUser} />
    </div>
  );
});