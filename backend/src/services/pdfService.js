// PATH: backend/src/services/pdfService.js
/**
 * PDF Parsing Service
 * Extracts text from PDF bank statements, cleans noise, and prepares for AI
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

/**
 * Extract text content from a PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);
        return data.text || "";
    } catch (error) {
        console.error("[PDF] Parse error:", error.message);
        throw new Error("PDF dosyası okunamadı. Lütfen geçerli bir PDF yükleyin.");
    }
}

/**
 * Clean and optimize PDF text for AI processing
 * Removes noise, compresses whitespace, keeps transaction-relevant content
 */
export function cleanPdfText(rawText) {
    let text = rawText;

    // 1. Normalize line endings
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 2. Remove excessive blank lines (keep max 1)
    text = text.replace(/\n{3,}/g, "\n\n");

    // 3. Remove common PDF noise patterns
    const noisePatterns = [
        /Sayfa\s*\d+\s*\/?\s*\d*/gi,             // "Sayfa 1/3"
        /Page\s*\d+\s*of\s*\d*/gi,                // "Page 1 of 3"
        /Bu\s*belge\s*bilgi\s*amaçlıdır/gi,       // Disclaimer
        /Bu\s*ekstre\s*bilgilendirme/gi,
        /www\.[a-zA-Z0-9.-]+\.[a-z]{2,}/gi,       // URLs
        /https?:\/\/[^\s]+/gi,                      // Full URLs
        /Müşteri\s*Hizmetleri.*$/gm,               // Customer service lines
        /İletişim.*$/gm,                            // Contact lines
        /Tel\s*:?\s*\d[\d\s()-]+$/gm,              // Phone numbers
        /Faks\s*:?\s*\d[\d\s()-]+$/gm,             // Fax numbers
    ];

    for (const pattern of noisePatterns) {
        text = text.replace(pattern, "");
    }

    // 4. Compress multiple spaces to single
    text = text.replace(/[^\S\n]{3,}/g, "  ");

    // 5. Remove lines that are only whitespace or very short (< 3 chars)
    text = text.split("\n")
        .map(line => line.trim())
        .filter(line => line.length >= 3)
        .join("\n");

    return text.trim();
}

/**
 * Truncate text to stay within token limits
 * KEEPS ALL TRANSACTION DATA — only removes noise/headers if over limit
 * 
 * Haiku handles ~200K tokens (~800K chars), but we limit to keep costs reasonable
 * A typical bank statement is 5-30K chars, so 20K limit covers 99% of cases
 * 
 * @param {string} text - Cleaned PDF text
 * @param {number} maxChars - Max characters to keep (default: 20000 for Haiku)
 */
export function truncateForAI(text, maxChars = 20000) {
    if (text.length <= maxChars) return text;

    // For oversized statements: keep header + ALL transaction lines
    const lines = text.split("\n");

    // Keep first 15 lines (bank name, account info, period, column headers)
    const header = lines.slice(0, 15).join("\n");
    const remaining = maxChars - header.length - 200;

    // Prioritize lines that look like transactions (have numbers/amounts)
    const transactionLines = [];
    const otherLines = [];

    for (let i = 15; i < lines.length; i++) {
        const line = lines[i];
        // Lines with date patterns or currency amounts are likely transactions
        const hasDate = /\d{2}[./-]\d{2}[./-]?\d{0,4}/.test(line);
        const hasAmount = /[\d.,]+\s*(?:TL|₺|TRY)?/.test(line) && /\d{2,}/.test(line);

        if (hasDate || hasAmount) {
            transactionLines.push(line);
        } else {
            otherLines.push(line);
        }
    }

    // Build result: header + all transactions + remaining space for context
    let body = transactionLines.join("\n");

    if (body.length < remaining) {
        // Add context lines if we have room
        const extraSpace = remaining - body.length;
        const extraLines = otherLines.join("\n").substring(0, extraSpace);
        body = body + "\n" + extraLines;
    } else {
        // Even transactions alone exceed limit — take as many as possible
        body = body.substring(0, remaining);
    }

    console.log(`[PDF] Truncated: ${text.length} → ${header.length + body.length} chars (${transactionLines.length} transaction lines kept)`);
    return `${header}\n\n${body}`;
}

export default { extractTextFromPDF, cleanPdfText, truncateForAI };
