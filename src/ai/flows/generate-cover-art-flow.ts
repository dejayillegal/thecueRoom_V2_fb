
'use server';
/**
 * @fileOverview An AI flow for generating cover art.
 *
 * - generateCoverArt - A function that generates 4 images based on a detailed prompt.
 * - GenerateCoverArtInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCoverArtInputSchema = z.object({
  prompt: z.string().describe('The user-provided description of the artwork idea.'),
  subgenre: z.string().describe('The musical subgenre, e.g., Techno, House, Ambient.'),
  style: z.string().describe('The desired artistic style, e.g., Underground Poster, Vinyl Cover, Minimal.'),
  aspect: z.string().describe('The aspect ratio, e.g., "1:1", "4:5", "16:9".'),
  modifiers: z.array(z.string()).describe('A list of additional modifiers like "high contrast" or "grainy texture".'),
});
export type GenerateCoverArtInput = z.infer<typeof GenerateCoverArtInputSchema>;

export async function generateCoverArt(input: GenerateCoverArtInput): Promise<string[]> {
  const fullPrompt = `
    Generate a visually compelling, artistic image for a music release cover.
    The core idea is: "${input.prompt}".
    Music Subgenre: ${input.subgenre}.
    Artistic Style: ${input.style}.
    The overall mood should be tailored for an underground electronic music audience.
    Incorporate the following modifiers: ${input.modifiers.join(', ')}.
    Do NOT include any text, logos, or typography unless explicitly asked for in the core idea.
    The final image should be abstract and atmospheric. Aspect ratio: ${input.aspect}.
    `;

  const imageUrls: string[] = [];
  // Generate images sequentially to avoid rate-limiting on free tiers.
  for (let i = 0; i < 4; i++) {
    try {
      const result = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: fullPrompt,
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      const media = result.media;
      if (media?.url) {
        imageUrls.push(media.url);
      } else {
        // In a real scenario, you might push a placeholder URL here.
        console.error(`Image generation failed for image ${i + 1} - no URL returned.`);
      }
    } catch (error) {
       console.error(`Error during image generation for image ${i + 1}:`, error);
       // Push a placeholder or handle the error as needed.
    }
  }

  if (imageUrls.length === 0) {
      throw new Error('Image generation failed to return any URLs.');
  }

  return imageUrls;
}
