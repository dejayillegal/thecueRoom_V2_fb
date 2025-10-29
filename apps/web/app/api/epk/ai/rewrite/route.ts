import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import nlp from 'compromise';

const RewriteRequestSchema = z.object({
  text: z.string(),
  tone: z.enum(['press', 'bio', 'concise', 'brutalist']).optional().default('bio')
});

const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_KEY;
const HF_MODEL = 'tiiuae/falcon-7b-instruct';

async function rewriteWithHuggingFace(text: string, tone: string): Promise<string | null> {
  if (!HF_TOKEN) return null;

  try {
    const prompt = buildPrompt(text, tone);
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.7,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      console.error('[AI Rewrite] HF API error:', response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text.trim();
    }

    return null;
  } catch (error) {
    console.error('[AI Rewrite] HF error:', error);
    return null;
  }
}

function buildPrompt(text: string, tone: string): string {
  const prompts = {
    press: `Rewrite the following artist biography for a press release. Make it professional, newsworthy, and highlight key achievements:\n\n${text}\n\nPress release version:`,
    bio: `Rewrite the following artist biography to be more engaging and compelling for fans:\n\n${text}\n\nImproved biography:`,
    concise: `Condense the following text to be brief and impactful, keeping only the most important information:\n\n${text}\n\nConcise version:`,
    brutalist: `Rewrite the following in a bold, direct, minimal style with maximum impact:\n\n${text}\n\nBrutalist version:`
  };

  return prompts[tone as keyof typeof prompts] || prompts.bio;
}

function localRewrite(text: string, tone: string): string {
  const doc = nlp(text);
  
  let sentences = doc.sentences().out('array');
  
  if (tone === 'concise') {
    sentences = sentences.slice(0, Math.min(3, sentences.length));
  }
  
  let rewritten = sentences.map((sentence: string) => {
    let s = sentence.trim();
    
    if (s.length > 100) {
      const parts = s.split(',');
      s = parts.slice(0, 2).join(',');
    }
    
    s = s.replace(/was\s+(\w+ing)/gi, '$1');
    s = s.replace(/has been\s+(\w+ing)/gi, 'is $1');
    
    if (tone === 'press') {
      s = s.replace(/\b(good|nice|cool)\b/gi, 'notable');
      s = s.replace(/\b(played|performed)\b/gi, 'headlined');
    }
    
    if (tone === 'brutalist') {
      s = s.replace(/\b(very|really|quite|somewhat)\s+/gi, '');
      s = s.replace(/\b(I think|perhaps|maybe)\b/gi, '');
    }
    
    return s;
  }).join(' ');
  
  const callToActions = {
    press: 'Available for press inquiries and bookings.',
    bio: 'Catch them live at upcoming shows.',
    concise: 'More at artist.com',
    brutalist: 'Now.'
  };
  
  if (tone !== 'concise') {
    rewritten += ' ' + callToActions[tone as keyof typeof callToActions];
  }
  
  return rewritten;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, tone } = RewriteRequestSchema.parse(body);

    if (!text || text.trim().length < 10) {
      return NextResponse.json({
        ok: false,
        error: 'Text is too short for rewriting'
      }, { status: 400 });
    }

    let rewritten = await rewriteWithHuggingFace(text, tone);
    let usedHF = false;

    if (rewritten) {
      usedHF = true;
      console.log('[AI Rewrite] Used Hugging Face model');
    } else {
      rewritten = localRewrite(text, tone);
      console.log('[AI Rewrite] Used local fallback');
    }

    return NextResponse.json({
      ok: true,
      rewritten,
      usedHF
    });
  } catch (error) {
    console.error('[AI Rewrite] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
