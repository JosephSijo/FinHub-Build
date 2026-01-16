/**
 * Utility functions for number and currency formatting
 */

/**
 * Formats a number as a currency string using Intl.NumberFormat.
 * Supports Indian numbering system (Lakh/Crore) for INR.
 * 
 * @param value The numeric value to format
 * @param currency The currency code (e.g., 'INR', 'USD')
 * @param compact Whether to use compact notation (e.g., 1.2M, 1.5Cr)
 */
export function formatCurrency(
  value: number | string,
  currency: string = 'USD',
  compact: boolean = false
): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

  if (isNaN(numValue)) return '';

  const locale = currency === 'INR' ? 'en-IN' : 'en-US';

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  };

  try {
    return new Intl.NumberFormat(locale, options).format(numValue);
  } catch {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat(locale, {
      ...options,
      style: 'decimal'
    }).format(numValue);
  }
}

/**
 * Format a number with commas based on locale (default to Indian for INR-like patterns)
 */
export function formatNumber(value: number | string, locale: string = 'en-IN'): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(numValue)) return '';

  return new Intl.NumberFormat(locale).format(numValue);
}

/**
 * Alias for formatNumber to maintain compatibility with older components
 */
export const formatNumberWithCommas = formatNumber;

/**
 * Validates if a string is a valid numeric input
 */
export function isValidNumber(value: string): boolean {
  if (value === "" || value === "-") return true;
  return /^-?\d*\.?\d*$/.test(value);
}

/**
 * Remove commas from a formatted number string
 */
export function removeCommas(value: string): string {
  return value.replace(/,/g, '');
}

/**
 * Parse a formatted string to a number
 */
export function parseFormattedNumber(value: string): number {
  const cleaned = removeCommas(value);
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
/**
 * Formats a duration in months into a string representation of years and months.
 * 
 * @param months Total number of months
 */
export function formatDuration(months: number): string {
  if (months <= 0) return '0 months';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  const parts = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }
  if (remainingMonths > 0 || years === 0) {
    parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`);
  }

  return parts.join(', ');
}

/**
 * Custom financial formatter for the Balance Board.
 * Displays K, L, C suffixes for larger amounts in INR, or full figures for smaller ones.
 */
export function formatFinancialValue(value: number, currency: string = 'INR'): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // Use Indian numbering system for thresholds if currency is INR
  if (currency === 'INR') {
    if (absValue >= 10000000) { // 1 Crore
      return `${sign}${(absValue / 10000000).toFixed(2).replace(/\.00$/, '')}C`;
    } else if (absValue >= 100000) { // 1 Lakh
      return `${sign}${(absValue / 100000).toFixed(2).replace(/\.00$/, '')}L`;
    } else if (absValue >= 10000) { // 10K threshold for suffixing
      return `${sign}${(absValue / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
  } else {
    // For non-INR, generally use standard K, M, B abbreviations
    if (absValue >= 1000000000) {
      return `${sign}${(absValue / 1000000000).toFixed(2).replace(/\.00$/, '')}B`;
    } else if (absValue >= 1000000) {
      return `${sign}${(absValue / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
    } else if (absValue >= 10000) {
      return `${sign}${(absValue / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
  }

  // Complete figure for smaller amounts
  return sign + formatNumber(absValue, currency === 'INR' ? 'en-IN' : 'en-US');
}
/**
 * Formats a value to a short scale (max 9-10 chars) for small screens.
 * Uses Cr, L, K for INR or B, M, K for others.
 */
export function toShortScale(value: number, currency: string = 'INR'): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const format = (num: number, suffix: string) => {
    // Attempt to keep length <= 9
    // Precision: 2 decimals if < 10, 1 if < 100, 0 if >= 100
    let precision = 2;
    if (num >= 100) precision = 0;
    else if (num >= 10) precision = 1;

    return `${sign}${num.toFixed(precision).replace(/\.0+$/, '')}${suffix}`;
  };

  if (currency === 'INR') {
    if (absValue >= 10000000) return format(absValue / 10000000, 'Cr');
    if (absValue >= 100000) return format(absValue / 100000, 'L');
    if (absValue >= 1000) return format(absValue / 1000, 'K');
  } else {
    if (absValue >= 1000000000) return format(absValue / 1000000000, 'B');
    if (absValue >= 1000000) return format(absValue / 1000000, 'M');
    if (absValue >= 1000) return format(absValue / 1000, 'K');
  }

  return sign + formatNumber(absValue, currency === 'INR' ? 'en-IN' : 'en-US');
}
