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
    // 3. Remove .IS suffix if present (historical artifact, but safe to keep logic)
    return ticker
        .toUpperCase()
        .replace(/\./g, '-')
        .replace('-IS', ''); // In case someone passes BRK.B.IS
};

/**
 * Check if a ticker likely represents a delisted asset (numeric suffix).
 * e.g., Ticker123 -> true
 * @param {string} ticker 
 * @returns {boolean}
 */
export const isDelisted = (ticker) => {
    if (!ticker) return false;
    // Tiingo usually appends numbers to delisted assets, e.g. "AA1"
    // But standard tickers can have numbers too? (Not typically for US stocks/ETFs)
    // Usually it's strictly alpha for active US tickers, except specific cases.
    // Let's assume pure numeric suffix implies delisting for now based on user prompt.
    return /\d+$/.test(ticker);
}
