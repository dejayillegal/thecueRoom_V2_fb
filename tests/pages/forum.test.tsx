
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForumPage from '../../apps/web/src/app/community/forum/page';

global.fetch = vi.fn();

describe('ForumPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ threads: [] }),
    });
  });

  it('renders forum interface', async () => {
    render(<ForumPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/community forum/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/new thread/i)).toBeInTheDocument();
  });

  it('opens create thread dialog', async () => {
    render(<ForumPage />);
    
    const newThreadButton = await screen.findByText(/new thread/i);
    fireEvent.click(newThreadButton);
    
    await waitFor(() => {
      expect(screen.getByText(/create new thread/i)).toBeInTheDocument();
    });
  });
});
