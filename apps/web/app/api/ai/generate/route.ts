import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDbClient } from '@/lib/db-client';
import { aiJobs, users } from '@thecueroom/db/schema';
import { cookies } from 'next/headers';
import { aiQueue } from '@/lib/ai-queue';

const db = getDbClient();

const generateSchema = z.object({
  type: z.enum(['cover-art', 'meme', 'avatar']),
  prompt: z.string().optional(),
  params: z.object({
    style: z.string().optional(),
    template: z.string().optional(),
    topText: z.string().optional(),
    bottomText: z.string().optional(),
    watermark: z.boolean().optional(),
    artist: z.string().optional(),
    release: z.string().optional(),
    aspect: z.string().optional(),
    resolution: z.string().optional(),
    seed: z.string().optional(),
    hair: z.string().optional(),
    accentColor: z.string().optional(),
  }).optional(),
});

async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return null;
    }

    // Parse session to get user email or ID
    // Adjust this based on your actual session structure
    const sessionData = JSON.parse(sessionCookie.value);
    const userEmail = sessionData.email || sessionData.user?.email;

    if (!userEmail) {
      return null;
    }

    // Look up user in database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    return user?.id || null;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

async function getOrCreateDemoUser(): Promise<string> {
  const demoEmail = 'demo@thecueroom.com';

  // Try to find existing demo user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, demoEmail))
    .limit(1);

  if (existingUser) {
    return existingUser.id;
  }

  // Create demo user if it doesn't exist
  const [newUser] = await db
    .insert(users)
    .values({
      email: demoEmail,
      role: 'user',
    })
    .returning();

  return newUser.id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = generateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get authenticated user ID or use demo user for development
    let userId = await getAuthenticatedUserId();

    if (!userId) {
      // For development/demo purposes, use or create a demo user
      if (process.env.NODE_ENV === 'development') {
        userId = await getOrCreateDemoUser();
        console.log('Using demo user for AI job creation');
      } else {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    // Create job in database
    const jobId = crypto.randomUUID();

    await db.insert(aiJobs).values({
      id: jobId,
      userId: userId, // Use the obtained user ID
      type: data.type,
      prompt: data.prompt || '',
      status: 'queued',
      createdAt: new Date(),
    });

    // Process the job immediately in the background
    processAIJob(jobId, data).catch(err => {
      console.error('Background job processing error:', err);
    });

    return NextResponse.json({
      jobId,
      status: 'queued',
    }, { status: 202 });

  } catch (error) {
    console.error('AI generate API error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI job' },
      { status: 500 }
    );
  }
}

async function processAIJob(jobId: string, data: z.infer<typeof generateSchema>) {
  try {
    // Update job status to processing
    await db.update(aiJobs)
      .set({ status: 'processing' })
      .where(eq(aiJobs.id, jobId));

    let resultUrl: string;

    if (data.type === 'cover-art') {
      // Build enhanced prompt for cover art
      const enhancedPrompt = buildCoverArtPrompt(data.prompt || '', data.params);

      // Generate image using AI model
      resultUrl = await generateImageWithAI(enhancedPrompt, data.params);
    } else {
      throw new Error(`Unsupported job type: ${data.type}`);
    }

    // Update job with result
    await db.update(aiJobs)
      .set({ 
        status: 'completed',
        resultUrl,
        completedAt: new Date()
      })
      .where(eq(aiJobs.id, jobId));

  } catch (error) {
    console.error('Job processing error:', error);

    // Update job with error
    await db.update(aiJobs)
      .set({ 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      })
      .where(eq(aiJobs.id, jobId));
  }
}

function buildCoverArtPrompt(userPrompt: string, params?: any): string {
  const style = params?.style || 'neon';
  const artist = params?.artist || '';
  const release = params?.release || '';

  const styleDescriptions: Record<string, string> = {
    neon: 'vibrant neon colors, cyberpunk aesthetic, glowing accents',
    monochrome: 'black and white, high contrast, minimalist design',
    geometric: 'geometric shapes, abstract patterns, modern design',
    brutalist: 'bold typography, raw concrete textures, industrial aesthetic'
  };

  let prompt = `Create a professional album cover art. ${userPrompt}. `;
  prompt += `Style: ${styleDescriptions[style] || styleDescriptions.neon}. `;

  if (artist) {
    prompt += `Artist name: ${artist}. `;
  }
  if (release) {
    prompt += `Release title: ${release}. `;
  }

  prompt += 'High quality, professional music industry standard, eye-catching design.';

  return prompt;
}

async function generateImageWithAI(prompt: string, params?: any): Promise<string> {
  // Generate free placeholder images with enhanced gradients
  // This ensures the feature works without any API keys
  return generatePlaceholderImage(prompt, params);
}

function generatePlaceholderImage(prompt: string, params?: any): string {
  // Generate high-quality SVG based on style
  const style = params?.style || 'neon';

  const styleColors: Record<string, string[]> = {
    neon: ['#FF00FF', '#00FFFF', '#FF0080'], // Magenta, Cyan, Hot Pink
    monochrome: ['#000000', '#333333', '#666666'], // Black to Gray
    geometric: ['#FF6B35', '#F7931E', '#FDC830'], // Orange gradient
    brutalist: ['#1a1a1a', '#8B0000', '#2F4F4F'], // Dark with red accent
  };

  const colors = styleColors[style] || styleColors.neon;
  const width = parseInt(params?.resolution?.split('x')[0] || '1024');
  const height = parseInt(params?.resolution?.split('x')[1] || '1024');

  // Create artistic patterns based on style
  let pattern = '';
  if (style === 'geometric') {
    pattern = `<circle cx="256" cy="256" r="200" fill="${colors[0]}" opacity="0.3"/>
               <circle cx="768" cy="768" r="200" fill="${colors[1]}" opacity="0.3"/>
               <rect x="400" y="400" width="224" height="224" fill="${colors[2]}" opacity="0.2" transform="rotate(45 512 512)"/>`;
  } else if (style === 'brutalist') {
    pattern = `<rect x="0" y="0" width="${width}" height="100" fill="${colors[1]}" opacity="0.8"/>
               <rect x="0" y="${height - 100}" width="${width}" height="100" fill="${colors[2]}" opacity="0.8"/>`;
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colors[1]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[colors.length - 1]};stop-opacity:1" />
        </linearGradient>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
          <feColorMatrix type="saturate" values="0"/>
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <rect width="${width}" height="${height}" filter="url(#noise)" opacity="0.1"/>
      ${pattern}
    </svg>
  `;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}