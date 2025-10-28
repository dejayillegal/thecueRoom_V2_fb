
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe('Dashboard Components', () => {
  it('renders dashboard page without crashing', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Welcome to thecueRoom/i)).toBeDefined();
  });

  it('renders sidebar with navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Music')).toBeDefined();
    expect(screen.getByText('News')).toBeDefined();
  });

  it('renders header with search input', () => {
    render(<Header />);
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeDefined();
  });
});
