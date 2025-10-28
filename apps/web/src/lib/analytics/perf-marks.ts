export function mark(name: string): void {
 if (typeof performance === 'undefined') return;
 try {
 performance.mark(name);
  } catch (e) {
 console.warn('Performance mark failed:', e);
  }
}

export function measure(name: string, startMark: string, endMark?: string): void {
 if (typeof performance === 'undefined') return;
 try {
 if (endMark) {
 performance.measure(name, startMark, endMark);
    } else {
 performance.measure(name, startMark);
    }
  } catch (e) {
 console.warn('Performance measure failed:', e);
  }
}

export function clearMarks(name?: string): void {
 if (typeof performance === 'undefined') return;
 try {
 performance.clearMarks(name);
  } catch (e) {
 console.warn('Performance clear failed:', e);
  }
}

export function getEntries(type?: string): PerformanceEntryList {
 if (typeof performance === 'undefined') return [];
 return performance.getEntriesByType(type || 'measure');
}
export function markStart(name: string) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${name}-start`);
  }
}

export function markEnd(name: string) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${name}-end`);
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name)[0];
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`[Perf] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Ignore measurement errors
    }
  }
}

export function clearMarks(name?: string): void {
  if (typeof window !== 'undefined' && window.performance) {
    if (name) {
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}