import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache directory
const CACHE_DIR = path.join(__dirname, '../../cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log('📁 Created cache directory:', CACHE_DIR);
}

/**
 * File-based cache manager with TTL support
 */
class CacheManager {
    constructor() {
        this.cacheDir = CACHE_DIR;
    }

    /**
     * Get cache file path
     */
    getCachePath(key) {
        // Sanitize key to make it file-system safe
        const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
        return path.join(this.cacheDir, `${sanitizedKey}.json`);
    }

    /**
     * Read from cache
     * Returns { data, timestamp } if valid, null if expired or not found
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
                console.log(`⏰ Cache expired: ${key} (age: ${Math.floor(age / 1000)}s, ttl: ${Math.floor(ttl / 1000)}s)`);
                return null;
            }

            console.log(`📦 Cache hit: ${key} (age: ${Math.floor(age / 1000)}s)`);
            return cached;
        } catch (error) {
            console.error(`❌ Cache read error for ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Get from cache, even if expired (for fallback on API errors)
     */
    getStale(key) {
        try {
            const cachePath = this.getCachePath(key);

            if (!fs.existsSync(cachePath)) {
                return null;
            }

            const cacheContent = fs.readFileSync(cachePath, 'utf8');
            const cached = JSON.parse(cacheContent);

            const age = Date.now() - cached.timestamp;
            console.log(`📦 Stale cache fallback: ${key} (age: ${Math.floor(age / 1000)}s)`);

            return cached;
        } catch (error) {
            console.error(`❌ Stale cache read error for ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Write to cache
     */
    set(key, data) {
        try {
            const cachePath = this.getCachePath(key);
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };

            fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
            console.log(`✅ Cache saved: ${key}`);
            return true;
        } catch (error) {
            console.error(`❌ Cache write error for ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Delete cache entry
     */
    delete(key) {
        try {
            const cachePath = this.getCachePath(key);

            if (fs.existsSync(cachePath)) {
                fs.unlinkSync(cachePath);
                console.log(`🗑️  Cache deleted: ${key}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`❌ Cache delete error for ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Clear all cache files
     */
    clearAll() {
        try {
            const files = fs.readdirSync(this.cacheDir);
            let count = 0;

            for (const file of files) {
                if (file.endsWith('.json')) {
                    fs.unlinkSync(path.join(this.cacheDir, file));
                    count++;
                }
            }

            console.log(`🗑️  Cleared ${count} cache files`);
            return count;
        } catch (error) {
            console.error('❌ Cache clear error:', error.message);
            return 0;
        }
    }

    /**
     * Clean up expired cache files
     */
    cleanupExpired(ttl) {
        try {
            const files = fs.readdirSync(this.cacheDir);
            const now = Date.now();
            let count = 0;

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filePath = path.join(this.cacheDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const cached = JSON.parse(content);

                const age = now - cached.timestamp;
                if (age > ttl) {
                    fs.unlinkSync(filePath);
                    count++;
                }
            }

            if (count > 0) {
                console.log(`🧹 Cleaned up ${count} expired cache files`);
            }
            return count;
        } catch (error) {
            console.error('❌ Cache cleanup error:', error.message);
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        try {
            const files = fs.readdirSync(this.cacheDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            const now = Date.now();

            let totalSize = 0;
            let oldestAge = 0;
            let newestAge = Infinity;

            for (const file of jsonFiles) {
                const filePath = path.join(this.cacheDir, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;

                const content = fs.readFileSync(filePath, 'utf8');
                const cached = JSON.parse(content);
                const age = now - cached.timestamp;

                if (age > oldestAge) oldestAge = age;
                if (age < newestAge) newestAge = age;
            }

            return {
                fileCount: jsonFiles.length,
                totalSizeKB: Math.round(totalSize / 1024),
                oldestAgeSeconds: Math.floor(oldestAge / 1000),
                newestAgeSeconds: Math.floor(newestAge / 1000)
            };
        } catch (error) {
            console.error('❌ Cache stats error:', error.message);
            return null;
        }
    }
}

// Singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
