
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HUGGINGFACE_KEY = process.env.HUGGINGFACE_KEY || process.env.HF_API_TOKEN;
const PERPLEXITY_KEY = process.env.PERPLEXITY_KEY;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const perplexity = PERPLEXITY_KEY ? new OpenAI({ 
  apiKey: PERPLEXITY_KEY,
  baseURL: 'https://api.perplexity.ai'
}) : null;

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
  const prompt = buildPrompt(request);
  const systemMessage = "You are an expert music industry copywriter specializing in Electronic Press Kits (EPKs). Create compelling, professional content for artists.";
  
  // Try OpenAI first (GPT-4o is the best for creative writing)
  if (openai && OPENAI_API_KEY) {
    try {
      console.log('[EPK AI] Trying OpenAI GPT-4o...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const generatedText = response.choices[0].message.content?.trim() || '';
      
      if (generatedText && generatedText.length >= 10) {
        console.log('[EPK AI] ✅ OpenAI success');
        return { text: generatedText, usedAI: true };
      }
    } catch (error) {
      console.error('[EPK AI] OpenAI error:', error);
    }
  }

  // Try Perplexity second (good for factual content)
  if (perplexity && PERPLEXITY_KEY) {
    try {
      console.log('[EPK AI] Trying Perplexity...');
      const response = await perplexity.chat.completions.create({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const generatedText = response.choices[0].message.content?.trim() || '';
      
      if (generatedText && generatedText.length >= 10) {
        console.log('[EPK AI] ✅ Perplexity success');
        return { text: generatedText, usedAI: true };
      }
    } catch (error) {
      console.error('[EPK AI] Perplexity error:', error);
    }
  }

  // Try Hugging Face third (for text generation models)
  if (HUGGINGFACE_KEY) {
    try {
      console.log('[EPK AI] Trying Hugging Face...');
      const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `${systemMessage}\n\n${prompt}`,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.7,
            return_full_text: false
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const generatedText = result[0]?.generated_text?.trim() || '';
        
        if (generatedText && generatedText.length >= 10) {
          console.log('[EPK AI] ✅ Hugging Face success');
          return { text: generatedText, usedAI: true };
        }
      }
    } catch (error) {
      console.error('[EPK AI] Hugging Face error:', error);
    }
  }

  console.warn('[EPK AI] All AI providers failed or unavailable, using fallback');
  return {
    text: generateFallbackText(request),
    usedAI: false
  };
}

export async function improveEPKText(text: string, tone: string = 'professional'): Promise<GenerateEPKTextResponse> {
  const toneInstructions = {
    professional: 'Make it more professional and polished for promoters and venues',
    edgy: 'Make it bold, edgy, and attention-grabbing for underground scenes',
    minimal: 'Make it concise, direct, and impactful with minimal words',
    press: 'Rewrite for press releases - newsworthy, achievement-focused, media-friendly'
  };

  const instruction = toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional;
  const systemMessage = "You are an expert music industry copywriter. Improve the following text while maintaining the core message.";
  const userPrompt = `${instruction}:\n\n${text}\n\nImproved version:`;

  // Try OpenAI first
  if (openai && OPENAI_API_KEY) {
    try {
      console.log('[EPK AI] Improving with OpenAI...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const improved = response.choices[0].message.content?.trim() || '';
      
      if (improved && improved.length >= 10) {
        console.log('[EPK AI] ✅ OpenAI improvement success');
        return { text: improved, usedAI: true };
      }
    } catch (error) {
      console.error('[EPK AI] OpenAI improvement error:', error);
    }
  }

  // Try Perplexity second
  if (perplexity && PERPLEXITY_KEY) {
    try {
      console.log('[EPK AI] Improving with Perplexity...');
      const response = await perplexity.chat.completions.create({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const improved = response.choices[0].message.content?.trim() || '';
      
      if (improved && improved.length >= 10) {
        console.log('[EPK AI] ✅ Perplexity improvement success');
        return { text: improved, usedAI: true };
      }
    } catch (error) {
      console.error('[EPK AI] Perplexity improvement error:', error);
    }
  }

  // Try Hugging Face third
  if (HUGGINGFACE_KEY) {
    try {
      console.log('[EPK AI] Improving with Hugging Face...');
      const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `${systemMessage}\n\n${userPrompt}`,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.7,
            return_full_text: false
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const improved = result[0]?.generated_text?.trim() || '';
        
        if (improved && improved.length >= 10) {
          console.log('[EPK AI] ✅ Hugging Face improvement success');
          return { text: improved, usedAI: true };
        }
      }
    } catch (error) {
      console.error('[EPK AI] Hugging Face improvement error:', error);
    }
  }

  console.warn('[EPK AI] All AI providers failed, returning original text');
  return { text: text, usedAI: false };
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
  return !!(OPENAI_API_KEY || PERPLEXITY_KEY || HUGGINGFACE_KEY);
}

export function getAvailableProviders(): string[] {
  const providers: string[] = [];
  if (OPENAI_API_KEY) providers.push('OpenAI (GPT-4o)');
  if (PERPLEXITY_KEY) providers.push('Perplexity');
  if (HUGGINGFACE_KEY) providers.push('Hugging Face');
  return providers;
}
