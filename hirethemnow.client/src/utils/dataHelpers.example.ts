/**
 * Example usage of defensive programming helpers
 * This file demonstrates how the helpers handle various edge cases
 * that could occur when the backend returns JSON strings instead of parsed data
 */

import { ensureArray, ensureSectionFeedback, ensureNumber } from './dataHelpers';

// Example: Backend returns JSON string instead of array
const backendStrengthsAsString = '["Strong technical skills", "Clear formatting", "Good experience"]';
const safeStrengths = ensureArray(backendStrengthsAsString);
console.log('Parsed strengths:', safeStrengths);
// Output: ["Strong technical skills", "Clear formatting", "Good experience"]

// Example: Backend returns null or undefined
const nullStrengths = ensureArray(null);
console.log('Null strengths:', nullStrengths);
// Output: []

// Example: Backend returns invalid JSON
const invalidJsonStrengths = ensureArray('invalid json string');
console.log('Invalid JSON strengths:', invalidJsonStrengths);
// Output: ["invalid json string"] (treated as single item)

// Example: Backend returns sectionFeedback as JSON string
const backendSectionFeedbackAsString = '{"personalInfo":{"score":90,"issues":[],"suggestions":["Add LinkedIn URL"]},"experience":{"score":85,"issues":["Missing quantifiable achievements"],"suggestions":["Add specific metrics"]}}';
const safeSectionFeedback = ensureSectionFeedback(backendSectionFeedbackAsString);
console.log('Parsed section feedback:', safeSectionFeedback);
// Output: Properly structured object with arrays and numbers

// Example: Backend returns score as string
const backendScoreAsString = "85";
const safeScore = ensureNumber(backendScoreAsString);
console.log('Parsed score:', safeScore);
// Output: 85 (number)

// Example: Backend returns invalid score
const invalidScore = ensureNumber("not a number", 0);
console.log('Invalid score with fallback:', invalidScore);
// Output: 0

// Example usage in a component (pseudo-code):
/*
const MyComponent = ({ analysisData }) => {
  // Before defensive programming (could crash):
  // const strengths = analysisData.strengths; // Could be string, null, or undefined
  // return strengths.map(strength => <li>{strength}</li>); // ERROR: strengths.map is not a function
  
  // After defensive programming (safe):
  const safeStrengths = ensureArray(analysisData.strengths);
  return safeStrengths.map(strength => <li key={strength}>{strength}</li>); // Always works
};
*/

export {
  // Export examples for documentation purposes
  backendStrengthsAsString,
  safeStrengths,
  nullStrengths,
  invalidJsonStrengths,
  safeSectionFeedback,
  safeScore,
  invalidScore
};