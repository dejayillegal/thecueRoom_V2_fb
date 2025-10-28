
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
