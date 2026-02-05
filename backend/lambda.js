// PATH: backend/lambda.js
/**
 * AWS Lambda Handler for FinBot Backend
 * Wraps Express.js app using serverless-http
 */

import serverless from 'serverless-http';
import app from './src/index.js';

/**
 * Lambda handler that processes HTTP events through Express
 * serverless-http converts API Gateway/Lambda URL events to Express-compatible format
 */
export const handler = serverless(app, {
    // Binary media types for file uploads/downloads
    binary: ['image/*', 'application/pdf', 'application/octet-stream']
});
