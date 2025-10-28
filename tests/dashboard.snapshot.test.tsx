import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../apps/web/app/dashboard/page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('Dashboard Page', () => {
  it('renders all key dashboard elements', () => {
    render(<DashboardPage />);

    // Check for logo
    expect(screen.getByLabelText(/thecueRoom logo/i)).toBeInTheDocument();

    // Check for search input
    expect(screen.getByPlaceholderText(/Search artists, gigs, news/i)).toBeInTheDocument();

    // Check for Verification Pending header
    expect(screen.getByText(/Verification Pending/i)).toBeInTheDocument();

    // Check for Gig Radar card
    expect(screen.getByText(/Gig Radar/i)).toBeInTheDocument();

    // Check for Spotlight card
    expect(screen.getByText(/Spotlight/i)).toBeInTheDocument();

    // Check for Recent Activity items (should have at least 2)
    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex Chen/i)).toBeInTheDocument();
    expect(screen.getByText(/DJ Shadow/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<DashboardPage />);
    expect(container).toMatchSnapshot();
  });
});