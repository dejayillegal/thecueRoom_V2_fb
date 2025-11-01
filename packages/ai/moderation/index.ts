
import { LRUCache } from 'lru-cache';

interface ModerationResult {
  toxicity_score: number;
  flagged_terms: string[];
  decision: 'allow' | 'review' | 'reject';
  ai_confidence: number;
}

const PROFANITY_LIST = ['spam', 'scam', 'buy now', 'click here', 'www.', 'http'];
const HF_API_KEY = process.env.HF_API_KEY || '';
const MODERATION_MODEL = process.env.AI_MODERATION_MODEL || 'unitary/toxic-bert';
const THRESHOLD = parseFloat(process.env.AI_MODERATION_THRESHOLD || '0.7');

const cache = new LRUCache<string, ModerationResult>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function detectSpamPatterns(text: string): string[] {
  const flagged: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const term of PROFANITY_LIST) {
    if (lowerText.includes(term)) {
      flagged.push(term);
    }
  }
  
  // Check for excessive links
  const linkCount = (text.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    flagged.push('excessive_links');
  }
  
  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 20) {
    flagged.push('excessive_caps');
  }
  
  return flagged;
}

async function callHuggingFaceAPI(text: string): Promise<number> {
  if (!HF_API_KEY) {
    console.warn('[AI Moderation] No HF_API_KEY, using fallback');
    return 0;
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODERATION_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!response.ok) {
      console.error('[AI Moderation] HF API error:', response.status);
      return 0;
    }

    const result = await response.json();
    
    // Handle different response formats
    if (Array.isArray(result) && result[0]) {
      const toxicLabel = result[0].find((label: any) => 
        label.label?.toLowerCase().includes('toxic')
      );
      return toxicLabel?.score || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('[AI Moderation] API call failed:', error);
    return 0;
  }
}

export async function analyzeTextForToxicity(text: string): Promise<ModerationResult> {
  const textHash = hashText(text);
  
  // Check cache
  const cached = cache.get(textHash);
  if (cached) {
    return cached;
  }

  // Detect spam patterns locally
  const flaggedTerms = detectSpamPatterns(text);
  
  // Call HF API for toxicity score
  const toxicityScore = await callHuggingFaceAPI(text);
  
  // Combine scores
  const spamPenalty = flaggedTerms.length * 0.1;
  const finalScore = Math.min(1, toxicityScore + spamPenalty);
  
  let decision: 'allow' | 'review' | 'reject' = 'allow';
  if (finalScore >= 0.8) {
    decision = 'reject';
  } else if (finalScore >= THRESHOLD) {
    decision = 'review';
  }
  
  const result: ModerationResult = {
    toxicity_score: Math.round(finalScore * 100),
    flagged_terms: flaggedTerms,
    decision,
    ai_confidence: Math.round(toxicityScore * 100),
  };
  
  cache.set(textHash, result);
  
  return result;
}

export function adjustKarma(currentKarma: number, action: 'upvote' | 'reply' | 'flagged'): number {
  switch (action) {
    case 'reply':
      return currentKarma + 1;
    case 'upvote':
      return currentKarma + 5;
    case 'flagged':
      return Math.max(0, currentKarma - 5);
    default:
      return currentKarma;
  }
}
