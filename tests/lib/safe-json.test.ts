import { describe, it, expect } from 'vitest';
import { 
  safeParseJSON, 
  safeStringifyJSON, 
  safeStringifyJSONPretty 
} from '../../apps/web/src/lib/safe-json';

describe('safeParseJSON', () => {
  it('should parse valid JSON', () => {
    const result = safeParseJSON('{"key": "value"}');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ key: 'value' });
    expect(result.error).toBeUndefined();
  });

  it('should handle invalid JSON', () => {
    const result = safeParseJSON('invalid json');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it('should handle empty string', () => {
    const result = safeParseJSON('');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Empty input');
  });

  it('should use fallback for invalid JSON', () => {
    const fallback = { default: true };
    const result = safeParseJSON('invalid', fallback);
    
    expect(result.success).toBe(false);
    expect(result.data).toEqual(fallback);
  });

  it('should parse arrays', () => {
    const result = safeParseJSON('[1, 2, 3]');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('should parse nested objects', () => {
    const complexObj = {
      user: {
        name: 'Test',
        settings: {
          theme: 'dark',
          notifications: true
        }
      }
    };
    
    const result = safeParseJSON(JSON.stringify(complexObj));
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(complexObj);
  });
});

describe('safeStringifyJSON', () => {
  it('should stringify valid objects', () => {
    const result = safeStringifyJSON({ key: 'value' });
    
    expect(result).toBe('{"key":"value"}');
  });

  it('should use fallback for circular references', () => {
    const circular: any = { a: 1 };
    circular.self = circular;
    
    const result = safeStringifyJSON(circular, '{"error": "circular"}');
    
    expect(result).toBe('{"error": "circular"}');
  });

  it('should use default fallback', () => {
    const circular: any = { a: 1 };
    circular.self = circular;
    
    const result = safeStringifyJSON(circular);
    
    expect(result).toBe('{}');
  });
});

describe('safeStringifyJSONPretty', () => {
  it('should stringify with pretty formatting', () => {
    const result = safeStringifyJSONPretty({ key: 'value', nested: { a: 1 } });
    
    expect(result).toContain('\n');
    expect(result).toContain('  ');
    expect(JSON.parse(result)).toEqual({ key: 'value', nested: { a: 1 } });
  });

  it('should use fallback for errors', () => {
    const circular: any = { a: 1 };
    circular.self = circular;
    
    const result = safeStringifyJSONPretty(circular);
    
    expect(result).toBe('{}');
  });
});
