// PATH: backend/src/config/env.js
/**
 * Environment Configuration
 * Validates and exports environment variables
 * Throws errors in production if required keys are missing
 */

import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

/**
 * Get required environment variable
 * Throws error in production if missing
 */
function getRequired(key, defaultValue = null) {
    const value = process.env[key];

    if (!value && isProd && !defaultValue) {
        throw new Error(`❌ FATAL: Missing required environment variable: ${key}`);
    }

    if (!value && !isProd) {
        console.warn(`⚠️ Warning: Missing env variable ${key}, using default`);
        return defaultValue;
    }

    return value;
}

/**
 * Get optional environment variable with default
 */
function getOptional(key, defaultValue) {
    return process.env[key] || defaultValue;
}

// ============== EXPORTED CONFIGURATION ==============

export const config = {
    // Environment
    env: NODE_ENV,
    isProd,
    isDev: NODE_ENV === 'development',

    // Server
    port: parseInt(getOptional('PORT', '5000'), 10),

    // Database
    mongoUri: getRequired('MONGO_URI', 'mongodb://localhost:27017/finbot'),

    // Authentication
    jwtSecret: getRequired('JWT_SECRET', isProd ? null : 'dev_secret_change_in_prod'),

    // AI APIs (Using AWS Bedrock/Claude instead of OpenAI)
    // openaiKey: getRequired('OPENAI_API_KEY', null),

    // Tiingo API
    tiingoApiKey: getOptional('TIINGO_API_KEY', null),


    // OAuth
    googleClientId: getOptional('GOOGLE_CLIENT_ID', null),

    // Frontend
    frontendUrl: getOptional('FRONTEND_URL', 'http://localhost:3000'),
    corsOrigins: getOptional('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(','),

    // Rate Limiting
    rateLimitGeneral: parseInt(getOptional('RATE_LIMIT_GENERAL', '100'), 10),
    rateLimitTiingo: parseInt(getOptional('RATE_LIMIT_TIINGO', '500'), 10),

    // Email (SMTP)
    smtp: {
        host: getOptional('SMTP_HOST', 'smtp.turkticaret.net'),
        port: parseInt(getOptional('SMTP_PORT', '587'), 10),
        email: getOptional('SMTP_EMAIL', null),
        password: getRequired('SMTP_PASSWORD', null),
        from: getOptional('EMAIL_FROM', 'Finbot <destek@finbot.com.tr>')
    }
};

// Log configuration in development
if (config.isDev) {
    console.log('📋 Environment Configuration:');
    console.log(`   Mode: ${config.env}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   MongoDB: ${config.mongoUri ? '✅ Connected' : '❌ Missing'}`);
    console.log(`   SMTP: ${config.smtp.host}:${config.smtp.port} (${config.smtp.email ? '✅ Configured' : '❌ Missing Email'})`);
}

export default config;
