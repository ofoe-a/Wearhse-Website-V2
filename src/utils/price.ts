/**
 * Parse a display price string like "GHS 450" or "45000" into a numeric value.
 * Returns the integer value (in the smallest currency unit shown).
 */
export function parsePrice(priceStr: string): number {
    const cleaned = priceStr.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Format a price in GHS for display.
 */
export function formatGHS(amount: number): string {
    return `GHS ${amount.toLocaleString()}`;
}
