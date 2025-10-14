import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  ensureArray, 
  ensureObject, 
  ensureSectionFeedback, 
  safeMap, 
  ensureNumber, 
  ensureString,
  ensureArrayOfAny
} from './dataHelpers';

// Mock console.warn to avoid noise in test output
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('dataHelpers', () => {
  describe('ensureArray', () => {
    it('should return array as-is when input is already an array', () => {
      const input = ['item1', 'item2', 'item3'];
      const result = ensureArray(input);
      
      expect(result).toEqual(['item1', 'item2', 'item3']);
      // Note: ensureArray filters the array, so it returns a new array with only strings
    });

    it('should filter out non-string items from arrays', () => {
      const input = ['item1', 123, 'item2', null, 'item3', undefined];
      const result = ensureArray(input);
      
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should parse valid JSON string arrays', () => {
      const input = '["strength1", "strength2", "strength3"]';
      const result = ensureArray(input);
      
      expect(result).toEqual(['strength1', 'strength2', 'strength3']);
    });

    it('should return empty array for empty JSON array string', () => {
      const input = '[]';
      const result = ensureArray(input);
      
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const input = '';
      const result = ensureArray(input);
      
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace string', () => {
      const input = '   ';
      const result = ensureArray(input);
      
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON by treating as single string item', () => {
      const input = 'invalid json string';
      const result = ensureArray(input);
      
      expect(result).toEqual(['invalid json string']);
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to parse JSON array, treating as single string:', 
        'invalid json string'
      );
    });

    it('should handle malformed JSON by treating as single string item', () => {
      const input = '["item1", "item2"'; // Missing closing bracket
      const result = ensureArray(input);
      
      expect(result).toEqual(['["item1", "item2"']);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return empty array for null input', () => {
      const result = ensureArray(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      const result = ensureArray(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for number input', () => {
      const result = ensureArray(123);
      expect(result).toEqual([]);
    });

    it('should return empty array for object input', () => {
      const result = ensureArray({ key: 'value' });
      expect(result).toEqual([]);
    });
  });

  describe('ensureObject', () => {
    it('should return object as-is when input is already an object', () => {
      const input = { key1: 'value1', key2: 'value2' };
      const result = ensureObject(input);
      
      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
      expect(result).toBe(input); // Should be the same reference
    });

    it('should parse valid JSON string objects', () => {
      const input = '{"personalInfo": {"score": 90}, "experience": {"score": 85}}';
      const result = ensureObject(input);
      
      expect(result).toEqual({
        personalInfo: { score: 90 },
        experience: { score: 85 }
      });
    });

    it('should return empty object for empty JSON object string', () => {
      const input = '{}';
      const result = ensureObject(input);
      
      expect(result).toEqual({});
    });

    it('should return empty object for empty string', () => {
      const input = '';
      const result = ensureObject(input);
      
      expect(result).toEqual({});
    });

    it('should return empty object for whitespace string', () => {
      const input = '   ';
      const result = ensureObject(input);
      
      expect(result).toEqual({});
    });

    it('should handle invalid JSON by returning empty object', () => {
      const input = 'invalid json string';
      const result = ensureObject(input);
      
      expect(result).toEqual({});
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to parse JSON object:', 
        'invalid json string'
      );
    });

    it('should handle malformed JSON by returning empty object', () => {
      const input = '{"key1": "value1", "key2":'; // Missing value and closing brace
      const result = ensureObject(input);
      
      expect(result).toEqual({});
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return empty object for null input', () => {
      const result = ensureObject(null);
      expect(result).toEqual({});
    });

    it('should return empty object for undefined input', () => {
      const result = ensureObject(undefined);
      expect(result).toEqual({});
    });

    it('should return empty object for array input', () => {
      const result = ensureObject(['item1', 'item2']);
      expect(result).toEqual({});
    });

    it('should return empty object for number input', () => {
      const result = ensureObject(123);
      expect(result).toEqual({});
    });

    it('should return empty object for string that parses to array', () => {
      const input = '["item1", "item2"]';
      const result = ensureObject(input);
      
      expect(result).toEqual({});
    });
  });

  describe('ensureSectionFeedback', () => {
    it('should process valid section feedback object', () => {
      const input = {
        personalInfo: {
          score: 95,
          issues: ['Issue 1'],
          suggestions: ['Suggestion 1', 'Suggestion 2']
        },
        experience: {
          score: 85,
          issues: [],
          suggestions: ['Add metrics']
        }
      };

      const result = ensureSectionFeedback(input);

      expect(result).toEqual({
        personalInfo: {
          score: 95,
          issues: ['Issue 1'],
          suggestions: ['Suggestion 1', 'Suggestion 2']
        },
        experience: {
          score: 85,
          issues: [],
          suggestions: ['Add metrics']
        }
      });
    });

    it('should handle section data with missing properties', () => {
      const input = {
        personalInfo: {
          score: 95
          // Missing issues and suggestions
        },
        experience: {
          issues: ['Issue 1']
          // Missing score and suggestions
        }
      };

      const result = ensureSectionFeedback(input);

      expect(result).toEqual({
        personalInfo: {
          score: 95,
          issues: [],
          suggestions: []
        },
        experience: {
          score: 0,
          issues: ['Issue 1'],
          suggestions: []
        }
      });
    });

    it('should handle section data that is not an object', () => {
      const input = {
        personalInfo: 'not an object',
        experience: 123,
        skills: null
      };

      const result = ensureSectionFeedback(input);

      expect(result).toEqual({
        personalInfo: {
          score: 0,
          issues: [],
          suggestions: []
        },
        experience: {
          score: 0,
          issues: [],
          suggestions: []
        },
        skills: {
          score: 0,
          issues: [],
          suggestions: []
        }
      });
    });

    it('should parse JSON string section feedback', () => {
      const input = '{"personalInfo": {"score": 90, "issues": ["Issue 1"], "suggestions": ["Suggestion 1"]}}';
      const result = ensureSectionFeedback(input);

      expect(result).toEqual({
        personalInfo: {
          score: 90,
          issues: ['Issue 1'],
          suggestions: ['Suggestion 1']
        }
      });
    });

    it('should handle invalid JSON string', () => {
      const input = 'invalid json';
      const result = ensureSectionFeedback(input);

      expect(result).toEqual({});
    });
  });

  describe('safeMap', () => {
    it('should map over valid array', () => {
      const input = ['item1', 'item2', 'item3'];
      const result = safeMap(input, (item, index) => `${item}-${index}`);

      expect(result).toEqual(['item1-0', 'item2-1', 'item3-2']);
    });

    it('should handle non-array input by converting to array first', () => {
      const input = '["item1", "item2"]';
      const result = safeMap(input, (item: string) => item.toUpperCase());

      expect(result).toEqual(['ITEM1', 'ITEM2']);
    });

    it('should return empty array for invalid input', () => {
      const input = null;
      const result = safeMap(input, (item) => item);

      expect(result).toEqual([]);
    });

    it('should handle mapping function errors', () => {
      const input = ['item1', 'item2'];
      const result = safeMap(input, () => {
        throw new Error('Mapping error');
      });

      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('Error in safeMap:', expect.any(Error));
    });
  });

  describe('ensureNumber', () => {
    it('should return number as-is when input is already a number', () => {
      expect(ensureNumber(42)).toBe(42);
      expect(ensureNumber(0)).toBe(0);
      expect(ensureNumber(-10)).toBe(-10);
      expect(ensureNumber(3.14)).toBe(3.14);
    });

    it('should parse valid number strings', () => {
      expect(ensureNumber('42')).toBe(42);
      expect(ensureNumber('3.14')).toBe(3.14);
      expect(ensureNumber('-10')).toBe(-10);
    });

    it('should return fallback for invalid number strings', () => {
      expect(ensureNumber('not a number')).toBe(0);
      expect(ensureNumber('not a number', 99)).toBe(99);
    });

    it('should return fallback for NaN', () => {
      expect(ensureNumber(NaN)).toBe(0);
      expect(ensureNumber(NaN, 42)).toBe(42);
    });

    it('should return fallback for null and undefined', () => {
      expect(ensureNumber(null)).toBe(0);
      expect(ensureNumber(undefined)).toBe(0);
      expect(ensureNumber(null, 100)).toBe(100);
    });

    it('should return fallback for other types', () => {
      expect(ensureNumber({})).toBe(0);
      expect(ensureNumber([])).toBe(0);
      expect(ensureNumber(true)).toBe(0);
    });
  });

  describe('ensureString', () => {
    it('should return string as-is when input is already a string', () => {
      expect(ensureString('hello')).toBe('hello');
      expect(ensureString('')).toBe('');
    });

    it('should convert numbers to strings', () => {
      expect(ensureString(42)).toBe('42');
      expect(ensureString(3.14)).toBe('3.14');
    });

    it('should convert booleans to strings', () => {
      expect(ensureString(true)).toBe('true');
      expect(ensureString(false)).toBe('false');
    });

    it('should return fallback for null and undefined', () => {
      expect(ensureString(null)).toBe('');
      expect(ensureString(undefined)).toBe('');
      expect(ensureString(null, 'default')).toBe('default');
    });

    it('should convert objects to strings', () => {
      expect(ensureString({})).toBe('[object Object]');
      expect(ensureString([])).toBe('');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle backend response with mixed valid and invalid JSON', () => {
      const backendResponse = {
        strengths: '["Valid strength"]', // Valid JSON
        weaknesses: 'invalid json', // Invalid JSON
        recommendations: null, // Null
        keywordsFound: [], // Already array
        keywordsMissing: '   ', // Whitespace
        sectionFeedback: '{"personalInfo": {"score": 90}}' // Valid JSON object
      };

      const processedData = {
        strengths: ensureArray(backendResponse.strengths),
        weaknesses: ensureArray(backendResponse.weaknesses),
        recommendations: ensureArray(backendResponse.recommendations),
        keywordsFound: ensureArray(backendResponse.keywordsFound),
        keywordsMissing: ensureArray(backendResponse.keywordsMissing),
        sectionFeedback: ensureObject(backendResponse.sectionFeedback)
      };

      expect(processedData.strengths).toEqual(['Valid strength']);
      expect(processedData.weaknesses).toEqual(['invalid json']); // Treated as single string
      expect(processedData.recommendations).toEqual([]);
      expect(processedData.keywordsFound).toEqual([]);
      expect(processedData.keywordsMissing).toEqual([]);
      expect(processedData.sectionFeedback).toEqual({ personalInfo: { score: 90 } });
    });

    it('should prevent JavaScript errors when using array methods', () => {
      const problematicData = {
        strengths: 'not an array', // This would cause .map() to fail
        weaknesses: null,
        recommendations: undefined
      };

      // This should not throw errors
      expect(() => {
        const strengths = ensureArray(problematicData.strengths);
        const strengthsList = strengths.map(strength => `• ${strength}`);
        
        const weaknesses = ensureArray(problematicData.weaknesses);
        const weaknessCount = weaknesses.length;
        
        const recommendations = ensureArray(problematicData.recommendations);
        const hasRecommendations = recommendations.some(rec => rec.length > 0);
        
        // These operations should all work without errors
        expect(strengthsList).toEqual(['• not an array']);
        expect(weaknessCount).toBe(0);
        expect(hasRecommendations).toBe(false);
      }).not.toThrow();
    });
  });
});

  describe('ensureArrayOfAny', () => {
    it('should return array as-is when input is already an array', () => {
      const input = [{ name: 'John' }, { name: 'Jane' }];
      const result = ensureArrayOfAny(input);
      expect(result).toEqual(input);
      expect(result).toBe(input); // Should be the same reference
    });

    it('should parse valid JSON string arrays of objects', () => {
      const input = '[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]';
      const result = ensureArrayOfAny(input);
      expect(result).toEqual([{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }]);
    });

    it('should return empty array for empty JSON array string', () => {
      const result = ensureArrayOfAny('[]');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = ensureArrayOfAny('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace string', () => {
      const result = ensureArrayOfAny('   ');
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON by returning empty array', () => {
      const result = ensureArrayOfAny('invalid json');
      expect(result).toEqual([]);
    });

    it('should handle malformed JSON by returning empty array', () => {
      const result = ensureArrayOfAny('[{"name": "John",}]'); // Invalid trailing comma
      expect(result).toEqual([]);
    });

    it('should return empty array for null input', () => {
      const result = ensureArrayOfAny(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      const result = ensureArrayOfAny(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for number input', () => {
      const result = ensureArrayOfAny(123);
      expect(result).toEqual([]);
    });

    it('should return empty array for object input', () => {
      const result = ensureArrayOfAny({ name: 'John' });
      expect(result).toEqual([]);
    });

    it('should return empty array for string that parses to object', () => {
      const result = ensureArrayOfAny('{"name": "John"}');
      expect(result).toEqual([]);
    });
  });

  describe('Additional real-world scenarios', () => {
    it('should handle parsed resume content with mixed data types', () => {
      const backendResponse = {
        experience: '[{"title": "Developer", "company": "Tech Corp"}]',
        education: null,
        skills: { technical: '["JavaScript", "React"]' }
      };

      // These should not throw errors
      expect(() => {
        const experience = ensureArrayOfAny(backendResponse.experience);
        experience.map(exp => exp.title);
      }).not.toThrow();

      expect(() => {
        const education = ensureArrayOfAny(backendResponse.education);
        education.forEach(edu => console.log(edu));
      }).not.toThrow();

      expect(() => {
        const technicalSkills = ensureArray(backendResponse.skills.technical);
        technicalSkills.join(', ');
      }).not.toThrow();
    });
  });