
import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedEmbedPlayer } from './UnifiedEmbedPlayer';

const meta = {
  title: 'Components/Player/UnifiedEmbedPlayer',
  component: UnifiedEmbedPlayer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UnifiedEmbedPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SpotifyPlaylist: Story = {
  args: {
    platform: 'spotify',
    playlistId: '37i9dQZF1DXcBWIGoYBM5M',
    title: 'Today\'s Top Hits',
    trackCount: 50,
    coverImage: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc',
    showExternalButton: true,
  },
};

export const SoundCloudPlaylist: Story = {
  args: {
    platform: 'soundcloud',
    playlistId: 'user-123/sets/my-playlist',
    title: 'Underground Techno Mix',
    trackCount: 24,
    showExternalButton: true,
  },
};

export const MixcloudShow: Story = {
  args: {
    platform: 'mixcloud',
    playlistId: '/dj-name/set-name/',
    title: 'Live DJ Set',
    trackCount: 1,
    showExternalButton: true,
  },
};

export const EmbedFailed: Story = {
  args: {
    platform: 'spotify',
    playlistId: 'invalid-id-that-will-fail',
    title: 'Test Playlist',
    trackCount: 10,
    coverImage: 'https://via.placeholder.com/300',
    showExternalButton: true,
  },
};

export const WithoutExternalButton: Story = {
  args: {
    platform: 'spotify',
    playlistId: '37i9dQZF1DXcBWIGoYBM5M',
    title: 'Today\'s Top Hits',
    showExternalButton: false,
  },
};
