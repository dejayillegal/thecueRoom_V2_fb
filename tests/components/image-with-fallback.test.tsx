import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ImageWithFallback } from '@/../../apps/web/src/components/ImageWithFallback';

describe('ImageWithFallback', () => {
  it('should use fallback on error', async () => {
    const { container } = render(
      <ImageWithFallback
        src="https://invalid-url.test/image.jpg"
        alt="Test"
        fallbackSrc="/fallback-thumbnail.png"
        width={100}
        height={100}
      />
    );

    const img = container.querySelector('img');
    expect(img).toBeTruthy();

    if (img) {
      fireEvent.error(img);
      await waitFor(() => {
        expect(img.src).toContain('fallback-thumbnail.png');
      });
    }
  });
});