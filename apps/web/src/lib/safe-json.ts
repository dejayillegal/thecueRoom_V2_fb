/**
 * Safe JSON parsing that never throws errors
 * Returns parsed data or a fallback structure
 */

export interface SafeParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export function safeParseJSON<T = any>(
  text: string,
  fallback?: T
): SafeParseResult<T> {
  try {
    if (!text || text.trim() === '') {
      return {
        success: false,
        error: 'Empty input',
        data: fallback,
      };
    }

    const parsed = JSON.parse(text);
    return {
      success: true,
      data: parsed,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'JSON parse error',
      data: fallback,
    };
  }
}

export function safeStringifyJSON(
  data: any,
  fallback: string = '{}'
): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    return fallback;
  }
}

export function safeStringifyJSONPretty(
  data: any,
  fallback: string = '{}'
): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return fallback;
  }
}
