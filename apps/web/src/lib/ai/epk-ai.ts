// Following blueprint:javascript_openai integration
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export type EPKTextType = 'bio' | 'press_quote' | 'tech_rider' | 'promo_text';

interface GenerateEPKTextRequest {
  type: EPKTextType;
  artistName: string;
  genre?: string;
  existingText?: string;
  tone?: 'professional' | 'edgy' | 'minimal' | 'press';
}

interface GenerateEPKTextResponse {
  text: string;
  usedAI: boolean;
}

export async function generateEPKText(request: GenerateEPKTextRequest): Promise<GenerateEPKTextResponse> {
  if (!openai || !OPENAI_API_KEY) {
    return {
      text: generateFallbackText(request),
      usedAI: false
    };
  }

  try {
    const prompt = buildPrompt(request);
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert music industry copywriter specializing in Electronic Press Kits (EPKs). Create compelling, professional content for artists."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 800,
    });

    const generatedText = response.choices[0].message.content?.trim() || '';
    
    if (!generatedText || generatedText.length < 10) {
      console.warn('[EPK AI] GPT-5 returned empty/short content, using fallback');
      return {
        text: generateFallbackText(request),
        usedAI: false
      };
    }
    
    return {
      text: generatedText,
      usedAI: true
    };
  } catch (error) {
    console.error('[EPK AI] GPT-5 error:', error);
    return {
      text: generateFallbackText(request),
      usedAI: false
    };
  }
}

export async function improveEPKText(text: string, tone: string = 'professional'): Promise<GenerateEPKTextResponse> {
  if (!openai || !OPENAI_API_KEY) {
    return {
      text: text,
      usedAI: false
    };
  }

  try {
    const toneInstructions = {
      professional: 'Make it more professional and polished for promoters and venues',
      edgy: 'Make it bold, edgy, and attention-grabbing for underground scenes',
      minimal: 'Make it concise, direct, and impactful with minimal words',
      press: 'Rewrite for press releases - newsworthy, achievement-focused, media-friendly'
    };

    const instruction = toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert music industry copywriter. Improve the following text while maintaining the core message."
        },
        {
          role: "user",
          content: `${instruction}:\n\n${text}\n\nImproved version:`
        }
      ],
      max_completion_tokens: 800,
    });

    const improved = response.choices[0].message.content?.trim() || '';
    
    if (!improved || improved.length < 10) {
      console.warn('[EPK AI] GPT-5 improvement returned empty/short content, keeping original');
      return {
        text: text,
        usedAI: false
      };
    }
    
    return {
      text: improved,
      usedAI: true
    };
  } catch (error) {
    console.error('[EPK AI] Improvement error:', error);
    return {
      text: text,
      usedAI: false
    };
  }
}

function buildPrompt(request: GenerateEPKTextRequest): string {
  const { type, artistName, genre, existingText, tone = 'professional' } = request;

  const baseInfo = `Artist: ${artistName}${genre ? `\nGenre: ${genre}` : ''}`;
  
  const prompts: Record<EPKTextType, string> = {
    bio: `Write a compelling artist biography for ${artistName}${genre ? `, a ${genre} artist` : ''}. ${
      existingText ? `Use this information: ${existingText}\n\n` : ''
    }Make it ${tone}, engaging, and highlight their unique sound. Include their musical journey, influences, and what makes them stand out. Keep it between 150-250 words.`,
    
    press_quote: `Write 2-3 short press quotes (1-2 sentences each) that could appear in reviews or features about ${artistName}${genre ? `, a ${genre} artist` : ''}. ${
      existingText ? `Based on: ${existingText}\n\n` : ''
    }Make them sound like they came from music critics or industry publications. Be specific about their sound and impact.`,
    
    tech_rider: `Create a concise technical rider for ${artistName}${genre ? `, a ${genre} artist` : ''}. ${
      existingText ? `Additional requirements: ${existingText}\n\n` : ''
    }List essential equipment needed for live performance (DJ setup, instruments, audio equipment). Be specific but realistic. Format as a bullet list.`,
    
    promo_text: `Write a short promotional blurb (50-75 words) for ${artistName}${genre ? `, a ${genre} artist` : ''}. ${
      existingText ? `About: ${existingText}\n\n` : ''
    }Make it punchy, ${tone}, and perfect for festival lineups or event announcements. Highlight what makes them unmissable.`
  };

  return prompts[type] + `\n\n${baseInfo}`;
}

function generateFallbackText(request: GenerateEPKTextRequest): string {
  const { type, artistName, genre } = request;
  
  const fallbacks: Record<EPKTextType, string> = {
    bio: `${artistName} is ${genre ? `a ${genre} artist` : 'an artist'} creating innovative sounds and pushing boundaries. With a unique approach to music production and performance, ${artistName} has been building a dedicated following through compelling releases and dynamic live shows. Their sound blends creativity with technical precision, creating immersive experiences for audiences.`,
    
    press_quote: `"${artistName} delivers a fresh take on ${genre || 'electronic music'} with impressive skill and creativity." - Music Press\n\n"A rising talent to watch in the scene." - Industry Review`,
    
    tech_rider: `DJ SETUP:\n• 2x CDJ-3000 or equivalent\n• DJM-900NXS2 or equivalent mixer\n• 2x Monitor speakers\n• Microphone (SM58 or equivalent)\n\nAUDIO:\n• PA System with full-range coverage\n• Subwoofers\n• Stage monitoring\n\nOTHER:\n• Dedicated USB ports\n• Stable internet connection\n• Green room access`,
    
    promo_text: `${artistName} brings high-energy ${genre || 'electronic music'} to the stage with an infectious blend of innovation and crowd-pleasing selection. Known for dynamic sets and technical prowess, ${artistName} is a must-see artist.`
  };

  return fallbacks[type];
}

export function isAIAvailable(): boolean {
  return !!OPENAI_API_KEY;
}
