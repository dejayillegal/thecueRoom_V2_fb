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
  const hasHFKey = process.env.HF_TOKEN || process.env.HUGGINGFACE_KEY;
  const hasGeminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (hasHFKey) {
    try {
      console.log('🎨 Generating album cover with Hugging Face AI...');
      const { generateWithHuggingFace } = await import('../../../../packages/ai/impl/hf');
      
      const result = await generateWithHuggingFace(
        {
          prompt,
          negativePrompt: 'blurry, low quality, distorted, text, watermark',
          width: 1024,
          height: 1024,
        },
        hasHFKey
      );
      
      if (result.success && result.imageBuffer) {
        const base64 = result.imageBuffer.toString('base64');
        console.log('✅ Hugging Face generation successful!');
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error('❌ HF generation failed:', error);
    }
  }
  
  if (hasGeminiKey) {
    try {
      console.log('🎨 Generating album cover with Gemini AI...');
      console.log('Prompt:', prompt.substring(0, 150) + '...');
      
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(hasGeminiKey);
      
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
      
      if (imageData && 'inlineData' in imageData && imageData.inlineData) {
        const base64Data = imageData.inlineData.data;
        const imageUrl = `data:${imageData.inlineData.mimeType};base64,${base64Data}`;
        console.log('✅ AI generation successful!');
        return imageUrl;
      } else {
        console.log('⚠️ No image data in response, trying text generation with image prompt...');
        
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
        
        if (flashImageData && 'inlineData' in flashImageData && flashImageData.inlineData) {
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
    console.log('⚠️ No AI API key found - using advanced SVG fallback');
    console.log('💡 Add HF_TOKEN or GOOGLE_API_KEY to Secrets to enable real AI generation');
  }
  
  console.log('📦 Generating advanced procedural SVG...');
  return generatePlaceholderImage(prompt, params);
}

async function generatePlaceholderImage(prompt: string, params?: any): Promise<string> {
  try {
    const { generateFallbackSVG } = await import('../../../../packages/ai/impl/fallback-svg');
    
    const style = params?.style || 'neon-accent';
    const artist = params?.artist || '';
    const release = params?.release || '';
    const seed = parseInt(params?.seed) || Math.floor(Math.random() * 1000000);
    
    const styleMap: Record<string, any> = {
      'neon': 'neon-accent',
      'monochrome': 'monochrome',
      'geometric': 'geometric',
      'brutalist': 'brutalist',
    };
    
    const mappedStyle = styleMap[style] || style;
    
    const svg = generateFallbackSVG({
      preset: mappedStyle,
      artist,
      release,
      seed,
    });
    
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.error('SVG generation error:', error);
    
    const width = parseInt(params?.resolution?.split('x')[0] || '1024');
    const height = parseInt(params?.resolution?.split('x')[1] || '1024');
    
    const fallbackSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#1a1a1a"/>
        <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
          Album Cover
        </text>
      </svg>
    `;
    
    const base64 = Buffer.from(fallbackSvg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}