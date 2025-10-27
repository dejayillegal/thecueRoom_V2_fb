'use server';
/**
 * @fileOverview An AI flow for verifying an artist's social media presence.
 *
 * - verifyArtist - A function that scrapes a social media URL and determines if it belongs to the user.
 * - VerifyArtistInput - The input type for the verifyArtist function.
 * - VerificationResult - The output type for the verifyArtist function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as cheerio from 'cheerio';

const VerifyArtistInputSchema = z.object({
  userId: z.string().describe('The unique ID of the user requesting verification.'),
  displayName: z.string().describe("The user's display name or artist name."),
  socialUrl: z.string().url().describe('The URL of the social media profile to verify.'),
});
export type VerifyArtistInput = z.infer<typeof VerifyArtistInputSchema>;

const VerificationResultSchema = z.object({
  isVerified: z.boolean().describe('Whether the social media profile is considered a match for the user.'),
  confidence: z.number().min(0).max(1).describe('The confidence score of the verification (0 to 1).'),
  reason: z.string().describe('The reasoning behind the verification decision.'),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

async function scrapeContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    // Extract text content from common tags, up to a certain limit
    return ($('h1, h2, title, p, a, meta[property="og:title"], meta[property="og:description"]').text() || '').substring(0, 4000);
  } catch (error: any) {
    console.error(`Scraping failed for ${url}:`, error);
    return `Error scraping page: ${error.message}`;
  }
}


export async function verifyArtist(input: VerifyArtistInput): Promise<VerificationResult> {
  return verifyArtistFlow(input);
}


const verifyArtistFlow = ai.defineFlow(
  {
    name: 'verifyArtistFlow',
    inputSchema: VerifyArtistInputSchema,
    outputSchema: VerificationResultSchema,
  },
  async (input) => {
    const scrapedText = await scrapeContent(input.socialUrl);

    const verificationPrompt = ai.definePrompt({
        name: 'verificationPrompt',
        input: {
            schema: z.object({
                displayName: z.string(),
                socialUrl: z.string(),
                scrapedText: z.string(),
            }),
        },
        output: { schema: VerificationResultSchema },
        prompt: `You are an expert system for verifying artist identities for a music platform called thecueRoom.
        Your task is to determine if a social media profile belongs to the artist based on their display name and the content of the provided URL.

        Artist Display Name: {{{displayName}}}
        Social Media URL: {{{socialUrl}}}

        Scraped Content from URL:
        ---
        {{{scrapedText}}}
        ---

        Analyze the scraped content. Does it contain the artist's name? Does the content (bio, posts, titles) seem related to a musician, DJ, or producer?
        - If the name is present and the context is clearly music-related (e.g., links to tracks, DJ mixes, event dates), confidence should be high (>= 0.8).
        - If the name is present but the context is ambiguous, confidence should be medium (0.5-0.7).
        - If the name is not found or the content is completely unrelated, confidence should be low (< 0.5).

        Based on your analysis, set 'isVerified' to true if confidence is 0.5 or higher, and provide a brief 'reason' for your decision.`,
    });

    const { output } = await verificationPrompt({
        displayName: input.displayName,
        socialUrl: input.socialUrl,
        scrapedText,
    });

    return output!;
  }
);
