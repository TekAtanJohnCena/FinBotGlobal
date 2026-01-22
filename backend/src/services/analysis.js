// PATH: backend/src/services/analysis.js
/**
 * Analysis Service - US Market Edition
 * Provides financial analysis using Tiingo data
 */

import { getFundamentals } from "./tiingo/fundamentalsService.js";
import { getPrice, getProfile } from "./tiingo/stockService.js";

/* ----------------------------- Helpers ----------------------------- */
function num(v) {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function notNull(v) {
  return v !== null && v !== undefined;
}

function pct(a, b, digits = 1) {
  if (!notNull(a) || !notNull(b) || b === 0) return null;
  return ((a / b) * 100).toFixed(digits);
}

function deltaPct(curr, prev) {
  if (!notNull(curr) || !notNull(prev) || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

/* ----------------------------- Load Data ----------------------------- */

/**
 * Load company financial data from Tiingo
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object>} - Financial data
 */
export async function loadCompanyData(ticker) {
  const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');

  try {
    const [fundamentals, price, profile] = await Promise.all([
      getFundamentals(normalizedTicker).catch(() => null),
      getPrice(normalizedTicker).catch(() => null),
      getProfile(normalizedTicker).catch(() => null)
    ]);

    return {
      ticker: normalizedTicker,
      name: profile?.name || normalizedTicker,
      sector: profile?.sector,
      price: price?.price,
      change: price?.change,
      changePercent: price?.changePercent,
      fundamentals,
      source: 'tiingo'
    };
  } catch (error) {
    console.error(`Error loading data for ${normalizedTicker}:`, error.message);
    return null;
  }
}

/**
 * Get target price estimate (placeholder for future implementation)
 * @param {string} ticker - Stock ticker
 * @returns {Object} - Valuation estimates
 */
export function getTahminByTicker(ticker) {
  // Placeholder - in real implementation, this would come from analyst estimates API
  return {
    ticker: ticker?.toUpperCase(),
    ucuzluk_orani: null,
    hedef_fiyat: null
  };
}

/* --------------------------- ANALYSIS --------------------------- */

/**
 * Analyze a single period of financial data
 * @param {Object} fundamentals - Financial data
 * @returns {Object} - Analysis result
 */
export function analyzeQuarter(fundamentals) {
  if (!fundamentals) return null;

  const netIncome = num(fundamentals.netIncome);
  const equity = num(fundamentals.shareholderEquity);
  const totalAssets = num(fundamentals.totalAssets);
  const revenue = num(fundamentals.revenue);

  const ratios = {
    roe: pct(netIncome, equity),
    roa: pct(netIncome, totalAssets),
    profit_margin: pct(netIncome, revenue),
    debt_equity: notNull(fundamentals.debtToEquity) ? fundamentals.debtToEquity.toFixed(2) : null
  };

  const comments = [];

  if (notNull(ratios.roe)) {
    const v = Number(ratios.roe);
    if (v > 20) comments.push("Strong ROE above 20%, excellent equity efficiency.");
    else if (v > 15) comments.push("Good ROE between 15-20%, healthy profitability.");
    else if (v < 10) comments.push("Low ROE below 10%, potential profitability concern.");
  }

  if (notNull(ratios.roa)) {
    const v = Number(ratios.roa);
    if (v > 10) comments.push("Strong ROA above 10%, efficient asset utilization.");
    else if (v < 5) comments.push("Low ROA below 5%, may need to improve asset efficiency.");
  }

  if (notNull(fundamentals.debtToEquity)) {
    const v = fundamentals.debtToEquity;
    if (v > 2) comments.push("High debt-to-equity ratio, potential leverage risk.");
    else if (v < 0.5) comments.push("Conservative capital structure with low debt.");
  }

  return {
    ticker: fundamentals.ticker,
    period: fundamentals.period,
    netIncome,
    equity,
    totalAssets,
    revenue,
    ratios,
    comments
  };
}

/**
 * Analyze with comparisons (simplified for US market)
 * @param {Object} companyData - Company data
 * @param {Object} fundamentals - Current fundamentals
 * @returns {Object} - Analysis with comparisons
 */
export function analyzeWithComparisons(companyData, fundamentals) {
  const base = analyzeQuarter(fundamentals);

  return {
    ...base,
    comparisons: {
      base: {
        period: fundamentals?.period,
        netIncome: fundamentals?.netIncome,
        equity: fundamentals?.shareholderEquity,
        totalAssets: fundamentals?.totalAssets
      },
      // QoQ and YoY comparisons would require historical data
      qoq: null,
      yoy: null
    }
  };
}

export default {
  loadCompanyData,
  getTahminByTicker,
  analyzeQuarter,
  analyzeWithComparisons
};
