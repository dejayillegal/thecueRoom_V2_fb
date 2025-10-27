import { createCanvas } from 'canvas';
import type { AIAdapter, ImageGenerationParams, ImageGenerationResult } from './types';

export class LocalFallbackAdapter implements AIAdapter {
  isAvailable(): boolean {
    return true;
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const width = params.width || 1024;
    const height = params.height || 1024;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const seed = params.seed || this.hashCode(params.prompt);
    const random = this.seededRandom(seed);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    const hue1 = random() * 360;
    const hue2 = (hue1 + 60 + random() * 120) % 360;
    gradient.addColorStop(0, `hsl(${hue1}, 70%, 50%)`);
    gradient.addColorStop(1, `hsl(${hue2}, 70%, 30%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const shapes = 5 + Math.floor(random() * 10);
    for (let i = 0; i < shapes; i++) {
      const x = random() * width;
      const y = random() * height;
      const radius = 20 + random() * 100;
      const hue = random() * 360;
      const alpha = 0.3 + random() * 0.4;

      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = `${Math.floor(width / 20)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const words = params.prompt.split(' ').slice(0, 3);
    words.forEach((word, i) => {
      ctx.fillText(word, width / 2, height / 2 + (i - 1) * 40);
    });

    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return {
      url: dataUrl,
      width,
      height,
    };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }
}
