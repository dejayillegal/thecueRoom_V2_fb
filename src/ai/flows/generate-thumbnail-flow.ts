'use server';
/**
 * @fileOverview An AI flow for generating thumbnails for news articles.
 *
 * - generateThumbnail - A function that generates an image based on a title and summary.
 * - GenerateThumbnailInput - The input type for the generateThumbnail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateThumbnailInputSchema = z.object({
  title: z.string().describe('The title of the article.'),
  summary: z.string().describe('A short summary of the article.'),
});
export type GenerateThumbnailInput = z.infer<
  typeof GenerateThumbnailInputSchema
>;

export async function generateThumbnail(
  input: GenerateThumbnailInput
): Promise<string> {
  const {media} = await ai.generate({
    model: 'googleai/imagen-4.0-fast-generate-001',
    prompt: `Generate a visually compelling, abstract, and artistic image that represents the mood and themes of the following underground music article. Focus on textures, colors, and abstract shapes rather than literal depictions.

Article Title: ${input.title}
Article Summary: ${input.summary}

Style: Dark, moody, atmospheric, with accents of neon or electric colors. Think abstract digital art, light trails, distorted textures, or minimalist geometric patterns. Avoid text and human figures. Create something suitable for an electronic music publication. Aspect ratio should be 4:3.`,
    config: {
      aspectRatio: '4:3',
    },
  });

  if (!media.url) {
    throw new Error('Image generation failed to return a URL.');
  }

  return media.url;
}
