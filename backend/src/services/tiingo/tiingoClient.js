// PATH: backend/src/services/tiingo/tiingoClient.js
import axios from 'axios';

const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

if (!TIINGO_API_KEY) {
    console.warn('⚠️ TIINGO_API_KEY is not defined in .env');
} else {
    console.log('✅ Tiingo service initialized with API key');
}

// Axios instance for Tiingo API
const tiingoAxios = axios.create({
    baseURL: 'https://api.tiingo.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        ...(TIINGO_API_KEY && { 'Authorization': `Token ${TIINGO_API_KEY}` })
    }
});

// Request interceptor for logging
tiingoAxios.interceptors.request.use(config => {
    console.log(`📡 Tiingo API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
});

// Response interceptor for error handling
tiingoAxios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 429) {
            console.error('⚠️ Tiingo rate limit exceeded');
        } else if (error.response?.status === 401) {
            console.error('❌ Tiingo API key invalid');
        }
        throw error;
    }
);

/**
 * Check if using mock mode
 * ALWAYS FALSE in Production Cleanup
 */
export function isMockMode() {
    return false;
}

/**
 * Get Tiingo axios instance
 */
export function getClient() {
    return tiingoAxios;
}

export default {
    isMockMode,
    getClient
};
