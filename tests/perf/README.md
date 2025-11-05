
# Performance Tests

Lighthouse CI and WebPageTest configurations for performance monitoring.

## Metrics

- TTFB (Time to First Byte)
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- CLS (Cumulative Layout Shift)
- TBT (Total Blocking Time)

## Thresholds

- Performance score > 80
- Accessibility score > 90
- Best practices > 90
- SEO > 90

## Running Tests

```bash
pnpm test:perf
```
