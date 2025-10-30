
import { NextResponse } from 'next/server';
import type { EPKTemplate } from '@thecueroom/epk';

const TEMPLATES: EPKTemplate[] = [
  {
    id: 'futuristic-gradient',
    name: '🌌 Futuristic Gradient',
    description: 'Modern holographic design with animated gradients and glassmorphism effects. Perfect for forward-thinking electronic artists.',
    previewThumbnail: '/epk-templates/futuristic-preview.png',
    layout: 'brutalist-onepage'
  },
  {
    id: 'neon-cyberpunk',
    name: '⚡ Neon Cyberpunk',
    description: 'Bold neon aesthetics with grid overlays and glitch effects. Ideal for techno, bass, and underground scenes.',
    previewThumbnail: '/epk-templates/cyberpunk-preview.png',
    layout: 'brutalist-onepage'
  },
  {
    id: 'minimal-swiss',
    name: '📐 Minimal Swiss',
    description: 'Clean Swiss-style typography with precision layouts. Professional and timeless for any genre.',
    previewThumbnail: '/epk-templates/swiss-preview.png',
    layout: 'console-minimal'
  },
  {
    id: 'brutalist-onepage',
    name: '🔲 Brutalist One-Page',
    description: 'Bold, minimal design with maximum impact. Perfect for underground artists.',
    previewThumbnail: '/epk-templates/brutalist-preview.png',
    layout: 'brutalist-onepage'
  },
  {
    id: 'gallery-two-column',
    name: '🖼️ Gallery Two-Column',
    description: 'Visual-first layout showcasing your work with elegant imagery.',
    previewThumbnail: '/epk-templates/gallery-preview.png',
    layout: 'gallery-two-column'
  }
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    templates: TEMPLATES
  });
}
