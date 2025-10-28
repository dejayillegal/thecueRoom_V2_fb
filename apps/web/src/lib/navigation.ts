'use client';

export function safeNavigate(
  router: { push: (url: string) => void; replace: (url: string) => void },
  url: string,
  options: { replace?: boolean; scroll?: boolean } = {}
) {
  const { replace = false, scroll = true } = options;

  if (typeof window === 'undefined') return;

  if (replace) {
    router.replace(url);
  } else {
    router.push(url);
  }

  if (!scroll && typeof window !== 'undefined') {
    window.history.scrollRestoration = 'manual';
  }
}

export function preserveScroll(callback: () => void) {
  if (typeof window === 'undefined') return callback();

  const scrollPos = window.scrollY;
  callback();
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollPos);
  });
}