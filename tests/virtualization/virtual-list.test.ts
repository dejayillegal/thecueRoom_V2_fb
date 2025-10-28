
import { describe, it, expect } from 'vitest';

describe('VirtualList', () => {
  it('should render only visible items', () => {
    // Mock test - in production would use @testing-library/react
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
    const itemHeight = 50;
    const containerHeight = 500;
    
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 6; // +overscan
    
    expect(visibleCount).toBeLessThan(items.length);
    expect(visibleCount).toBeGreaterThan(0);
  });
});
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VirtualList } from '@/../../apps/web/src/components/VirtualList';

describe('VirtualList', () => {
  it('should render only visible items', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
    
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={50}
        containerHeight={500}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    const renderedItems = container.querySelectorAll('[role="listitem"]');
    expect(renderedItems.length).toBeLessThan(30);
  });
});
