
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupModal from '@/src/components/Auth/SignupModal';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('SignupModal - Artist Checkbox and Fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Sign Up tab with Artist checkbox visible', () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    // Click Sign Up tab
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    // Artist checkbox should be visible
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    expect(artistCheckbox).toBeInTheDocument();
    expect(artistCheckbox).not.toBeChecked();
  });

  it('should toggle Artist fields when checkbox is checked', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    // Artist fields should not be visible initially
    expect(screen.queryByLabelText(/artist name/i)).not.toBeInTheDocument();
    
    // Check the Artist checkbox
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    // Artist fields should now be visible
    expect(screen.getByLabelText(/artist name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/primary genre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/public profile url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/required music platform link/i)).toBeInTheDocument();
  });

  it('should require Artist Name only when Artist checkbox is checked', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    const artistNameInput = screen.getByLabelText(/artist name/i);
    expect(artistNameInput).toHaveAttribute('required');
    expect(artistNameInput).toHaveAttribute('aria-required', 'true');
  });

  it('should validate Artist Name with min 2 characters', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    const artistNameInput = screen.getByLabelText(/artist name/i);
    await userEvent.type(artistNameInput, 'D');
    
    // Should show validation error for single character
    const submitButton = screen.getByRole('button', { name: /sign up as artist/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/artist name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('should reject emoji-only Artist Names', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    const artistNameInput = screen.getByLabelText(/artist name/i);
    await userEvent.type(artistNameInput, '🎵🎶');
    
    const submitButton = screen.getByRole('button', { name: /sign up as artist/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/artist name cannot contain only emojis/i)).toBeInTheDocument();
    });
  });

  it('should allow up to 5 social links', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    // Should start with 1 social link input
    expect(screen.getAllByPlaceholderText(/instagram.com/i)).toHaveLength(1);
    
    // Add links up to 5
    for (let i = 1; i < 5; i++) {
      const addButton = screen.getByRole('button', { name: /add link/i });
      await userEvent.click(addButton);
    }
    
    // Should now have 5 social link inputs
    expect(screen.getAllByPlaceholderText(/instagram.com/i)).toHaveLength(5);
    
    // Add button should be disabled or not present
    expect(screen.queryByRole('button', { name: /add link/i })).not.toBeInTheDocument();
  });

  it('should remove social links correctly', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    // Add 3 links
    const addButton = screen.getByRole('button', { name: /add link/i });
    await userEvent.click(addButton);
    await userEvent.click(addButton);
    
    expect(screen.getAllByPlaceholderText(/instagram.com/i)).toHaveLength(3);
    
    // Remove one link
    const removeButtons = screen.getAllByRole('button', { name: /remove social link/i });
    await userEvent.click(removeButtons[1]);
    
    expect(screen.getAllByPlaceholderText(/instagram.com/i)).toHaveLength(2);
  });

  it('should validate music platform domain restrictions', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    const musicPlatformInput = screen.getByLabelText(/required music platform link/i);
    await userEvent.type(musicPlatformInput, 'https://example.com/profile');
    
    const submitButton = screen.getByRole('button', { name: /sign up as artist/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/valid music platform link/i)).toBeInTheDocument();
    });
  });

  it('should accept valid music platform URLs', async () => {
    const validUrls = [
      'https://soundcloud.com/artist',
      'https://open.spotify.com/artist/123',
      'https://bandcamp.com/artist',
      'https://mixcloud.com/artist',
      'https://beatport.com/artist/123',
    ];

    for (const url of validUrls) {
      const { unmount } = render(<SignupModal isOpen={true} onClose={vi.fn()} />);
      
      const signupTab = screen.getByRole('tab', { name: /sign up/i });
      fireEvent.click(signupTab);
      
      const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
      await userEvent.click(artistCheckbox);
      
      const musicPlatformInput = screen.getByLabelText(/required music platform link/i);
      await userEvent.clear(musicPlatformInput);
      await userEvent.type(musicPlatformInput, url);
      
      // Should not show URL validation error for valid platform
      expect(screen.queryByText(/not a valid music platform/i)).not.toBeInTheDocument();
      
      unmount();
    }
  });

  it('should be keyboard accessible', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    // Tab to Artist checkbox
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    artistCheckbox.focus();
    expect(document.activeElement).toBe(artistCheckbox);
    
    // Press Space to check
    fireEvent.keyDown(artistCheckbox, { key: ' ', code: 'Space' });
    
    // Artist fields should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/artist name/i)).toBeInTheDocument();
    });
  });

  it('should show "Other" region input when selected', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    // Select "Other" region
    const regionSelect = screen.getByRole('combobox', { name: /region/i });
    await userEvent.click(regionSelect);
    
    const otherOption = screen.getByText(/other/i);
    await userEvent.click(otherOption);
    
    // Custom region input should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/specify region/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button when Artist fields are invalid', async () => {
    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    // Fill only some fields
    const displayNameInput = screen.getByLabelText(/display name/i);
    await userEvent.type(displayNameInput, 'Test User');
    
    const emailInput = screen.getByLabelText(/email \*/i);
    await userEvent.type(emailInput, 'test@example.com');
    
    // Submit button should be disabled due to missing artist fields
    const submitButton = screen.getByRole('button', { name: /sign up as artist/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show availability indicator for Artist Name', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(<SignupModal isOpen={true} onClose={vi.fn()} />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signupTab);
    
    const artistCheckbox = screen.getByRole('checkbox', { name: /sign up as artist/i });
    await userEvent.click(artistCheckbox);
    
    const artistNameInput = screen.getByLabelText(/artist name/i);
    await userEvent.type(artistNameInput, 'Test Artist');
    
    // Should show checking state
    await waitFor(() => {
      expect(screen.getByLabelText(/checking availability/i)).toBeInTheDocument();
    });
    
    // Should show available state
    await waitFor(() => {
      expect(screen.getByLabelText(/available/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
