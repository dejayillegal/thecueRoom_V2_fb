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
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (parseError) {
      // Cookie is not JSON, might be a simple string token
      // Return null to fall back to demo user
      return null;
    }

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
      
      console.log('🎨 Enhanced Album Cover Prompt:');
      console.log('━'.repeat(80));
      console.log(enhancedPrompt);
      console.log('━'.repeat(80));

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
  const aspect = params?.aspect || '1:1';
  const resolution = params?.resolution || '1024x1024';

  const styleDescriptions: Record<string, string> = {
    neon: 'vibrant neon colors with electric blues, hot pinks, and acid greens, cyberpunk aesthetic with glowing accents, lens flares, chromatic aberration effects, futuristic electronic music vibe, synthwave inspiration, retro-futuristic elements',
    monochrome: 'pure black and white with high contrast, minimalist Bauhaus-inspired design, stark shadows and dramatic lighting, clean geometric composition, brutally simple forms, Swiss design influence, deep blacks and crisp whites',
    geometric: 'bold geometric shapes with precise angles, abstract mathematical patterns, Bauhaus and constructivist influence, modern Swiss design aesthetic, clean lines with perfect symmetry, isometric perspectives, op-art visual effects, structured color blocking',
    brutalist: 'raw concrete textures with weathered surfaces, bold sans-serif typography, industrial warehouse aesthetic, exposed structures, urban decay elements, underground rave culture, stark architectural forms, gritty realistic materials, dystopian atmosphere'
  };

  // Build comprehensive album cover prompt
  let prompt = `Create a professional, high-resolution album cover artwork for electronic music. `;
  
  // User's core concept
  prompt += `Core concept: ${userPrompt}. `;
  
  // Style direction
  prompt += `Visual style and aesthetic: ${styleDescriptions[style] || styleDescriptions.neon}. `;
  
  // Technical specs
  prompt += `Format: Square album cover artwork, ${resolution} resolution, optimized for digital streaming platforms (Spotify, Bandcamp, Apple Music). `;
  
  // Artist/Release branding
  if (artist || release) {
    prompt += `Typography: `;
    if (artist) {
      prompt += `Artist name "${artist}" should be integrated into the design with bold, modern typography. `;
    }
    if (release) {
      prompt += `Release title "${release}" should complement the artist name with clean, readable typography. `;
    }
  } else {
    prompt += `IMPORTANT: No text or typography should be included in the image - pure visual artwork only. `;
  }
  
  // Design principles
  prompt += `Design principles: Professional music industry standard, eye-catching composition that stands out in small thumbnails, `;
  prompt += `strong focal point, balanced negative space, works in both color and grayscale, `;
  prompt += `suitable for both digital and physical formats (vinyl, cassette, CD). `;
  
  // Mood and atmosphere
  prompt += `Atmosphere: Underground electronic music scene, club-ready aesthetic, forward-thinking and contemporary, `;
  prompt += `should evoke emotion and energy appropriate for late-night listening or dance floor moments. `;
  
  // Quality markers
  prompt += `Quality: Studio-grade artwork, publication-ready, no watermarks, professional color grading, `;
  prompt += `high detail and clarity, suitable for professional release on major platforms.`;

  return prompt;
}

async function generateImageWithAI(prompt: string, params?: any): Promise<string> {
  // Try to use actual AI generation if possible, otherwise fallback to placeholder
  const hasGeminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (hasGeminiKey) {
    try {
      console.log('🎨 Generating album cover with Gemini AI...');
      console.log('Prompt:', prompt.substring(0, 150) + '...');
      
      // Use Gemini 2.0 Flash with image generation capabilities
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(hasGeminiKey);
      
      // Use the imagen-3.0-generate-001 model for image generation
      const model = genAI.getGenerativeModel({ 
        model: 'imagen-3.0-generate-001'
      });

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const response = result.response;
      const imageData = response.candidates?.[0]?.content?.parts?.[0];
      
      if (imageData && 'inlineData' in imageData) {
        const base64Data = imageData.inlineData.data;
        const imageUrl = `data:${imageData.inlineData.mimeType};base64,${base64Data}`;
        console.log('✅ AI generation successful!');
        return imageUrl;
      } else {
        console.log('⚠️ No image data in response, trying text generation with image prompt...');
        
        // Fallback: try text-to-image with Gemini 2.0 Flash
        const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const flashResult = await flashModel.generateContent({
          contents: [{
            role: 'user',
            parts: [{ 
              text: `Generate a high-quality album cover image based on this description: ${prompt}\n\nIMPORTANT: Create an actual image file, not a description.` 
            }]
          }]
        });
        
        const flashResponse = flashResult.response;
        const flashImageData = flashResponse.candidates?.[0]?.content?.parts?.[0];
        
        if (flashImageData && 'inlineData' in flashImageData) {
          const base64Data = flashImageData.inlineData.data;
          console.log('✅ Flash AI generation successful!');
          return `data:${flashImageData.inlineData.mimeType};base64,${base64Data}`;
        }
      }
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    }
  } else {
    console.log('⚠️ No Gemini API key found - using placeholder');
    console.log('💡 Add GOOGLE_API_KEY to Secrets to enable real AI generation');
  }
  
  // Fallback to enhanced placeholder
  console.log('📦 Generating enhanced SVG placeholder...');
  return generatePlaceholderImage(prompt, params);
}

