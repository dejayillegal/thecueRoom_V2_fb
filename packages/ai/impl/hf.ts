import fetch from 'cross-fetch';

export interface HFGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export interface HFGenerationResult {
  success: boolean;
  imageBuffer?: Buffer;
  error?: string;
}

export async function generateWithHuggingFace(
  options: HFGenerationOptions,
  token: string
): Promise<HFGenerationResult> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: options.prompt,
          parameters: {
            negative_prompt: options.negativePrompt || 'blurry, low quality, distorted',
            width: options.width || 1024,
            height: options.height || 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HF API error: ${response.status} - ${errorText}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    return {
      success: true,
      imageBuffer,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
