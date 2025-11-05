export interface MockAIPlaylistItem {
  trackPlatform: 'spotify' | 'soundcloud' | 'mixcloud';
  trackId: string;
  trackTitle: string;
  artistName: string;
  trackUrl: string;
  coverImage?: string;
  position: number;
  aiScore: number;
  aiRationale: string;
}

export interface MockAICurationResult {
  ok: boolean;
  title: string;
  description: string;
  platform: 'spotify' | 'soundcloud' | 'mixcloud';
  platformId: string;
  embedUrl: string;
  coverImage: string;
  trackCount: number;
  items: MockAIPlaylistItem[];
  confidence: number;
  rationale: string;
  generatedAt: string;
}

export class MockAIAdapter {
  private useMock: boolean;

  constructor() {
    this.useMock = process.env.MOCK_AI === 'true' || process.env.NODE_ENV === 'development';
  }

  async generateMonthlyPlaylist(input: {
    monthOf: Date;
    historyMonths?: number;
    genrePreferences?: string[];
    minConfidence?: number;
  }): Promise<MockAICurationResult> {
    if (!this.useMock) {
      throw new Error('Real AI implementation not available. Set MOCK_AI=true for mock mode.');
    }

    await this.simulateDelay(2000);

    const monthName = input.monthOf.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const mockItems: MockAIPlaylistItem[] = [
      {
        trackPlatform: 'spotify',
        trackId: 'mock_track_1',
        trackTitle: 'Ethereal Waves',
        artistName: 'Luna Electronica',
        trackUrl: 'https://open.spotify.com/track/mock_track_1',
        coverImage: 'https://via.placeholder.com/64x64?text=Track1',
        position: 1,
        aiScore: 92,
        aiRationale: 'Perfect opening track with atmospheric build-up and strong melodic hooks',
      },
      {
        trackPlatform: 'spotify',
        trackId: 'mock_track_2',
        trackTitle: 'Neon Pulse',
        artistName: 'Synth Architects',
        trackUrl: 'https://open.spotify.com/track/mock_track_2',
        coverImage: 'https://via.placeholder.com/64x64?text=Track2',
        position: 2,
        aiScore: 88,
        aiRationale: 'Energetic progression with driving bassline, complements opener well',
      },
      {
        trackPlatform: 'spotify',
        trackId: 'mock_track_3',
        trackTitle: 'Midnight Circuit',
        artistName: 'Digital Dreams',
        trackUrl: 'https://open.spotify.com/track/mock_track_3',
        coverImage: 'https://via.placeholder.com/64x64?text=Track3',
        position: 3,
        aiScore: 85,
        aiRationale: 'Mid-tempo groover with hypnotic rhythm patterns',
      },
      {
        trackPlatform: 'spotify',
        trackId: 'mock_track_4',
        trackTitle: 'Crystal Horizons',
        artistName: 'Aurora Sound',
        trackUrl: 'https://open.spotify.com/track/mock_track_4',
        coverImage: 'https://via.placeholder.com/64x64?text=Track4',
        position: 4,
        aiScore: 90,
        aiRationale: 'Melodic peak moment with soaring pads and emotional resonance',
      },
      {
        trackPlatform: 'spotify',
        trackId: 'mock_track_5',
        trackTitle: 'Binary Sunset',
        artistName: 'Tech Noir',
        trackUrl: 'https://open.spotify.com/track/mock_track_5',
        coverImage: 'https://via.placeholder.com/64x64?text=Track5',
        position: 5,
        aiScore: 87,
        aiRationale: 'Perfect closing track with gradual wind-down and atmospheric fade',
      },
    ];

    const genreText = input.genrePreferences?.length
      ? ` focusing on ${input.genrePreferences.join(', ')}`
      : '';

    return {
      ok: true,
      title: `Electronic Pulse: ${monthName}`,
      description: `AI-curated electronic music selection for ${monthName}${genreText}. A journey through atmospheric soundscapes and driving rhythms.`,
      platform: 'spotify',
      platformId: `mock_playlist_${Date.now()}`,
      embedUrl: `https://open.spotify.com/embed/playlist/mock_playlist_${Date.now()}`,
      coverImage: 'https://via.placeholder.com/300x300?text=AI+Curated+Playlist',
      trackCount: mockItems.length,
      items: mockItems,
      confidence: 85,
      rationale: `Generated based on historical listening patterns${genreText}. High confidence in genre coherence and progression. Track ordering optimized for flow and energy arc.`,
      generatedAt: new Date().toISOString(),
    };
  }

  async reviewPlaylistQuality(playlistData: {
    title: string;
    platform: string;
    trackCount: number;
  }): Promise<{
    ok: boolean;
    score: number;
    feedback: string[];
    warnings: string[];
  }> {
    if (!this.useMock) {
      throw new Error('Real AI implementation not available. Set MOCK_AI=true for mock mode.');
    }

    await this.simulateDelay(1000);

    const feedback: string[] = [];
    const warnings: string[] = [];
    let score = 80;

    if (playlistData.trackCount < 15) {
      warnings.push('Track count is below recommended minimum (15 tracks)');
      score -= 5;
    } else if (playlistData.trackCount > 40) {
      warnings.push('Track count is above recommended maximum (40 tracks)');
      score -= 3;
    } else {
      feedback.push('Track count is optimal for monthly playlist');
    }

    if (playlistData.title.toLowerCase().includes('electronic')) {
      feedback.push('Title clearly communicates genre focus');
      score += 5;
    }

    if (playlistData.platform === 'spotify') {
      feedback.push('Spotify is the most popular platform for curated playlists');
    }

    return {
      ok: true,
      score: Math.min(Math.max(score, 0), 100),
      feedback,
      warnings,
    };
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockAI = new MockAIAdapter();
