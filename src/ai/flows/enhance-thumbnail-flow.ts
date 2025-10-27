'use server';
/**
 * @fileOverview An AI flow for enhancing the quality of news article thumbnails.
 *
 * - enhanceThumbnail - A function that takes an image data URI and enhances it.
 * - EnhanceThumbnailInput - The input type for the enhanceThumbnail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceThumbnailInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A low-quality image of a news article thumbnail, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhanceThumbnailInput = z.infer<
  typeof EnhanceThumbnailInputSchema
>;

export async function enhanceThumbnail(
  input: EnhanceThumbnailInput
): Promise<string> {
  const {media} = await ai.generate({
    model: 'googleai/gemini-2.5-flash-image-preview',
    prompt: [
      {
        media: {url: input.imageDataUri},
      },
      {
        text: 'Enhance this image by increasing its resolution, clarity, and detail. Make it visually striking and suitable for a news feed. Fix any compression artifacts. The subject is likely related to music or culture.',
      },
    ],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  if (!media?.url) {
    throw new Error('Image enhancement failed to return a URL.');
  }

  return media.url;
}
