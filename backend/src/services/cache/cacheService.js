// PATH: backend/src/services/cache/cacheService.js
/**
 * Enhanced Cache Service with node-cache
 * Provides TTL-based caching to reduce API calls
 */

import NodeCache from 'node-cache';

// Cache instances with different TTLs
const priceCache = new NodeCache({
    stdTTL: 60,           // 1 minute for prices (real-time data)
    checkperiod: 30,      // Check for expired entries every 30 seconds
    useClones: false      // Return original objects for performance
});

const newsCache = new NodeCache({
    stdTTL: 3600,         // 1 hour for news
    checkperiod: 300,     // Check every 5 minutes
    useClones: false
});

const fundamentalsCache = new NodeCache({
    stdTTL: 86400,        // 24 hours for fundamentals
    checkperiod: 3600,    // Check every hour
    useClones: false
});

const generalCache = new NodeCache({
    stdTTL: 300,          // 5 minutes default
    checkperiod: 60,
    useClones: false
});

// Cache statistics
let stats = {
    hits: 0,
    misses: 0,
    sets: 0
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @param {string} type - Cache type (price, news, fundamentals, general)
 * @returns {any|undefined} - Cached value or undefined
 */
export function get(key, type = 'general') {
    const cache = getCacheByType(type);
    const value = cache.get(key);

    if (value !== undefined) {
        stats.hits++;
        console.log(`📦 Cache HIT [${type}]: ${key}`);
        return value;
    }

    stats.misses++;
    return undefined;
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {string} type - Cache type
 * @param {number} ttl - Custom TTL in seconds (optional)
 */
export function set(key, value, type = 'general', ttl = null) {
    const cache = getCacheByType(type);
    stats.sets++;

    if (ttl) {
        cache.set(key, value, ttl);
    } else {
        cache.set(key, value);
    }

    console.log(`💾 Cache SET [${type}]: ${key}`);
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @param {string} type - Cache type
 */
export function del(key, type = 'general') {
    const cache = getCacheByType(type);
    cache.del(key);
}

/**
 * Clear all caches
 */
export function clearAll() {
    priceCache.flushAll();
    newsCache.flushAll();
    fundamentalsCache.flushAll();
    generalCache.flushAll();
    console.log('🗑️ All caches cleared');
}

/**
 * Clear specific cache type
 * @param {string} type - Cache type
 */
export function clear(type = 'general') {
    const cache = getCacheByType(type);
    cache.flushAll();
    console.log(`🗑️ Cache cleared: ${type}`);
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export function getStats() {
    return {
        ...stats,
        hitRate: stats.hits + stats.misses > 0
            ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1) + '%'
            : '0%',
        caches: {
            price: priceCache.getStats(),
            news: newsCache.getStats(),
            fundamentals: fundamentalsCache.getStats(),
            general: generalCache.getStats()
        }
    };
}

/**
 * Get or set pattern for easy caching
 * @param {string} key - Cache key
 * @param {string} type - Cache type
 * @param {Function} fetchFn - Function to call on cache miss
 * @param {number} ttl - Custom TTL (optional)
 * @returns {Promise<any>} - Cached or fresh value
 */
export async function getOrSet(key, type, fetchFn, ttl = null) {
    // Check cache first
    const cached = get(key, type);
    if (cached !== undefined) {
        return cached;
    }

    // Fetch fresh data
    const value = await fetchFn();

    // Store in cache
    if (value !== null && value !== undefined) {
        set(key, value, type, ttl);
    }

    return value;
}

/**
 * Get appropriate cache based on type
 * @param {string} type - Cache type
 * @returns {NodeCache} - Cache instance
 */
function getCacheByType(type) {
    switch (type) {
        case 'price':
            return priceCache;
        case 'news':
            return newsCache;
        case 'fundamentals':
            return fundamentalsCache;
        default:
            return generalCache;
    }
}

// Log cache stats periodically in development
if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
        const s = getStats();
        if (s.hits + s.misses > 0) {
            console.log(`📊 Cache Stats: ${s.hits} hits, ${s.misses} misses (${s.hitRate} hit rate)`);
        }
    }, 5 * 60 * 1000); // Every 5 minutes
}

export default {
    get,
    set,
    del,
    clear,
    clearAll,
    getStats,
    getOrSet
};
