
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db-client';
import { aiJobs } from '@/packages/db/schema';

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

    // Create job in database
    const jobId = crypto.randomUUID();
    
    await db.insert(aiJobs).values({
      id: jobId,
      userId: '00000000-0000-0000-0000-000000000000', // Replace with actual user ID from session
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
      .where({ id: jobId });

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
      .where({ id: jobId });

  } catch (error) {
    console.error('Job processing error:', error);
    
    // Update job with error
    await db.update(aiJobs)
      .set({ 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      })
      .where({ id: jobId });
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
  // Using Hugging Face Inference API with Stable Diffusion
  const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
  
  if (!HF_API_KEY) {
    // Fallback to placeholder if no API key
    console.warn('No Hugging Face API key found, using placeholder');
    return generatePlaceholderImage(prompt);
  }

  try {
    // Using Flux for higher quality results
    const response = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 4, // Flux Schnell is optimized for 4 steps
            guidance_scale: 0, // Flux doesn't use guidance scale
            width: parseInt(params?.resolution?.split('x')[0] || '1024'),
            height: parseInt(params?.resolution?.split('x')[1] || '1024'),
            seed: params?.seed ? parseInt(params.seed) : undefined,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Return as data URL
    return `data:image/png;base64,${base64}`;

  } catch (error) {
    console.error('AI generation error:', error);
    // Fallback to placeholder
    return generatePlaceholderImage(prompt);
  }
}

function generatePlaceholderImage(prompt: string): string {
  // Generate a placeholder SVG with gradient based on prompt
  const colors = [
    ['#8B5CF6', '#EC4899'], // purple to pink
    ['#3B82F6', '#06B6D4'], // blue to cyan
    ['#EF4444', '#F97316'], // red to orange
    ['#10B981', '#14B8A6'], // green to teal
  ];
  
  const colorPair = colors[Math.floor(Math.random() * colors.length)];
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.3">
        ${prompt.substring(0, 30)}...
      </text>
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
