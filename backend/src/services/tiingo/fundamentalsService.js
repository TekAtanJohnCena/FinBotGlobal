// PATH: backend/src/services/tiingo/fundamentalsService.js
import tiingoClient from './tiingoClient.js';
import cache from '../cache/cacheService.js';

import { formatTicker } from '../../utils/tickerFormatter.js';

const FUNDAMENTALS_TTL = 24 * 60 * 60 * 1000; // 24 hours

function parseYear(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
    const match = String(value).match(/\b(20\d{2})\b/);
    if (!match) return null;
    const year = Number(match[1]);
    return Number.isFinite(year) ? year : null;
}

function statementTimestamp(statement) {
    if (!statement || typeof statement !== "object") return Number.NaN;

    const dateCandidates = [
        statement.date,
        statement.reportDate,
        statement.filingDate,
        statement.filedDate,
        statement.periodEndDate,
        statement.fiscalDate
    ];

    for (const candidate of dateCandidates) {
        if (!candidate) continue;
        const ts = new Date(candidate).getTime();
        if (Number.isFinite(ts)) return ts;
    }

    const year = parseYear(statement.year ?? statement.fiscalYear);
    if (!year) return Number.NaN;

    const quarter = String(statement.quarter ?? statement.fiscalQuarter ?? "Y").toUpperCase();
    const quarterMonthMap = { Q1: 2, Q2: 5, Q3: 8, Q4: 11, Y: 11, FY: 11 };
    const monthIndex = quarterMonthMap[quarter] ?? 11;
    return Date.UTC(year, monthIndex, 1);
}

function selectLatestStatement(statements) {
    if (!Array.isArray(statements) || statements.length === 0) return null;

    const first = statements[0];
    const last = statements[statements.length - 1];
    const firstTs = statementTimestamp(first);
    const lastTs = statementTimestamp(last);

    if (Number.isFinite(firstTs) && Number.isFinite(lastTs)) {
        return firstTs >= lastTs ? first : last;
    }

    if (Number.isFinite(firstTs) && !Number.isFinite(lastTs)) return first;
    if (!Number.isFinite(firstTs) && Number.isFinite(lastTs)) return last;
    return last;
}

/**
 * Get fundamental financial data
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Financial fundamentals
 */
export async function getFundamentals(ticker) {
    const normalizedTicker = formatTicker(ticker);
    if (!normalizedTicker) {
        throw new Error('Ticker is required');
    }

    const cacheKey = `fundamentals:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Real API call (requires premium Tiingo access)
    try {
        const client = tiingoClient.getClient();
        const response = await client.get(`/tiingo/fundamentals/${normalizedTicker}/statements`, {
            params: { asReported: false }
        });

        const statements = response.data;
        if (!statements || statements.length === 0) {
            throw new Error(`No fundamental data for ${normalizedTicker}`);
        }

        const latest = selectLatestStatement(statements);
        if (!latest) {
            throw new Error(`No parseable fundamental statement for ${normalizedTicker}`);
        }

        const statementYear = parseYear(latest.year ?? latest.fiscalYear ?? latest.date);
        const statementQuarter = latest.quarter ?? latest.fiscalQuarter ?? null;
        const result = {
            ticker: normalizedTicker,
            period: `${statementYear || latest.year || "N/A"} ${statementQuarter || latest.quarter || ""}`.trim(),
            date: latest.date || null,
            fiscalYear: statementYear,
            fiscalQuarter: statementQuarter,
            reportType: latest.quarter === 'Y' ? '10-K' : '10-Q',
            revenue: latest.revenue,
            netIncome: latest.netIncome,
            grossProfit: latest.grossProfit,
            operatingIncome: latest.operatingIncome,
            totalAssets: latest.totalAssets,
            totalLiabilities: latest.totalLiabilities,
            shareholderEquity: latest.totalEquity,
            operatingCashFlow: latest.cashFromOperatingActivities,
            capitalExpenditures: latest.capitalExpenditures,
            freeCashFlow: latest.freeCashFlow,
            eps: latest.eps,
            source: 'tiingo'
        };

        // Calculate ratios
        if (result.netIncome && result.shareholderEquity > 0) {
            result.roe = (result.netIncome / result.shareholderEquity) * 100;
        }
        if (result.netIncome && result.totalAssets > 0) {
            result.roa = (result.netIncome / result.totalAssets) * 100;
        }
        if (result.totalLiabilities && result.shareholderEquity > 0) {
            result.debtToEquity = result.totalLiabilities / result.shareholderEquity;
        }
        if (result.revenue && result.grossProfit) {
            result.grossMargin = (result.grossProfit / result.revenue) * 100;
        }
        if (result.totalLiabilities != null && result.totalAssets != null) {
            // Net Debt approximation: totalLiabilities - (derive cash from totalAssets - totalLiabilities - equity)
            result.netDebt = result.totalLiabilities - (result.shareholderEquity || 0);
        }

        cache.set(cacheKey, result, FUNDAMENTALS_TTL);
        return result;
    } catch (error) {
        console.error(`❌ Tiingo fundamentals error for ${normalizedTicker}:`, error.message);
        throw error;
    }
}

/**
 * Get key financial metrics
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Key metrics
 */
export async function getKeyMetrics(ticker) {
    const fundamentals = await getFundamentals(ticker);

    return {
        ticker: fundamentals.ticker,
        period: fundamentals.period,
        eps: fundamentals.eps,
        roe: fundamentals.roe,
        roa: fundamentals.roa,
        debtToEquity: fundamentals.debtToEquity,
        profitMargin: fundamentals.netIncome && fundamentals.revenue
            ? ((fundamentals.netIncome / fundamentals.revenue) * 100).toFixed(1)
            : null
    };
}

/**
 * Format number for display (B/M/K)
 * @param {number} num - Number to format
 * @returns {string} - Formatted string
 */
export function formatNumber(num) {
    if (num === null || num === undefined || !isFinite(num)) return '—';
    if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return Number(num).toFixed(2);
}

export default {
    getFundamentals,
    getKeyMetrics,
    formatNumber
};
