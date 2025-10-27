'use server';
/**
 * @fileOverview An AI flow for personalizing news articles for a user.
 *
 * - personalizeNews - A function that takes articles and user interests to return a curated list.
 * - PersonalizeNewsInput - The input type for the personalizeNews function.
 * - NewsHighlight - The output type for a single news highlight.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ArticleSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  summary: z.string(),
  source: z.string(),
  tags: z.array(z.string()),
});

export const PersonalizeNewsInputSchema = z.object({
  articles: z.array(ArticleSchema).describe("A list of recent news articles to be filtered and summarized."),
  userInterests: z.array(z.string()).describe("A list of the user's interests, like genres (e.g., 'techno', 'house'), activities ('djing', 'production'), or regions ('berlin')."),
});
export type PersonalizeNewsInput = z.infer<typeof PersonalizeNewsInputSchema>;

export const NewsHighlightSchema = z.object({
  title: z.string().describe("The original title of the article."),
  url: z.string().url().describe("The original URL of the article."),
  reason: z.string().describe("A very short, one-sentence explanation of why this article is relevant to the user, written in a friendly and casual tone."),
});
export type NewsHighlight = z.infer<typeof NewsHighlightSchema>;

const PersonalizeNewsOutputSchema = z.array(NewsHighlightSchema);


export async function personalizeNews(input: PersonalizeNewsInput): Promise<NewsHighlight[]> {
  return await personalizeNewsFlow(input);
}


const personalizeNewsFlow = ai.defineFlow(
  {
    name: 'personalizeNewsFlow',
    inputSchema: PersonalizeNewsInputSchema,
    outputSchema: PersonalizeNewsOutputSchema,
  },
  async (input) => {
    
    const newsPrompt = ai.definePrompt({
      name: 'newsCuratorPrompt',
      input: { schema: PersonalizeNewsInputSchema },
      output: { schema: PersonalizeNewsOutputSchema },
      prompt: `You are an expert news curator for "thecueRoom," an online community for underground electronic music producers and DJs. Your task is to select the 5 most relevant articles for a user from a provided list, based on their interests.

User's Interests:
- {{#each userInterests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Here is the list of recent articles. Analyze their titles, summaries, and tags to determine relevance.
---
{{#each articles}}
[Article]
Title: {{{title}}}
Summary: {{{summary}}}
URL: {{{url}}}
Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
---
{{/each}}

From the list above, pick the 5 most interesting articles for the user. For each selected article, provide the original title, the URL, and a short, one-sentence 'reason' explaining why it's a good match for their interests. For example: "This is relevant because you're into techno and this covers a new festival in Berlin."

Return ONLY a JSON array of 5 objects matching the output schema. Do not include any articles that are not highly relevant.
`,
    });

    const { output } = await newsPrompt(input);
    return output || [];
  }
);
