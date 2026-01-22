// PATH: backend/src/services/companyNameService.js
/**
 * Company Name Service - US Market Edition
 * Maps tickers to full company names
 */

const companyNameMap = {
  // Magnificent 7
  "aapl": "Apple Inc.",
  "msft": "Microsoft Corporation",
  "googl": "Alphabet Inc.",
  "goog": "Alphabet Inc.",
  "amzn": "Amazon.com Inc.",
  "nvda": "NVIDIA Corporation",
  "meta": "Meta Platforms Inc.",
  "tsla": "Tesla Inc.",

  // Other Tech Giants
  "nflx": "Netflix Inc.",
  "crm": "Salesforce Inc.",
  "adbe": "Adobe Inc.",
  "orcl": "Oracle Corporation",
  "intc": "Intel Corporation",
  "amd": "Advanced Micro Devices Inc.",
  "csco": "Cisco Systems Inc.",
  "ibm": "International Business Machines",
  "qcom": "Qualcomm Inc.",
  "avgo": "Broadcom Inc.",

  // Financials
  "jpm": "JPMorgan Chase & Co.",
  "bac": "Bank of America Corp.",
  "wfc": "Wells Fargo & Company",
  "gs": "Goldman Sachs Group",
  "ms": "Morgan Stanley",
  "c": "Citigroup Inc.",
  "v": "Visa Inc.",
  "ma": "Mastercard Inc.",
  "axp": "American Express Co.",
  "brk.b": "Berkshire Hathaway Inc.",

  // Healthcare
  "unh": "UnitedHealth Group Inc.",
  "jnj": "Johnson & Johnson",
  "pfe": "Pfizer Inc.",
  "mrna": "Moderna Inc.",
  "abbv": "AbbVie Inc.",
  "lly": "Eli Lilly and Company",

  // Consumer
  "wmt": "Walmart Inc.",
  "cost": "Costco Wholesale Corp.",
  "hd": "Home Depot Inc.",
  "mcd": "McDonald's Corporation",
  "sbux": "Starbucks Corporation",
  "ko": "Coca-Cola Company",
  "pep": "PepsiCo Inc.",
  "pg": "Procter & Gamble Co.",
  "dis": "Walt Disney Company",
  "nke": "Nike Inc.",

  // Energy
  "xom": "Exxon Mobil Corporation",
  "cvx": "Chevron Corporation",
  "cop": "ConocoPhillips",

  // Industrial
  "ba": "Boeing Company",
  "cat": "Caterpillar Inc.",
  "ge": "General Electric Co.",
  "hon": "Honeywell International",
  "ups": "United Parcel Service",

  // ETFs
  "spy": "SPDR S&P 500 ETF",
  "qqq": "Invesco QQQ Trust",
  "iwm": "iShares Russell 2000 ETF",
  "dia": "SPDR Dow Jones ETF",
  "voo": "Vanguard S&P 500 ETF"
};

/**
 * Get company name by ticker
 * @param {string} ticker - Stock ticker
 * @returns {string|null} - Full company name or null
 */
export function getCompanyNameByTicker(ticker) {
  if (!ticker) return null;
  const normalized = ticker.toLowerCase().trim();
  return companyNameMap[normalized] || null;
}

/**
 * Format ticker with company name
 * @param {string} ticker - Stock ticker
 * @returns {string} - "Company Name (TICKER)" format
 */
export function formatCompanyWithTicker(ticker) {
  const companyName = getCompanyNameByTicker(ticker);
  const tickerUpper = ticker.toUpperCase();

  if (companyName) {
    return `${companyName} (${tickerUpper})`;
  }
  return tickerUpper;
}

/**
 * Check if ticker is known
 * @param {string} ticker - Stock ticker
 * @returns {boolean} - True if ticker is in our database
 */
export function isKnownTicker(ticker) {
  if (!ticker) return false;
  const normalized = ticker.toLowerCase().trim();
  return normalized in companyNameMap;
}

export default {
  getCompanyNameByTicker,
  formatCompanyWithTicker,
  isKnownTicker
};