function generatePlaceholderImage(prompt: string, params?: any): string {
  // Generate high-quality album cover style SVG
  const style = params?.style || 'neon';
  const artist = params?.artist || '';
  const release = params?.release || '';

  const styleColors: Record<string, string[]> = {
    neon: ['#FF00FF', '#00FFFF', '#FF0080', '#9D00FF'], // Magenta, Cyan, Hot Pink, Purple
    monochrome: ['#000000', '#1a1a1a', '#333333', '#666666'], // Black to Gray
    geometric: ['#FF6B35', '#F7931E', '#FDC830', '#FDBB2D'], // Orange gradient
    brutalist: ['#0a0a0a', '#8B0000', '#2F4F4F', '#1a1a1a'], // Dark with red accent
  };

  const colors = styleColors[style] || styleColors.neon;
  const width = parseInt(params?.resolution?.split('x')[0] || '1024');
  const height = parseInt(params?.resolution?.split('x')[1] || '1024');

  // Create album cover patterns based on style
  let pattern = '';
  let textElements = '';
  
  if (style === 'geometric') {
    pattern = `
      <circle cx="${width * 0.3}" cy="${height * 0.3}" r="${width * 0.25}" fill="${colors[0]}" opacity="0.4"/>
      <circle cx="${width * 0.7}" cy="${height * 0.7}" r="${width * 0.25}" fill="${colors[1]}" opacity="0.4"/>
      <rect x="${width * 0.35}" y="${height * 0.35}" width="${width * 0.3}" height="${width * 0.3}" 
            fill="${colors[2]}" opacity="0.3" transform="rotate(45 ${width/2} ${height/2})"/>
      <polygon points="${width*0.5},${height*0.2} ${width*0.7},${height*0.5} ${width*0.5},${height*0.8} ${width*0.3},${height*0.5}" 
               fill="${colors[3]}" opacity="0.25"/>`;
  } else if (style === 'brutalist') {
    pattern = `
      <rect x="0" y="0" width="${width}" height="${height * 0.15}" fill="${colors[1]}" opacity="0.9"/>
      <rect x="0" y="${height * 0.85}" width="${width}" height="${height * 0.15}" fill="${colors[2]}" opacity="0.9"/>
      <rect x="${width * 0.05}" y="${height * 0.4}" width="${width * 0.9}" height="${height * 0.2}" 
            fill="${colors[3]}" opacity="0.2" transform="rotate(-5 ${width/2} ${height/2})"/>`;
  } else if (style === 'neon') {
    pattern = `
      <circle cx="${width/2}" cy="${height/2}" r="${width * 0.4}" fill="none" stroke="${colors[0]}" stroke-width="4" opacity="0.6">
        <animate attributeName="r" values="${width*0.35};${width*0.45};${width*0.35}" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${width/2}" cy="${height/2}" r="${width * 0.3}" fill="none" stroke="${colors[1]}" stroke-width="3" opacity="0.7">
        <animate attributeName="r" values="${width*0.25};${width*0.35};${width*0.25}" dur="2s" repeatCount="indefinite"/>
      </circle>
      <rect x="${width * 0.1}" y="${height * 0.1}" width="${width * 0.8}" height="${height * 0.8}" 
            fill="none" stroke="${colors[2]}" stroke-width="2" opacity="0.3"/>`;
  }

  // Add text if artist/release provided
  if (artist || release) {
    const fontSize = Math.max(24, width * 0.08);
    const smallFontSize = Math.max(16, width * 0.05);
    textElements = `
      <text x="${width/2}" y="${height * 0.85}" font-family="Arial, sans-serif" font-size="${fontSize}" 
            font-weight="bold" fill="white" text-anchor="middle" opacity="0.95">
        ${artist || 'ARTIST'}
      </text>
      <text x="${width/2}" y="${height * 0.92}" font-family="Arial, sans-serif" font-size="${smallFontSize}" 
            fill="white" text-anchor="middle" opacity="0.8">
        ${release || 'RELEASE'}
      </text>`;
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
          <stop offset="33%" style="stop-color:${colors[1]};stop-opacity:1" />
          <stop offset="66%" style="stop-color:${colors[2]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[colors.length - 1]};stop-opacity:1" />
        </linearGradient>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <rect width="${width}" height="${height}" filter="url(#noise)" opacity="0.15"/>
      <g filter="url(#glow)">
        ${pattern}
      </g>
      ${textElements}
    </svg>
  `;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}