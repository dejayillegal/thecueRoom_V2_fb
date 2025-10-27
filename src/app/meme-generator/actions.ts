
'use server';
/**
 * @fileOverview Server actions for the meme generator.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMemeInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The source image for the meme, as a data URI."
    ),
  prompt: z.string().describe('A text prompt describing the meme concept.'),
});
export type GenerateMemeInput = z.infer<typeof GenerateMemeInputSchema>;

export async function generateMeme(
  input: GenerateMemeInput
): Promise<string> {
  const {media} = await ai.generate({
    model: 'googleai/gemini-2.5-flash-image-preview',
    prompt: [
      {
        media: {url: input.imageDataUri},
      },
      {
        text: `You are a meme generator. Add large, bold, white text with a black outline (impact font style) to this image to make it a meme based on the following prompt: "${input.prompt}". The text should be placed at the top or bottom of the image, or both, as is typical for memes. Ensure the text is easily readable against the image background. The final output should be a single image. Do not add any other elements or change the original image in any other way.`
      },
    ],
    config: {
      responseModalities: ['IMAGE'],
    },
  });

  if (!media?.url) {
    throw new Error('Meme generation failed to return an image.');
  }

  return media.url;
}
