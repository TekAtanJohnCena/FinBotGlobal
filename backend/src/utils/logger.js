// PATH: backend/src/utils/logger.js
/**
 * Structured Logger using Winston
 * Logs to console in development and files in production
 */

import winston from 'winston';
import path from 'path';

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Tint the logs if running in a terminal
winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
    )
);

const devFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
);

const transports = [
    // Console logging
    new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: process.env.NODE_ENV === 'production' ? format : devFormat,
    }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
    transports.push(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: format,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: format,
        })
    );
}

const logger = winston.createLogger({
    levels: logLevels,
    transports,
});

// Create a stream object for Morgan
export const morganStream = {
    write: (message) => logger.http(message.trim()),
};

export default logger;
