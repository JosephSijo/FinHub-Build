/**
 * Utility functions for number formatting with commas
 */

/**
 * Format a number with commas (e.g., 1000000 -> 1,000,000)
 */
export function formatNumberWithCommas(value: string | number): string {
  if (!value && value !== 0) return '';
  
  // Convert to string and remove any existing commas
  const stringValue = value.toString().replace(/,/g, '');
  
  // Split into integer and decimal parts
  const parts = stringValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Combine with decimal part if exists
  return decimalPart !== undefined 
    ? `${formattedInteger}.${decimalPart}` 
    : formattedInteger;
}

/**
 * Remove commas from a formatted number string (e.g., "1,000,000" -> "1000000")
 */
export function removeCommas(value: string): string {
  return value.replace(/,/g, '');
}

/**
 * Parse a comma-formatted string to a number
 */
export function parseFormattedNumber(value: string): number {
  const cleaned = removeCommas(value);
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate if a string is a valid number (with or without commas)
 */
export function isValidNumber(value: string): boolean {
  if (!value) return true; // Empty is valid
  const cleaned = removeCommas(value);
  // Allow numbers with optional decimal point
  return /^\d*\.?\d*$/.test(cleaned);
}
