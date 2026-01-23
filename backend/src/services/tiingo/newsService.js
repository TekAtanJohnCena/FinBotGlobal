// PATH: backend/src/services/tiingo/newsService.js
import tiingoClient from './tiingoClient.js';
import cache from '../cache/cacheService.js';

const NEWS_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get news articles
 * @param {string} ticker - Optional ticker to filter news
 * @param {number} limit - Maximum number of articles (default: 20)
 * @returns {Promise<Array>} - Array of news articles
 */
export async function getNews(ticker, limit = 20) {
    const cacheKey = ticker ? `news:${ticker.toUpperCase()}` : 'news:all';
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log(`📦 Cache hit: ${cacheKey}`);
        return cached;
    }

    // Real API call
    try {
        const client = tiingoClient.getClient();
        const params = { limit };
        if (ticker) {
            params.tickers = ticker.toUpperCase();
        }

        const response = await client.get('/tiingo/news', { params });

        const articles = response.data?.map(article => ({
            id: article.id,
            title: article.title,
            description: article.description,
            source: article.source,
            url: article.url,
            publishedDate: article.publishedDate,
            tickers: article.tickers || [],
            tags: article.tags || [],
            sentiment: analyzeSentiment(article.title + ' ' + article.description)
        })) || [];

        cache.set(cacheKey, articles, NEWS_TTL);
        return articles;
    } catch (error) {
        console.error(`❌ Tiingo news error:`, error.message);
        throw error;
    }
}

/**
 * Get latest market headlines
 * @param {number} limit - Maximum number of articles
 * @returns {Promise<Array>} - Array of news articles
 */
export async function getMarketHeadlines(limit = 10) {
    return getNews(null, limit);
}

/**
 * Get news for multiple tickers
 * @param {Array<string>} tickers - Array of ticker symbols
 * @param {number} limit - Maximum articles per ticker
 * @returns {Promise<Object>} - Object with ticker keys and news arrays
 */
export async function getNewsForTickers(tickers, limit = 5) {
    const results = {};

    for (const ticker of tickers) {
        try {
            results[ticker.toUpperCase()] = await getNews(ticker, limit);
        } catch (error) {
            results[ticker.toUpperCase()] = [];
        }
    }

    return results;
}

/**
 * Simple sentiment analysis based on keywords
 * @param {string} text - Text to analyze
 * @returns {string} - 'positive', 'negative', or 'neutral'
 */
export function analyzeSentiment(text) {
    if (!text) return 'neutral';

    const lowerText = text.toLowerCase();

    const positiveKeywords = [
        'surge', 'jump', 'gain', 'rise', 'soar', 'beat', 'exceed', 'growth',
        'profit', 'record', 'strong', 'bullish', 'rally', 'upgrade', 'buy',
        'outperform', 'success', 'breakthrough', 'innovation', 'expand'
    ];

    const negativeKeywords = [
        'fall', 'drop', 'decline', 'crash', 'loss', 'miss', 'fail', 'weak',
        'bearish', 'sell', 'downgrade', 'concern', 'risk', 'warning', 'cut',
        'layoff', 'recession', 'investigation', 'lawsuit', 'fraud'
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const keyword of positiveKeywords) {
        if (lowerText.includes(keyword)) positiveScore++;
    }

    for (const keyword of negativeKeywords) {
        if (lowerText.includes(keyword)) negativeScore++;
    }

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
}

export default {
    getNews,
    getMarketHeadlines,
    getNewsForTickers,
    analyzeSentiment
};
