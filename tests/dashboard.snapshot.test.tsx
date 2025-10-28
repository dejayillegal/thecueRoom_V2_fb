
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../src/app/dashboard/page';

// Mock the auth hook
vi.mock('../src/firebase/auth/use-user', () => ({
  useUser: () => ({
    user: {
      email: 'test@example.com',
      photoURL: null,
    },
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock AuthRedirector
vi.mock('../src/components/AuthRedirector', () => ({
  default: () => null,
}));

describe('DashboardPage', () => {
  it('renders all key dashboard elements', () => {
    render(<DashboardPage />);
    
    // Check for logo
    expect(screen.getByText('thecueRoom')).toBeInTheDocument();
    
    // Check for search input
    expect(screen.getByPlaceholderText('Search artists, gigs, news...')).toBeInTheDocument();
    
    // Check for Verification Pending section
    expect(screen.getByText('Verification Pending')).toBeInTheDocument();
    expect(screen.getByText("Your account is under review. You'll be notified once approved.")).toBeInTheDocument();
    
    // Check for Gig Radar cards
    const gigRadarHeaders = screen.getAllByText('Gig Radar');
    expect(gigRadarHeaders.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Industrial Night')).toBeInTheDocument();
    expect(screen.getByText('Deep House Pop-up')).toBeInTheDocument();
    
    // Check for Spotlight card
    expect(screen.getByText('Spotlight')).toBeInTheDocument();
    expect(screen.getByText('🎵 Trending Artist')).toBeInTheDocument();
    
    // Check for Recent Activity
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Ava Martinez')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    
    // Check for Curators section
    expect(screen.getByText('Curators')).toBeInTheDocument();
    
    // Check for Private beta footer
    expect(screen.getByText('Private beta')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<DashboardPage />);
    expect(container).toMatchSnapshot();
  });
});
