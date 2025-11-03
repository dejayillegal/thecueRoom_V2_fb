
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { aiSuggestSchema } from '@thecueroom/shared/forumSchemas';
import { getSession } from '@/lib/auth';

const HF_API_KEY = process.env.HF_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = aiSuggestSchema.parse(body);

    if (!HF_API_KEY) {
      // Fallback: simple template-based suggestions
      const suggestions: any = {};
      
      if (data.applyTo.includes('title')) {
        suggestions.title = data.prompt.slice(0, 100);
      }
      
      if (data.applyTo.includes('body')) {
        suggestions.body = `Based on your prompt: "${data.prompt}"\n\nThis is a template response. For AI-generated content, please configure HF_API_KEY.`;
      }
      
      if (data.applyTo.includes('tags')) {
        suggestions.tags = ['discussion', 'question'];
      }

      return NextResponse.json({ ok: true, suggestions });
    }

    // Call AI for suggestions
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: data.prompt,
          parameters: {
            max_length: data.tone === 'concise' ? 100 : 200,
            min_length: 30,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const result = await response.json();
    const aiText = result[0]?.summary_text || data.prompt;

    const suggestions: any = {};

    if (data.applyTo.includes('title')) {
      suggestions.title = aiText.split('.')[0].slice(0, 100);
    }

    if (data.applyTo.includes('body')) {
      suggestions.body = aiText;
    }

    if (data.applyTo.includes('tags')) {
      // Extract potential tags from prompt
      const words = data.prompt.toLowerCase().split(' ');
      suggestions.tags = words
        .filter(w => w.length > 4 && !['about', 'what', 'where', 'when'].includes(w))
        .slice(0, 5);
    }

    return NextResponse.json({ ok: true, suggestions });
  } catch (error) {
    console.error('AI suggest error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
