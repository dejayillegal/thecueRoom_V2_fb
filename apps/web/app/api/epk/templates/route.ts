import { NextResponse } from 'next/server';
import type { EPKTemplate } from '@thecueroom/epk';

const TEMPLATES: EPKTemplate[] = [
  {
    id: 'brutalist-onepage',
    name: 'Brutalist One-Page',
    description: 'Bold, minimal design with maximum impact. Perfect for underground artists.',
    previewThumbnail: '/epk-templates/brutalist-preview.png',
    layout: 'brutalist-onepage'
  },
  {
    id: 'gallery-two-column',
    name: 'Gallery Two-Column',
    description: 'Visual-first layout showcasing your work with elegant imagery.',
    previewThumbnail: '/epk-templates/gallery-preview.png',
    layout: 'gallery-two-column'
  },
  {
    id: 'console-minimal',
    name: 'Console Minimal',
    description: 'Tech-inspired, clean aesthetic for modern electronic artists.',
    previewThumbnail: '/epk-templates/console-preview.png',
    layout: 'console-minimal'
  },
  {
    id: 'presskit-compact',
    name: 'Press Kit Compact',
    description: 'Professional, compact format optimized for media outlets.',
    previewThumbnail: '/epk-templates/presskit-preview.png',
    layout: 'presskit-compact'
  }
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    templates: TEMPLATES
  });
}
