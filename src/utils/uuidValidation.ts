/**
 * Utility functions for UUID validation
 */

/**
 * Validates if a string is a valid UUID
 * @param str String to validate
 * @returns Boolean indicating if the string is a valid UUID
 */
export const isValidUUID = (str: string): boolean => {
  if (!str) return false;
  
  // UUID v4 regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
};

/**
 * Checks if the application is using mock data based on ID format
 * @param id ID to check
 * @returns Boolean indicating if the ID is from mock data
 */
export const isMockData = (id: string): boolean => {
  // Mock data typically uses simple numeric or short string IDs
  return !isValidUUID(id);
};

/**
 * Safely handles IDs that might be from mock data or real database
 * @param id ID to check and potentially convert
 * @returns A safe ID to use with Supabase (returns a valid UUID or null)
 */
export const getSafeId = (id: string): string | null => {
  if (isValidUUID(id)) {
    return id;
  }
  
  // For mock data IDs, return null to prevent Supabase errors
  console.warn('Invalid UUID detected, likely mock data:', id);
  return null;
};