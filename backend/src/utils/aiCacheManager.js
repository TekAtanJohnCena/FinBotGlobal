// PATH: backend/src/utils/aiCacheManager.js
/**
 * AI Cache Manager - Specialized cache for OpenAI responses
 * Features:
 * - 7-day TTL for translations and AI analysis
 * - Hash-based keys for text deduplication
 * - Separate from general data cache
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AI-specific cache directory
const AI_CACHE_DIR = path.join(__dirname, '../../cache/ai');

// TTL Configuration
const AI_CACHE_TTL = {
    TRANSLATION: 7 * 24 * 60 * 60 * 1000,    // 7 days
    NEWS_ANALYSIS: 7 * 24 * 60 * 60 * 1000,  // 7 days
    STOCK_ANALYSIS: 24 * 60 * 60 * 1000      // 24 hours (more volatile)
};

// Ensure AI cache directory exists
if (!fs.existsSync(AI_CACHE_DIR)) {
    fs.mkdirSync(AI_CACHE_DIR, { recursive: true });
    console.log('📁 Created AI cache directory:', AI_CACHE_DIR);
}

/**
 * Generate hash from text for cache key
 * @param {string} text - Text to hash
 * @returns {string} - MD5 hash
 */
function hashText(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * AI-specific cache manager
 */
class AICacheManager {
    constructor() {
        this.cacheDir = AI_CACHE_DIR;
        this.ttl = AI_CACHE_TTL;
    }

    /**
     * Generate cache key for translation
     * @param {string} text - Original text
     * @param {string} targetLang - Target language code
     * @returns {string} - Cache key
     */
    getTranslationKey(text, targetLang) {
        const textHash = hashText(text);
        return `trans_${targetLang}_${textHash}`;
    }

    /**
     * Generate cache key for news analysis
     * @param {string} newsId - News ID or title hash
     * @returns {string} - Cache key
     */
    getNewsAnalysisKey(newsId) {
        const hash = hashText(newsId);
        return `news_${hash}`;
    }

    /**
     * Generate cache key for stock AI analysis
     * @param {string} ticker - Stock ticker
     * @returns {string} - Cache key
     */
    getStockAnalysisKey(ticker) {
        return `stock_ai_${ticker.toUpperCase()}`;
    }

    /**
     * Get cache file path
     * @param {string} key - Cache key
     * @returns {string} - File path
     */
    getCachePath(key) {
        const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
        return path.join(this.cacheDir, `${sanitizedKey}.json`);
    }

    /**
     * Get from cache
     * @param {string} key - Cache key
     * @param {number} ttl - Time to live in ms
     * @returns {object|null} - Cached data or null
     */
    get(key, ttl) {
        try {
            const cachePath = this.getCachePath(key);

            if (!fs.existsSync(cachePath)) {
                return null;
            }

            const cacheContent = fs.readFileSync(cachePath, 'utf8');
            const cached = JSON.parse(cacheContent);

            const now = Date.now();
            const age = now - cached.timestamp;

            // Check if expired
            if (ttl && age > ttl) {
                console.log(`⏰ AI Cache expired: ${key} (age: ${Math.floor(age / 1000 / 60)}min)`);
                return null;
            }

            console.log(`📦 AI Cache hit: ${key} (age: ${Math.floor(age / 1000 / 60)}min)`);
            return cached.data;
        } catch (error) {
            console.error(`❌ AI Cache read error for ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Set cache
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @returns {boolean} - Success
     */
    set(key, data) {
        try {
            const cachePath = this.getCachePath(key);
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };

            fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
            console.log(`✅ AI Cache saved: ${key}`);
            return true;
        } catch (error) {
            console.error(`❌ AI Cache write error for ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Get translation from cache
     * @param {string} text - Original text
     * @param {string} targetLang - Target language
     * @returns {string|null} - Cached translation or null
     */
    getTranslation(text, targetLang) {
        const key = this.getTranslationKey(text, targetLang);
        return this.get(key, this.ttl.TRANSLATION);
    }

    /**
     * Set translation to cache
     * @param {string} text - Original text
     * @param {string} targetLang - Target language
     * @param {string} translation - Translated text
     */
    setTranslation(text, targetLang, translation) {
        const key = this.getTranslationKey(text, targetLang);
        return this.set(key, translation);
    }

    /**
     * Get news analysis from cache
     * @param {string} newsId - News identifier
     * @returns {object|null} - Cached analysis or null
     */
    getNewsAnalysis(newsId) {
        const key = this.getNewsAnalysisKey(newsId);
        return this.get(key, this.ttl.NEWS_ANALYSIS);
    }

    /**
     * Set news analysis to cache
     * @param {string} newsId - News identifier
     * @param {object} analysis - Analysis result
     */
    setNewsAnalysis(newsId, analysis) {
        const key = this.getNewsAnalysisKey(newsId);
        return this.set(key, analysis);
    }

    /**
     * Get stock AI analysis from cache
     * @param {string} ticker - Stock ticker
     * @returns {object|null} - Cached analysis or null
     */
    getStockAnalysis(ticker) {
        const key = this.getStockAnalysisKey(ticker);
        return this.get(key, this.ttl.STOCK_ANALYSIS);
    }

    /**
     * Set stock AI analysis to cache
     * @param {string} ticker - Stock ticker
     * @param {object} analysis - Analysis result
     */
    setStockAnalysis(ticker, analysis) {
        const key = this.getStockAnalysisKey(ticker);
        return this.set(key, analysis);
    }

    /**
     * Get cache statistics
     * @returns {object} - Stats
     */
    getStats() {
        try {
            const files = fs.readdirSync(this.cacheDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            let totalSize = 0;
            let translationCount = 0;
            let newsCount = 0;
            let stockCount = 0;

            for (const file of jsonFiles) {
                const filePath = path.join(this.cacheDir, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;

                if (file.startsWith('trans_')) translationCount++;
                else if (file.startsWith('news_')) newsCount++;
                else if (file.startsWith('stock_ai_')) stockCount++;
            }

            return {
                totalFiles: jsonFiles.length,
                totalSizeKB: Math.round(totalSize / 1024),
                translations: translationCount,
                newsAnalyses: newsCount,
                stockAnalyses: stockCount
            };
        } catch (error) {
            console.error('❌ AI Cache stats error:', error.message);
            return null;
        }
    }
}

// Singleton instance
const aiCacheManager = new AICacheManager();

export default aiCacheManager;
export { AI_CACHE_TTL };
