// PATH: backend/src/middleware/validate.js
// Input Validation Middleware using Zod

import { z } from "zod";

/**
 * Validation middleware factory
 * Creates middleware that validates request body/params/query
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request data based on schema
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // ---------------------------------------------------------
      // DÜZELTME BAŞLANGICI:
      // req.query ve req.params salt okunur (getter) olduğu için
      // doğrudan eşitleme (=) yapılamaz. Object.assign ile güncelliyoruz.
      // ---------------------------------------------------------

      // Body genellikle değiştirilebilir, ancak güvenli olması için kontrol ediyoruz
      if (validated.body) {
        req.body = validated.body;
      }

      // Query parametrelerini güncelle
      if (validated.query) {
        Object.assign(req.query, validated.query);
      }

      // URL parametrelerini güncelle
      if (validated.params) {
        Object.assign(req.params, validated.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Geçersiz istek verisi",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// ============================================
// INPUT SANITIZATION UTILITIES
// ============================================

/**
 * Sanitize user input to prevent prompt injection
 * Removes potential injection patterns
 */
function sanitizeUserInput(input) {
  if (typeof input !== "string") return input;

  let sanitized = input;

  // Remove system prompt injection attempts
  const injectionPatterns = [
    /ignore\s+(previous|all)\s+(instructions|prompts?)/gi,
    /system\s*:\s*/gi,
    /assistant\s*:\s*/gi,
    /user\s*:\s*ignore/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi, // Regex hatası düzeltilmiş hali
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
  ];

  injectionPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 5000);

  return sanitized;
}

/**
 * Sanitize string input (general purpose)
 */
export function sanitizeString(input) {
  if (typeof input !== "string") return input;
  return input.trim().replace(/[<>]/g, "");
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * User Registration Schema
 */
export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
      .max(50, "Kullanıcı adı en fazla 50 karakter olabilir")
      .regex(/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir"),
    email: z
      .string()
      .email("Geçerli bir e-posta adresi giriniz")
      .max(255, "E-posta adresi çok uzun"),
    password: z
      .string()
      .min(6, "Şifre en az 6 karakter olmalıdır")
      .max(128, "Şifre çok uzun"),
    firstName: z
      .string()
      .min(2, "Ad en az 2 karakter olmalıdır")
      .max(50, "Ad en fazla 50 karakter olabilir"),
    lastName: z
      .string()
      .min(2, "Soyad en az 2 karakter olmalıdır")
      .max(50, "Soyad en fazla 50 karakter olabilir"),
    phoneNumber: z
      .string()
      .min(10, "Telefon numarası en az 10 karakter olmalıdır")
      .max(20, "Telefon numarası çok uzun")
      .regex(/^[0-9+\-\s()]+$/, "Geçerli bir telefon numarası giriniz"),
    birthDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Geçerli bir doğum tarihi giriniz",
      }),
  }),
});

/**
 * User Login Schema (Dual-login: email OR username)
 */
export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, "E-posta veya kullanıcı adı gerekli"),
    password: z.string().min(1, "Şifre boş olamaz"),
  }),
});

/**
 * Chat Message Schema
 * Includes prompt injection protection
 */
export const chatMessageSchema = z.object({
  body: z.object({
    message: z
      .string()
      .min(1, "Mesaj boş olamaz")
      .max(5000, "Mesaj çok uzun (maksimum 5000 karakter)")
      .transform((val) => sanitizeUserInput(val)),
    chatId: z.string().optional(),
  }),
});

/**
 * Portfolio Asset Schema
 */
export const portfolioAssetSchema = z.object({
  body: z.object({
    ticker: z
      .string()
      .min(1, "Ticker boş olamaz")
      .max(10, "Ticker çok uzun")
      .regex(/^[A-Z0-9.]+$/, "Ticker sadece büyük harf, rakam ve nokta içerebilir")
      .transform((val) => val.toUpperCase().trim()),
    quantity: z
      .number()
      .positive("Miktar pozitif olmalıdır")
      .max(1000000, "Miktar çok büyük"),
    avgCost: z
      .number()
      .positive("Ortalama maliyet pozitif olmalıdır")
      .max(1000000, "Ortalama maliyet çok büyük"),
  }),
});

/**
 * Stock Analysis Schema
 */
export const stockAnalysisSchema = z.object({
  body: z.object({
    ticker: z
      .string()
      .min(1, "Ticker boş olamaz")
      .max(10, "Ticker çok uzun")
      .regex(/^[A-Z0-9.]+$/, "Ticker sadece büyük harf, rakam ve nokta içerebilir")
      .transform((val) => val.toUpperCase().trim()),
  }),
});

/**
 * Google OAuth Token Schema
 */
export const googleTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token boş olamaz").max(5000, "Token çok uzun"),
  }),
});
