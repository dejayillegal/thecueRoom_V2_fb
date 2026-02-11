'use client';

export const markStart = (label: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${label}-start`);
  }
};

export const markEnd = (label: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${label}-end`);
    try {
      performance.measure(label, `${label}-start`, `${label}-end`);
    } catch (e) {
      // Ignore if start mark doesn't exist
    }
  }
};
