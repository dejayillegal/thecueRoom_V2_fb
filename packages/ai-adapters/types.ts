export interface ImageGenerationParams {
  prompt: string;
  width?: number;
  height?: number;
  style?: string;
  seed?: number;
}

export interface ImageGenerationResult {
  url: string;
  width: number;
  height: number;
}

export interface AIAdapter {
  generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;
  isAvailable(): boolean;
}
