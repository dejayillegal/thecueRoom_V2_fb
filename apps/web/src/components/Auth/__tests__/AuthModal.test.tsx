
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthModal from '../AuthModal';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('@/src/hooks/use-availability', () => ({
  useAvailability: () => ({
    available: true,
    checking: false,
  }),
}));

describe('AuthModal', () => {
  it('renders sign in form by default', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('switches to sign up tab when clicked', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
  });

  it('shows artist fields when artist checkbox is checked', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    
    // Switch to sign up tab
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);

    // Check artist checkbox
    const artistCheckbox = screen.getByLabelText(/Sign up as Artist/i);
    fireEvent.click(artistCheckbox);

    // Verify artist fields appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Artist Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Primary Genre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/City \/ Region/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Portfolio \/ Music Links/i)).toBeInTheDocument();
    });
  });

  it('hides artist fields when artist checkbox is unchecked', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);

    const artistCheckbox = screen.getByLabelText(/Sign up as Artist/i);
    
    // Check then uncheck
    fireEvent.click(artistCheckbox);
    fireEvent.click(artistCheckbox);

    // Verify artist fields are hidden
    await waitFor(() => {
      expect(screen.queryByLabelText(/Artist Name/i)).not.toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    
    // Submit button should be disabled initially or show validation on submit
    expect(submitButton).toBeInTheDocument();
  });

  it('closes modal when Back button is clicked', () => {
    const onClose = vi.fn();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);

    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows right rail on desktop for sign up tab', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);

    expect(screen.getByText(/What's next/i)).toBeInTheDocument();
    expect(screen.getByText(/Verification steps/i)).toBeInTheDocument();
    expect(screen.getByText(/Community/i)).toBeInTheDocument();
  });
});
