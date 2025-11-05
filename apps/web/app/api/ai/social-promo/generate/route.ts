
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const generatePromoSchema = z.object({
  type: z.enum(['release', 'gig', 'announcement', 'general']),
  title: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  platforms: z.array(z.string()).min(1),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generatePromoSchema.parse(body);

    // Generate AI caption
    const caption = await generateCaption(validated);
    const tags = generateTags(validated);

    // Generate image using AI
    const imageUrl = await generatePromoImage(validated, caption);

    // Store in database
    const promoId = crypto.randomUUID();

    return NextResponse.json({
      id: promoId,
      content: {
        title: validated.title || 'Social Promo',
        caption,
        tags,
        themeColor: validated.themeColor || '#D1FF3D',
      },
      imageUrl,
      status: 'ready',
    });
  } catch (error) {
    console.error('Social promo generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate promo' },
      { status: 500 }
    );
  }
}

async function generateCaption(data: any): Promise<string> {
  const typeTemplates: Record<string, string> = {
    release: `🎵 New music alert! ${data.description}`,
    gig: `📍 Catch me live! ${data.description}`,
    announcement: `📢 ${data.description}`,
    general: data.description,
  };

  return typeTemplates[data.type] || data.description;
}

function generateTags(data: any): string[] {
  const baseTags = ['#electronicmusic', '#dj', '#producer'];
  const typeTags: Record<string, string[]> = {
    release: ['#newmusic', '#release', '#nowplaying'],
    gig: ['#gig', '#live', '#event'],
    announcement: ['#news', '#announcement'],
    general: ['#music', '#artist'],
  };

  return [...baseTags, ...(typeTags[data.type] || [])].slice(0, 10);
}

async function generatePromoImage(data: any, caption: string): Promise<string> {
  // For now, return a placeholder - integrate with AI image generation
  const canvas = `
    <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1080" fill="#0B0B0B"/>
      <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="${data.themeColor || '#D1FF3D'}" stroke-width="4"/>
      <text x="540" y="500" font-family="Arial" font-size="48" fill="${data.themeColor || '#D1FF3D'}" text-anchor="middle" font-weight="bold">
        ${data.title || 'NEW PROMO'}
      </text>
      <text x="540" y="600" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
        thecueRoom
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
}
