
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoverArtStudio } from '../../apps/web/src/components/AI/CoverArtStudio';

// Mock fetch
global.fetch = vi.fn();

describe('CoverArtStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the cover art studio interface', () => {
    render(<CoverArtStudio />);
    
    expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/generate/i)).toBeInTheDocument();
    expect(screen.getByText(/style preset/i)).toBeInTheDocument();
  });

  it('disables generate button when prompt is empty', () => {
    render(<CoverArtStudio />);
    
    const generateButton = screen.getByText(/generate/i);
    expect(generateButton).toBeDisabled();
  });

  it('enables generate button when prompt is filled', async () => {
    render(<CoverArtStudio />);
    
    const promptInput = screen.getByLabelText(/prompt/i);
    fireEvent.change(promptInput, { target: { value: 'A cool techno cover' } });
    
    const generateButton = screen.getByText(/generate/i);
    expect(generateButton).not.toBeDisabled();
  });

  it('handles AI generation flow', async () => {
    const mockJobId = 'test-job-123';
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: mockJobId, status: 'queued' }),
    });

    render(<CoverArtStudio />);
    
    const promptInput = screen.getByLabelText(/prompt/i);
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });
    
    const generateButton = screen.getByText(/generate/i);
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/generate',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test prompt'),
        })
      );
    });
  });
});
