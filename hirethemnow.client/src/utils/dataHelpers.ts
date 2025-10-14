/**
 * Defensive programming helpers for ensuring data types are correct
 * These functions handle cases where the backend might still return JSON strings
 * instead of parsed arrays/objects, providing fallback handling to prevent crashes.
 */

/**
 * Ensures the input is an array of strings
 * Handles cases where backend returns JSON strings, null, undefined, or other types
 * @param value - The value to ensure is an array
 * @returns Array of strings, empty array if input is invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ensureArray = (value: any): string[] => {
  // If it's already an array, return it
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string');
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    // Handle empty string
    if (value.trim() === '') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
    } catch {
      // If JSON parsing fails, treat as a single string item
      console.warn('Failed to parse JSON array, treating as single string:', value);
      return [value];
    }
  }
  
  // For null, undefined, or other types, return empty array
  return [];
};

/**
 * Ensures the input is an object
 * Handles cases where backend returns JSON strings, null, undefined, or other types
 * @param value - The value to ensure is an object
 * @returns Object, empty object if input is invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ensureObject = (value: any): Record<string, any> => {
  // If it's already an object (and not null or array), return it
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    // Handle empty string
    if (value.trim() === '') {
      return {};
    }
    
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      console.warn('Failed to parse JSON object:', value);
    }
  }
  
  // For null, undefined, arrays, or other types, return empty object
  return {};
};

/**
 * Ensures section feedback is properly formatted
 * Converts from various formats to the expected SectionFeedbackItem structure
 * @param value - The section feedback value
 * @returns Properly formatted section feedback object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ensureSectionFeedback = (value: any): Record<string, { score: number; issues: string[]; suggestions: string[] }> => {
  const baseObject = ensureObject(value);
  const result: Record<string, { score: number; issues: string[]; suggestions: string[] }> = {};
  
  // Process each section in the feedback
  Object.entries(baseObject).forEach(([sectionName, sectionData]) => {
    if (typeof sectionData === 'object' && sectionData !== null) {
      result[sectionName] = {
        score: typeof sectionData.score === 'number' ? sectionData.score : 0,
        issues: ensureArray(sectionData.issues),
        suggestions: ensureArray(sectionData.suggestions)
      };
    } else {
      // If section data is not an object, create a default structure
      result[sectionName] = {
        score: 0,
        issues: [],
        suggestions: []
      };
    }
  });
  
  return result;
};

/**
 * Safely maps over an array with error handling
 * Prevents crashes when .map() is called on non-arrays
 * @param value - The value to map over
 * @param mapFn - The mapping function
 * @returns Array of mapped results, empty array if input is invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const safeMap = <T, R>(value: any, mapFn: (item: T, index: number) => R): R[] => {
  const array = ensureArray(value);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return array.map(mapFn as any);
  } catch (error) {
    console.warn('Error in safeMap:', error);
    return [];
  }
};

/**
 * Ensures a numeric value with fallback
 * @param value - The value to ensure is a number
 * @param fallback - Fallback value if input is not a number
 * @returns Number value or fallback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ensureNumber = (value: any, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return fallback;
};

/**
 * Ensures a string value with fallback
 * @param value - The value to ensure is a string
 * @param fallback - Fallback value if input is not a string
 * @returns String value or fallback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ensureString = (value: any, fallback: string = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  
  if (value !== null && value !== undefined) {
    return String(value);
  }
  
  return fallback;
};

/**
 * Ensures the input is an array of any type (not just strings)
 * Handles cases where backend returns JSON strings, null, undefined, or other types
 * @param value - The value to ensure is an array
 * @returns Array of any type, empty array if input is invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ensureArrayOfAny = (value: any): any[] => {
  // If it's already an array, return it
  if (Array.isArray(value)) {
    return value;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    // Handle empty string
    if (value.trim() === '') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If JSON parsing fails, return empty array for objects/arrays
      console.warn('Failed to parse JSON array, returning empty array:', value);
      return [];
    }
  }
  
  // For null, undefined, or other types, return empty array
  return [];
};