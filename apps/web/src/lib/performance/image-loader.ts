export class OptimizedImageLoader {
  private static instance: OptimizedImageLoader | undefined;
  private cache: Map<string, string> = new Map();
  private loadingQueue: Map<string, Promise<string>> = new Map();
  private observer?: IntersectionObserver;

  static getInstance(): OptimizedImageLoader {
    if (!OptimizedImageLoader.instance) {
      OptimizedImageLoader.instance = new OptimizedImageLoader();
    }
    return OptimizedImageLoader.instance;
  }

  constructor() {
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              if (src) {
                this.loadImage(src).then((loadedSrc) => {
                  img.src = loadedSrc;
                  img.removeAttribute("data-src");
                  this.observer?.unobserve(img);
                });
              }
            }
          });
        },
        {
          rootMargin: "50px",
          threshold: 0.01,
        },
      );
    }
  }

  async loadImage(url: string): Promise<string> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    if (this.loadingQueue.has(url)) {
      return this.loadingQueue.get(url)!;
    }

    const loadPromise = new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, url);
        this.loadingQueue.delete(url);
        resolve(url);
      };
      img.onerror = () => {
        this.loadingQueue.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });

    this.loadingQueue.set(url, loadPromise);
    return loadPromise;
  }

  observeImage(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.observe(img);
    }
  }

  clearCache() {
    this.cache.clear();
    this.loadingQueue.clear();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.clearCache();
  }
}

export function preloadImages(urls: string[]): Promise<void[]> {
  const loader = OptimizedImageLoader.getInstance();
  return Promise.all(urls.map((url) => loader.loadImage(url).catch(() => {})));
}
