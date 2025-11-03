
import type { Meta, StoryObj } from '@storybook/react';
import AuthModal from '../../src/components/Auth/AuthModal';

const meta = {
  title: 'Components/AuthModal',
  component: AuthModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls modal visibility',
    },
  },
} satisfies Meta<typeof AuthModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignInDefault: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default sign in state matching screenshot 1',
      },
    },
  },
};

export const SignUpDefault: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Sign up tab without artist checkbox checked',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signUpButton = canvas.getByRole('button', { name: /Sign Up/i });
    await userEvent.click(signUpButton);
  },
};

export const SignUpArtist: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Sign up with artist checkbox checked - matches screenshot 2',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signUpButton = canvas.getByRole('button', { name: /Sign Up/i });
    await userEvent.click(signUpButton);
    
    // Wait for tab to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const artistCheckbox = canvas.getByLabelText(/Sign up as Artist/i);
    await userEvent.click(artistCheckbox);
  },
};

export const ForgotPassword: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Forgot password flow',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const forgotButton = canvas.getByRole('button', { name: /Forgot/i });
    await userEvent.click(forgotButton);
  },
};

// Import for play functions
import { within, userEvent } from '@storybook/testing-library';
