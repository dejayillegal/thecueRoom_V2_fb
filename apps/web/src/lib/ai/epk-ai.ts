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
      model: "gpt-4o-mini",
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
      max_tokens: 800,
      temperature: 0.7, // Add temperature for more creative output
    });

    const generatedText = response.choices[0].message.content?.trim() || '';

    if (!generatedText || generatedText.length < 10) {
      console.warn('[EPK AI] GPT-4o-mini returned empty/short content, using fallback');
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
    console.error('[EPK AI] GPT-4o-mini error:', error);
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
      model: "gpt-4o-mini",
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
      max_tokens: 800,
      temperature: 0.7, // Add temperature for more creative output
    });

    const improved = response.choices[0].message.content?.trim() || '';

    if (!improved || improved.length < 10) {
      console.warn('[EPK AI] GPT-4o-mini improvement returned empty/short content, keeping original');
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

export const TECH_RIDER_PRESETS = {
  dj_standard: {
    label: 'DJ Standard',
    content: `DJ SETUP:\n• 2x CDJ-3000 or equivalent (Pioneer CDJ-2000NXS2 acceptable)\n• DJM-900NXS2 or DJM-A9 mixer\n• 2x Monitor speakers (wedge or near-field)\n• Wireless microphone (Shure SM58 or equivalent)\n\nAUDIO:\n• Professional PA system with full-range coverage\n• Subwoofers (minimum 2x 18")\n• Stage monitoring system\n• Backup audio interface\n\nSTAGE:\n• Dedicated DJ booth/table\n• Stable power supply with surge protection\n• Good stage lighting\n• Dedicated USB ports for media\n\nOTHER:\n• Stable internet connection (for streaming if applicable)\n• Private green room with refreshments\n• Stage tech/sound engineer on-site`
  },
  live_electronic: {
    label: 'Live Electronic',
    content: `PERFORMANCE SETUP:\n• Stable DJ table/booth (minimum 4ft x 2ft)\n• Power outlets (minimum 4x grounded)\n• Good stage lighting with LED/RGB capability\n• Microphone for MC/vocal sections\n\nGEAR (Artist will provide):\n• Laptop/controller setup\n• MIDI controllers\n• Synthesizers/drum machines\n\nVENUE TO PROVIDE:\n• Professional PA system with subwoofers\n• 2x Monitor speakers (wedge style preferred)\n• XLR cables and DI boxes (minimum 4x)\n• Audio interface or mixer with USB/line inputs\n• Stage tech familiar with electronic setups\n\nOTHER:\n• Soundcheck: 30 minutes minimum\n• Green room with WiFi\n• Secure backstage area for gear`
  },
  band_full: {
    label: 'Full Band',
    content: `BACKLINE:\n• Full drum kit with cymbals\n• Bass amplifier (minimum 300W)\n• 2x Guitar amplifiers (minimum 50W each)\n• Keyboard stand and power\n\nAUDIO:\n• 16+ channel mixing console\n• Full monitor system (4+ wedges)\n• Wireless microphones (3x minimum)\n• DI boxes for keys/bass\n• Professional PA system\n\nSTAGE:\n• Stage size: minimum 20ft x 16ft\n• Good stage lighting\n• Drum riser (preferred)\n• Multiple power outlets\n\nOTHER:\n• Soundcheck: 1 hour minimum\n• Green room for full band\n• Secure storage for instruments\n• Stage tech and sound engineer on-site`
  },
  minimal: {
    label: 'Minimal/Simple',
    content: `ESSENTIAL REQUIREMENTS:\n• 2x CDJ or media players\n• Professional DJ mixer\n• Quality PA system with subs\n• 2x Monitor speakers\n• Microphone\n\nBASIC NEEDS:\n• Stable power supply\n• DJ booth/table\n• Basic stage lighting\n• USB ports\n\nOTHER:\n• Green room access\n• Water/refreshments\n• Sound check: 15-20 minutes`
  }
};

function generateFallbackText(request: GenerateEPKTextRequest): string {
  const { type, artistName, genre } = request;

  const fallbacks: Record<EPKTextType, string> = {
    bio: `${artistName} is ${genre ? `a ${genre} artist` : 'an artist'} creating innovative sounds and pushing boundaries. With a unique approach to music production and performance, ${artistName} has been building a dedicated following through compelling releases and dynamic live shows. Their sound blends creativity with technical precision, creating immersive experiences for audiences.`,

    press_quote: `"${artistName} delivers a fresh take on ${genre || 'electronic music'} with impressive skill and creativity." - Music Press\n\n"A rising talent to watch in the scene." - Industry Review`,

    tech_rider: TECH_RIDER_PRESETS.dj_standard.content,

    promo_text: `${artistName} brings high-energy ${genre || 'electronic music'} to the stage with an infectious blend of innovation and crowd-pleasing selection. Known for dynamic sets and technical prowess, ${artistName} is a must-see artist.`
  };

  return fallbacks[type];
}

export function isAIAvailable(): boolean {
  return !!OPENAI_API_KEY;
}