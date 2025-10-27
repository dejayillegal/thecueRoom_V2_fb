import OpenAI from 'openai';
import type { AIAdapter, ImageGenerationParams, ImageGenerationResult } from './types';

export class OpenAIAdapter implements AIAdapter {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: params.prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    return {
      url: imageUrl,
      width: 1024,
      height: 1024,
    };
  }
}
