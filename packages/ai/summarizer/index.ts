
import { LRUCache } from 'lru-cache';

const HF_API_KEY = process.env.HF_API_KEY || '';
const SUMMARY_MODEL = process.env.AI_SUMMARY_MODEL || 'facebook/bart-large-cnn';

const cache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

function extractiveSummary(text: string, maxSentences: number = 3): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length <= maxSentences) {
    return text;
  }
  
  // Simple TF-IDF-like approach: prioritize sentences with unique words
  const wordFreq = new Map<string, number>();
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  for (const word of words) {
    if (word.length > 3) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }
  
  const sentenceScores = sentences.map(sentence => {
    const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    const score = sentenceWords.reduce((sum, word) => {
      return sum + (wordFreq.get(word) || 0);
    }, 0);
    return { sentence, score };
  });
  
  sentenceScores.sort((a, b) => b.score - a.score);
  
  return sentenceScores
    .slice(0, maxSentences)
    .map(s => s.sentence.trim())
    .join(' ');
}

export async function summarizeThread(threadText: string): Promise<string> {
  const cacheKey = threadText.slice(0, 100);
  
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fallback to extractive summary if no API key
  if (!HF_API_KEY) {
    const summary = extractiveSummary(threadText);
    cache.set(cacheKey, summary);
    return summary;
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${SUMMARY_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: threadText.slice(0, 1000),
          parameters: {
            max_length: 130,
            min_length: 30,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }

    const result = await response.json();
    const summary = result[0]?.summary_text || extractiveSummary(threadText);
    
    cache.set(cacheKey, summary);
    return summary;
  } catch (error) {
    console.error('[AI Summarizer] API call failed:', error);
    const fallback = extractiveSummary(threadText);
    cache.set(cacheKey, fallback);
    return fallback;
  }
}

export async function generateWeeklyDigest(threads: Array<{ title: string; body: string; replies: number }>): Promise<string> {
  const topThreads = threads
    .sort((a, b) => b.replies - a.replies)
    .slice(0, 5);
  
  const digestText = `This week in thecueRoom: ${topThreads.map(t => t.title).join(', ')}. ` +
    `Top discussions covered ${topThreads.map(t => t.body.slice(0, 50)).join('; ')}.`;
  
  return summarizeThread(digestText);
}
