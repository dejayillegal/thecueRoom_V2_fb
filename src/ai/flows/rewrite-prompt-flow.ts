
'use server';
/**
 * @fileOverview An AI flow for rewriting and enhancing user prompts for cover art generation.
 *
 * - rewritePrompt - A function that takes a user's prompt and returns creative suggestions.
 * - RewritePromptInput - The input type for the function.
 * - RewritePromptOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const RewritePromptInputSchema = z.object({
  prompt: z.string().describe('The initial, user-provided prompt for the cover art.'),
});
export type RewritePromptInput = z.infer<typeof RewritePromptInputSchema>;

export const RewritePromptOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of 3 rewritten, more descriptive and evocative prompts.'),
});
export type RewritePromptOutput = z.infer<typeof RewritePromptOutputSchema>;

export async function rewritePrompt(input: RewritePromptInput): Promise<RewritePromptOutput> {
  return await rewritePromptFlow(input);
}

const rewritePromptFlow = ai.defineFlow(
  {
    name: 'rewritePromptFlow',
    inputSchema: RewritePromptInputSchema,
    outputSchema: RewritePromptOutputSchema,
  },
  async (input) => {
    
    const suggestionPrompt = ai.definePrompt({
      name: 'promptCreativeAssistant',
      input: { schema: RewritePromptInputSchema },
      output: { schema: RewritePromptOutputSchema },
      prompt: `You are a creative director and expert prompt engineer for an AI image generator specializing in underground electronic music cover art.
Your task is to take a user's basic idea and expand it into three distinct, highly descriptive, and evocative prompts.
Focus on adding details related to:
- Mood and Atmosphere (e.g., "haunting," "melancholic," "energetic," "dystopian")
- Lighting (e.g., "dramatic chiaroscuro lighting," "soft neon glow," "stark monolithic shadows")
- Composition (e.g., "centered minimalist object," "dynamic asymmetrical balance," "brutalist architecture")
- Texture and Detail (e.g., "grainy film texture," "polished chrome reflections," "concrete decay")

The user's prompt is:
"{{prompt}}"

Generate three creative variations. Return ONLY a JSON object that matches the output schema.
`,
    });

    const { output } = await suggestionPrompt(input);
    return output || { suggestions: [] };
  }
);

    