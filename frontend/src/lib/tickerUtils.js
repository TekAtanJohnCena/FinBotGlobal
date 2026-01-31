/**
 * Format ticker symbol for Tiingo API compatibility.
 * Replaces dots with hyphens (e.g., BRK.A -> BRK-A).
 * Uppercases the ticker.
 * 
 * @param {string} ticker - The raw ticker symbol
 * @returns {string} - The formatted ticker symbol
 */
export const formatTicker = (ticker) => {
    if (!ticker || typeof ticker !== 'string') return '';

    // 1. Uppercase
    // 2. Replace all dots with hyphens
    // 3. Remove .IS suffix if present (logic kept for safety)
    return ticker
        .toUpperCase()
        .replace(/\./g, '-')
        .replace('-IS', '');
};

/**
 * Check if a ticker likely represents a delisted asset (numeric suffix).
 * e.g., Ticker123 -> true
 * @param {string} ticker 
 * @returns {boolean}
 */
export const isDelisted = (ticker) => {
    if (!ticker) return false;
    // Tiingo appends numbers to delisted assets
    return /\d+$/.test(ticker);
}
