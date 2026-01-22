// PATH: backend/src/utils/promptSanitizer.js
// AI/LLM Prompt Injection Protection

/**
 * Sanitize user input to prevent prompt injection attacks
 * Removes patterns that could manipulate system prompts
 */
export function sanitizeUserPrompt(input) {
  if (typeof input !== "string") return "";
  
  let sanitized = input.trim();
  
  // Remove potential injection patterns
  const injectionPatterns = [
    // System prompt injection attempts
    /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?|rules?)/gi,
    /system\s*:\s*/gi,
    /assistant\s*:\s*/gi,
    /user\s*:\s*ignore/gi,
    
    // Special tokens and markers
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /<\|system\|>/gi,
    /<\|user\|>/gi,
    /<\|assistant\|>/gi,
    
    // Role manipulation attempts
    /you are now/gi,
    /forget (that|what|who)/gi,
    /pretend (to be|you are)/gi,
    
    // Output manipulation
    /output (only|just)/gi,
    /don't (say|include|mention)/gi,
    
    // JSON/Code injection markers
    /```json/gi,
    /```python/gi,
    /```javascript/gi,
    /```sql/gi,
    
    // Excessive whitespace/nulls
    /\0/g, // Null bytes
    /\r\n/g, // Carriage returns
  ];
  
  injectionPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });
  
  // Limit length to prevent token exhaustion
  sanitized = sanitized.substring(0, 5000);
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();
  
  return sanitized;
}

/**
 * Validate prompt length and content
 */
export function validatePrompt(input, maxLength = 5000) {
  if (!input || typeof input !== "string") {
    return { valid: false, error: "Prompt boş veya geçersiz" };
  }
  
  if (input.length > maxLength) {
    return { valid: false, error: `Prompt çok uzun (maksimum ${maxLength} karakter)` };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /token/i,
    /credentials/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      // Log but don't block (might be legitimate)
      console.warn("Suspicious pattern detected in prompt:", pattern);
    }
  }
  
  return { valid: true, sanitized: sanitizeUserPrompt(input) };
}

/**
 * Escape special characters for safe inclusion in prompts
 */
export function escapePrompt(input) {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}


