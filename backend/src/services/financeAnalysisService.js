// PATH: backend/src/services/financeAnalysisService.js
// Personal Finance & Expense Analysis Engine
// Universal PDF Parser — Works with ALL Turkish bank statements
// -----------------------------------------------------------

import { createRequire } from "module";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

// ═══════════════════════════════════════════════════════════════
// INSTALLMENT DETECTION
// Handles ALL Turkish bank installment notations:
//   [3/6]  (3/6)  3/6  Taksit 3/6  TAKSİT 3/6
//   3.Taksit  3.Taks  3.Tak  3.TAK  3.Tk  05.Tak
//   Taksit:3  3.T  (current/total or current-only)
// Returns { isInstallment, current, total } or null
// ═══════════════════════════════════════════════════════════════
export function parseInstallmentInfo(description) {
    if (!description) return null;
    const d = description;

    // Pattern 1: [3/6] or (3/6) — bracket notation
    let m = d.match(/[\[(](\d+)\/(\d+)[\])]/);
    if (m) return { isInstallment: true, current: parseInt(m[1]), total: parseInt(m[2]) };

    // Pattern 2: "Taksit 3/6", "taksit:3/6", "TAKSİT 3/6", "TAKSİT:3/6"
    m = d.match(/taks[i\u0131]t[:\s]*(\d+)\/(\d+)/i);
    if (m) return { isInstallment: true, current: parseInt(m[1]), total: parseInt(m[2]) };

    // Pattern 3: "3.Taksit", "3.Taks", "3.Tak", "3.TAK", "3.Tk", "05.Tak"
    //   Full word or common abbreviations (case-insensitive)
    m = d.match(/(\d+)\.\s*(?:taks[i\u0131]t|taks|tak|tk)(?!\w)/i);
    if (m) {
        // Try to also find total in the same description: e.g. "05.Tak 12" or "Tak 5/12"
        const totalM = d.match(new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s/]*(\\d+)'));
        const total = totalM ? parseInt(totalM[1]) : null;
        return { isInstallment: true, current: parseInt(m[1]), total };
    }

    // Pattern 4: Standalone "X/Y" where X and Y are small integers (e.g., "3/6", "05/12")
    //   Must be surrounded by spaces or start/end of string to avoid matching dates
    m = d.match(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\s|$)/);
    if (m) {
        const cur = parseInt(m[1]), tot = parseInt(m[2]);
        // Sanity check: current <= total, total <= 60 (reasonable installment count)
        if (cur <= tot && tot <= 60 && tot >= 2) {
            return { isInstallment: true, current: cur, total: tot };
        }
    }

    // Pattern 5: "Taksit No: 3" or "Taksit: 3" (no total known)
    m = d.match(/taks[i\u0131]t\s*(?:no[:\s]*)?[:\s]*(\d+)/i);
    if (m) return { isInstallment: true, current: parseInt(m[1]), total: null };

    return null;
}

// ═══════════════════════════════════════════════════════════════
// POST-PROCESS: Normalize transactions after parsing
//
// KEY DESIGN:
//   - If transaction was already enriched by extractTransactionsFromPDF
//     (has isInstallment/totalAmount set), preserve those values.
//   - For non-enriched transactions (manual entries, etc.),
//     apply fresh installment detection.
//   - Always clean descriptions by removing installment notation.
// ═══════════════════════════════════════════════════════════════
export function normalizeTransactions(transactions) {
    return transactions.map(t => {
        // If already enriched by PDF pipeline, just clean description
        if (t.isInstallment && (t.totalAmount || t.installmentCurrent)) {
            const cleanDesc = cleanInstallmentNotation(t.description);
            return {
                ...t,
                originalDescription: t.originalDescription || t.description,
                description: cleanDesc || t.description,
            };
        }

        const info = parseInstallmentInfo(t.description);
        if (!info) return { ...t, isInstallment: false };

        // Clean description: remove ALL installment notations
        let cleanDesc = cleanInstallmentNotation(t.description);

        // Look for parenthesized total amount in original description: e.g. "(3.999,00 TL)"
        const parenTotalMatch = t.description.match(/\(([\\d.,]+)\s*TL\)/i);
        let parenTotal = parenTotalMatch ? parseAmount(parenTotalMatch[1]) : null;

        // Also look for explicit "Toplam: X TL" pattern
        const explicitTotalMatch = t.description.match(/toplam[:\s]*([\d.,]+)/i);
        let explicitTotal = explicitTotalMatch ? parseAmount(explicitTotalMatch[1]) : null;

        const result = {
            ...t,
            isInstallment: true,
            installmentCurrent: info.current,
            installmentTotal: info.total,
            originalDescription: t.description,
            description: cleanDesc,
        };

        // Determine totalAmount and verify monthly amount
        if (parenTotal && parenTotal > t.amount) {
            result.totalAmount = parenTotal;
            if (info.total && info.total > 1) {
                const expectedMonthly = Math.round((parenTotal / info.total) * 100) / 100;
                const diff = Math.abs(t.amount - expectedMonthly) / expectedMonthly;
                if (diff > 0.05) {
                    result.amount = expectedMonthly;
                }
            }
        } else if (explicitTotal && explicitTotal > t.amount) {
            result.totalAmount = explicitTotal;
            if (info.total && info.total > 1) {
                result.amount = Math.round((explicitTotal / info.total) * 100) / 100;
            }
        } else if (info.total && info.total > 1) {
            result.totalAmount = Math.round(t.amount * info.total * 100) / 100;
        }

        return result;
    });
}

// Helper: clean installment notation from description
function cleanInstallmentNotation(desc) {
    if (!desc) return desc;
    return desc
        .replace(/[\[(]\d+\/\d+[\])]/g, "")            // [3/6] (3/6)
        .replace(/taks[i\u0131]t[:\s]*\d+\/\d+/gi, "")  // Taksit 3/6
        .replace(/(\d+)\.\s*(?:taks[i\u0131]t|taks|tak|tk)(?!\w)/gi, "") // 3.Tak 05.Tak
        .replace(/(?:^|\s)\d{1,2}\/\d{1,2}(?:\s|$)/g, " ") // standalone 3/6
        .replace(/taks[i\u0131]t\s*(?:no[:\s]*)?[:\s]*\d+/gi, "") // Taksit No: 3
        .replace(/\s{2,}/g, " ")
        .trim();
}

// ═══════════════════════════════════════════════════════════════
// 1. CATEGORIZATION RULES
// ═══════════════════════════════════════════════════════════════
const CATEGORY_RULES = {
    sabit_gider: {
        label: "Sabit Giderler", color: "#3b82f6", icon: "🏠",
        keywords: [
            "kira", "aidat", "doğalgaz", "doğal gaz", "elektrik", "su fatura",
            "internet", "telefon", "gsm", "turkcell", "vodafone", "türk telekom",
            "sigorta", "sgk", "vergi", "kasko", "trafik sig", "dask",
            "okul", "kreş", "öğrenim", "eğitim", "konut kred",
            "ipotek", "mortgage", "market", "migros", "bim", "a101", "şok",
            "carrefour", "metro", "makro", "eczane", "hastane", "sağlık",
            "benzin", "akaryakıt", "opet", "bp", "shell", "petrol", "otopark",
        ],
    },
    yasam_tarzi: {
        label: "Yaşam Tarzı (İstek)", color: "#f59e0b", icon: "🎯",
        keywords: [
            "restoran", "cafe", "kafe", "starbucks", "kahve", "yemek",
            "giyim", "zara", "h&m", "lcw", "mango", "boyner", "koton",
            "eğlence", "sinema", "tiyatro", "konser",
            "spor", "gym", "fitness",
            "kozmetik", "parfüm", "güzellik", "kuaför",
            "seyahat", "otel", "uçak", "tatil",
            "netflix", "spotify", "disney", "youtube", "amazon prime",
            "apple", "google play", "playstation", "xbox", "steam",
            "hepsiburada", "trendyol", "amazon", "n11", "getir", "yemeksepeti",
            "taksit", "alışveriş", "wolt", "iyzico", "paycell",
        ],
    },
    finansal_odeme: {
        label: "Finansal Ödemeler", color: "#ef4444", icon: "💳",
        keywords: [
            "kredi", "kredi kartı", "asgari", "borç", "taksit ödemesi",
            "ihtiyaç kred", "taşıt kred", "faiz",
            "hakedis", "banka", "eft", "havale", "ceza", "harç",
        ],
    },
    yatirim_firsati: {
        label: "Yatırım Fırsatı", color: "#10b981", icon: "📈",
        keywords: [
            "yatırım", "fon", "hisse", "borsa", "altın", "döviz",
            "kripto", "bitcoin", "ethereum", "bist",
            "mevduat", "vadeli", "emeklilik", "bes", "tahvil", "bono",
        ],
    },
};

// Lines/phrases to SKIP — not real transactions
const SKIP_PHRASES = [
    "kart limit", "kullanılabilir limit", "toplam borç", "dönem borcu",
    "asgari ödeme", "son ödeme", "hesap özeti", "ekstre tarihi",
    "müşteri no", "kart no", "tckn", "t.c.", "iban", "şube",
    "devir bakiye", "önceki dönem", "toplam tutar", "genel toplam",
    "faiz oranı", "gecikme faizi", "kalan taksit", "toplam taksit",
    "kampanya", "puan", "bonus", "mil", "nakit avans limit",
    "minimum ödeme", "hesap kesim", "ödeme tarihi", "son ödeme tarihi",
    "page", "sayfa", "hesap bilgileri", "kart bilgileri",
    "dönem sonu", "nakit avans", "toplam harcama",
    "kart limit", "güncel limit", "ek kart", "kullanılabilir",
    "ekstre borcu", "ekstre tarihi", "önceki ekstre", "ekstre bakiye",
    "bir önceki", "harcamalar ve", "yansıyan taksit", "bakiye transferi",
    "faiz, vergiler", "ücretler ve diğer", "ad soyad", "kart numarası",
    "ödeme - enpara", "ödeme-enpara", "cep şubesi", "internet şubesi",
];

// ═══════════════════════════════════════════════════════════════
// INSTALLMENT ENRICHMENT — Post-processing step
// Scans the FULL raw PDF text to find:
//   1. Installment fractions (X/Y like 05/12) near transaction descriptions
//   2. Multiple amounts on the same line (monthly vs total)
// This fixes the critical case where the bank shows the TOTAL purchase
// price on the installment line, not the monthly installment.
// ═══════════════════════════════════════════════════════════════
function enrichInstallmentData(rawText, transactions) {
    const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 5);

    return transactions.map(t => {
        const info = parseInstallmentInfo(t.description);

        // If parser already stored _possibleTotalAmount (from 2-amount line),
        // use it directly
        if (info && t._possibleTotalAmount && t._possibleTotalAmount > t.amount) {
            const enriched = { ...t };
            enriched.isInstallment = true;
            enriched.installmentCurrent = info.current;
            enriched.totalAmount = t._possibleTotalAmount;

            // Find installment total from fraction if available
            let foundTotal = info.total;
            if (!foundTotal) {
                foundTotal = findInstallmentTotal(lines, t.description, info.current);
            }
            enriched.installmentTotal = foundTotal;

            if (foundTotal && foundTotal > 1) {
                // Verify: parsed amount should be ~= totalAmount / total
                const expectedMonthly = Math.round((t._possibleTotalAmount / foundTotal) * 100) / 100;
                // If parsed amount is close to expected monthly (±10%), it's correct
                if (Math.abs(t.amount - expectedMonthly) / expectedMonthly < 0.10) {
                    enriched.amount = t.amount; // Already correct
                } else {
                    // Use calculated monthly
                    enriched.amount = expectedMonthly;
                }
            }
            // If total unknown but we have 2 amounts, the smaller IS the monthly
            // (already set by parser)

            delete enriched._possibleTotalAmount;
            return enriched;
        }

        // If installment detected but no _possibleTotalAmount, search raw text
        if (info) {
            const enriched = { ...t };
            enriched.isInstallment = true;
            enriched.installmentCurrent = info.current;
            enriched.installmentTotal = info.total;

            // Search for installment total if not known
            if (!info.total) {
                const foundTotal = findInstallmentTotal(lines, t.description, info.current);
                if (foundTotal) enriched.installmentTotal = foundTotal;
            }

            // Search raw text for the matching line to find multiple amounts
            const descKeywords = t.description.split(/\s+/)
                .filter(w => w.length > 3 && !/^\d+$/.test(w))
                .slice(0, 3)
                .map(w => w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

            if (descKeywords.length > 0) {
                for (const line of lines) {
                    const lowerLine = line.toLowerCase();
                    if (!descKeywords.every(kw => lowerLine.includes(kw))) continue;

                    // Found matching line — look for amounts
                    const amtMatches = [...line.matchAll(/([\d.]+,\d{2})/g)];
                    const amounts = amtMatches
                        .map(m => parseAmount(m[1]))
                        .filter(a => a > 0 && a < 200000)
                        .sort((a, b) => a - b);

                    if (amounts.length >= 2) {
                        // 2+ amounts found: smaller = monthly, larger = total
                        enriched.amount = amounts[0];
                        enriched.totalAmount = amounts[amounts.length - 1];
                        console.log(`[INSTALL] Enriched "${t.description}": monthly=${amounts[0]}, total=${amounts[amounts.length - 1]}`);
                        break;
                    }

                    // Only 1 amount — if we know the total installments, divide
                    if (amounts.length === 1 && enriched.installmentTotal && enriched.installmentTotal > 1) {
                        enriched.totalAmount = amounts[0];
                        enriched.amount = Math.round((amounts[0] / enriched.installmentTotal) * 100) / 100;
                        console.log(`[INSTALL] Divided "${t.description}": ${amounts[0]} / ${enriched.installmentTotal} = ${enriched.amount}`);
                        break;
                    }

                    break;
                }
            }

            delete enriched._possibleTotalAmount;
            return enriched;
        }

        // Not an installment — return as-is
        const clean = { ...t };
        delete clean._possibleTotalAmount;
        return clean;
    });
}

// Helper: search raw text lines for installment fraction X/Y matching a given current number
function findInstallmentTotal(lines, description, currentNum) {
    const descKeywords = description.split(/\s+/)
        .filter(w => w.length > 3 && !/^\d+$/.test(w))
        .slice(0, 3)
        .map(w => w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (descKeywords.length === 0) return null;

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (!descKeywords.every(kw => lowerLine.includes(kw))) continue;

        // Look for X/Y fractions on this line
        const fractions = [...line.matchAll(/(\d{1,2})\/(\d{1,2})/g)];
        for (const fm of fractions) {
            const cur = parseInt(fm[1]), tot = parseInt(fm[2]);
            if (cur === currentNum && tot >= cur && tot <= 60 && tot >= 2) {
                console.log(`[INSTALL] Found fraction ${cur}/${tot} for "${description}"`);
                return tot;
            }
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
// 2. UNIVERSAL PDF EXTRACTION ENGINE
//    Works with ALL bank formats using proximity matching
// ═══════════════════════════════════════════════════════════════
export async function extractTransactionsFromPDF(pdfBuffer) {
    let data;
    try {
        data = await pdf(pdfBuffer);
    } catch (err) {
        console.error("[PDF] Parse error:", err.message);
        return { transactions: [], bankDetected: "Okunamadı", totalParsed: 0, rawText: "", rawTextLength: 0, error: "PDF okunamadı: " + err.message };
    }

    const text = data.text || "";
    console.log(`[PDF] Extracted ${text.length} chars from ${data.numpages} pages`);

    // Debug: print first 30 non-empty lines
    const allLines = text.split("\n").map(l => l.trim()).filter(l => l.length > 3);
    console.log("[PDF] === RAW TEXT SAMPLE (first 30 lines) ===");
    allLines.slice(0, 30).forEach((l, i) => console.log(`[PDF] L${i}: "${l}"`));
    console.log("[PDF] === END SAMPLE ===");

    // Run ALL strategies, pick the BEST one based on score
    // First, detect where the transaction table starts
    const txSectionStart = findTransactionSectionStart(text);
    const txText = txSectionStart > 0 ? text.substring(txSectionStart) : text;
    console.log(`[PDF] Transaction section starts at char ${txSectionStart} (total ${text.length})`);

    const strategies = [
        { name: "Enpara Regex", fn: () => parseEnparaSpecific(txText) },
        { name: "Proximity Match", fn: () => parseByProximity(txText) },
        { name: "Line-by-Line (Full Date)", fn: () => parseLineByLine(txText, true) },
        { name: "Line-by-Line (Short Date)", fn: () => parseLineByLine(txText, false) },
        { name: "Amount-Only Fallback", fn: () => parseAmountOnly(txText) },
    ];

    let best = { txns: [], name: "Okunamadı", score: -1 };

    for (const s of strategies) {
        try {
            const txns = s.fn();
            const score = calculateScore(txns); // Use scoring to avoid "today" fallback winning
            console.log(`[PDF] Strategy "${s.name}" → ${txns.length} txns (Score: ${score})`);

            if (score > best.score) {
                best = { txns, name: s.name, score };
            }
        } catch (e) {
            console.error(`[PDF] Strategy "${s.name}" failed:`, e.message);
        }
    }

    // Deduplicate
    const seen = new Set();
    const deduped = best.txns.filter(t => {
        if (t.amount <= 0 || !t.description || t.description.length < 2) return false;
        // Create unique key: description(20chars)_amount_date
        const key = `${t.description.substring(0, 20)}_${t.amount}_${t.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // ── POST-PROCESS: Enrich installment data from raw text ──
    const transactions = enrichInstallmentData(text, deduped);

    console.log(`[PDF] ✅ Final: ${transactions.length} transactions (strategy: ${best.name})`);
    transactions.forEach(t => {
        const tag = t.isInstallment ? ` [TAKSİT ${t.installmentCurrent}/${t.installmentTotal || "?"}]` : "";
        console.log(`[PDF]   ${t.date.substring(0, 10)} | ${t.description}${tag} | ${t.amount}${t.totalAmount ? " (toplam:" + t.totalAmount + ")" : ""}`);
    });

    return {
        transactions,
        bankDetected: best.name,
        totalParsed: transactions.length,
        rawText: text.substring(0, 3000),
        rawTextLength: text.length,
    };
}

function calculateScore(txns) {
    if (!txns || txns.length === 0) return 0;

    const today = new Date().toISOString().split("T")[0];
    const uniqueDates = new Set(txns.map(t => t.date.split("T")[0]));

    // HEAVILY favor strategies that find real dates (not today)
    // If a strategy finds dates other than today, give it a HUGE bonus
    const hasRealDates = Array.from(uniqueDates).some(d => d !== today);
    const dateBonus = hasRealDates ? 1000 : 0;

    // Favor more transactions, but date validity is paramount
    return txns.length + dateBonus;
}

// ─────────────────────────────────────────────────────────────
// STRATEGY 0: ENPARA SPECIFIC REGEX
//   Handles dd/mm/yyyy date + whitespace + desc + amount + TL
//   Also removes ')))' icons
// ─────────────────────────────────────────────────────────────
function parseEnparaSpecific(text) {
    const txns = [];
    const lines = text.split("\n");

    // Regex for Enpara line: 06/01/2026 ... DESC ... 12.717,95 TL
    // Supports negative amounts (returns/payments)
    const regex = /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+(-?[\d\.,]+)\s*TL/;

    for (const line of lines) {
        const t = line.trim();
        if (t.length < 10 || isSkipPhrase(t)) continue;

        const match = t.match(regex);
        if (!match) continue;

        const dateStr = match[1];
        let desc = match[2].trim();
        const amtStr = match[3];

        // Parse date: dd/mm/yyyy
        const [day, month, year] = dateStr.split("/").map(Number);

        // Parse amount
        const amount = parseAmount(amtStr);
        // Ignore very large amounts (likely totals/limits)
        if (amount <= 0 || amount >= 500000) continue;

        // Clean description: remove icons like ')))' and extra spaces
        desc = desc.replace(/[)\s]+$/, "").replace(/^[)\s]+/, "").replace(/\){2,}/g, "").trim();
        desc = desc.replace(/^\d+\s*/, "").replace(/[*\/\-]+$/, "").trim();

        if (desc.length < 2 || isSkipPhrase(desc)) continue;
        if (desc.length > 80) desc = desc.substring(0, 80);

        txns.push({
            date: safeDate(year, month - 1, day),
            description: desc,
            amount,
            currency: "TL"
        });
    }
    return txns;
}

// ─────────────────────────────────────────────────────────────
// STRATEGY 1: PROXIMITY MATCHING (Universal)
//   Scan entire text for dates and amounts by position,
//   then match each date with the nearest amount.
//   Works regardless of column layout or line breaks.
// ─────────────────────────────────────────────────────────────
function parseByProximity(text) {
    // Find all dates in text with positions
    const dateRegex = /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/g;
    const dates = [];
    let dm;
    while ((dm = dateRegex.exec(text)) !== null) {
        const day = parseInt(dm[1]);
        const month = parseInt(dm[2]);
        let year = parseInt(dm[3]);
        if (year < 100) year += 2000;
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2030) {
            dates.push({ pos: dm.index, end: dm.index + dm[0].length, day, month, year, raw: dm[0] });
        }
    }

    // Find all Turkish-format amounts (e.g., 1.234,56 or 234,56)
    const amountRegex = /([\d.]+,\d{2})/g;
    const amounts = [];
    let am;
    while ((am = amountRegex.exec(text)) !== null) {
        // Check if this amount is inside parentheses (e.g., "(996,99 TL)")
        const prefix = text.substring(Math.max(0, am.index - 5), am.index);
        if (prefix.includes("(")) continue; // SKIP parenthesized amounts (usually installment totals)

        const val = parseAmount(am[1]);
        if (val > 0 && val < 200000) {
            amounts.push({ pos: am.index, end: am.index + am[0].length, value: val, raw: am[1] });
        }
    }

    console.log(`[PDF/Proximity] Found ${dates.length} dates, ${amounts.length} amounts`);

    const txns = [];
    const usedAmounts = new Set();
    const MAX_DIST = 400; // Increased to catch wide column layouts

    for (const date of dates) {
        // Find ALL amounts AFTER this date within MAX_DIST chars
        const nearbyAmounts = [];
        for (let i = 0; i < amounts.length; i++) {
            if (usedAmounts.has(i)) continue;
            const dist = amounts[i].pos - date.end;
            if (dist > 0 && dist < MAX_DIST) {
                nearbyAmounts.push({ idx: i, dist, value: amounts[i].value, raw: amounts[i].raw });
            }
        }
        nearbyAmounts.sort((a, b) => a.dist - b.dist);

        if (nearbyAmounts.length === 0) continue;

        // Extract description: text between date and first amount
        const firstAmtIdx = nearbyAmounts[0].idx;
        let desc = text.substring(date.end, amounts[firstAmtIdx].pos).trim();
        desc = desc.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
        desc = desc.replace(/\d{1,2}[.\/-]\d{1,2}(?:[.\/-]\d{2,4})?\s*/g, "").trim();
        desc = desc.replace(/[*\/\-]+$/, "").trim();
        desc = desc.replace(/\s+\d{6,}$/, "").trim();

        if (desc.length < 2 || isSkipPhrase(desc)) continue;
        if (desc.length > 80) desc = desc.substring(0, 80);

        // Check if this is an installment transaction
        const installInfo = parseInstallmentInfo(desc);
        let selectedAmount, secondaryAmount;

        if (installInfo && nearbyAmounts.length >= 2) {
            // Installment with 2+ amounts: smaller = monthly, larger = total
            const sorted = [...nearbyAmounts].sort((a, b) => a.value - b.value);
            selectedAmount = sorted[0].value;
            secondaryAmount = sorted[sorted.length - 1].value;
            usedAmounts.add(sorted[0].idx);
            usedAmounts.add(sorted[sorted.length - 1].idx);
        } else {
            selectedAmount = nearbyAmounts[0].value;
            usedAmounts.add(nearbyAmounts[0].idx);
        }

        if (selectedAmount <= 0 || selectedAmount >= 200000) continue;

        const txn = {
            date: safeDate(date.year, date.month - 1, date.day),
            description: desc,
            amount: selectedAmount,
            currency: "TL",
        };

        if (secondaryAmount && secondaryAmount > selectedAmount) {
            txn._possibleTotalAmount = secondaryAmount;
        }

        txns.push(txn);
    }

    return txns;
}

// ─────────────────────────────────────────────────────────────
// STRATEGY 2: LINE-BY-LINE (with full or short dates)
// ─────────────────────────────────────────────────────────────
function parseLineByLine(text, requireFullDate) {
    const txns = [];
    const lines = text.split("\n");
    const currentYear = new Date().getFullYear();

    for (const line of lines) {
        const t = line.trim();
        if (t.length < 8 || isSkipPhrase(t)) continue;

        let dateMatch, year, month, day;

        if (requireFullDate) {
            // dd.mm.yyyy or dd/mm/yyyy
            dateMatch = t.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
            if (!dateMatch) continue;
            day = parseInt(dateMatch[1]); month = parseInt(dateMatch[2]); year = parseInt(dateMatch[3]);
        } else {
            // dd.mm or dd.mm.yy
            dateMatch = t.match(/(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?/);
            if (!dateMatch) continue;
            day = parseInt(dateMatch[1]); month = parseInt(dateMatch[2]);
            year = dateMatch[3] ? parseInt(dateMatch[3]) : currentYear;
            if (year < 100) year += 2000;
        }

        if (month < 1 || month > 12 || day < 1 || day > 31) continue;
        // Validate day against actual days in month (fixes Feb 31 bug)
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day > daysInMonth) continue;

        // Find amount(s) in the line
        const amtMatches = [...t.matchAll(/([\d.]+,\d{2})/g)];
        if (amtMatches.length === 0) continue;

        // Description: text between date and first amount
        const dateEnd = dateMatch.index + dateMatch[0].length;
        const firstAmtStart = amtMatches[0].index;
        let desc = t.substring(dateEnd, firstAmtStart).trim();
        // Remove secondary dates
        desc = desc.replace(/\d{1,2}[.\/-]\d{1,2}(?:[.\/-]\d{2,4})?\s*/g, "").trim();
        desc = desc.replace(/\s+/g, " ");
        desc = desc.replace(/\s+\d{6,}$/, "").trim();
        desc = desc.replace(/[*\/\-]+$/, "").trim();

        if (desc.length < 2 || isSkipPhrase(desc)) continue;
        if (desc.length > 80) desc = desc.substring(0, 80);

        // Smart amount selection for installment lines
        const installInfo = parseInstallmentInfo(desc);
        let amount, secondaryAmount;

        if (installInfo && amtMatches.length >= 2) {
            // Installment line with 2+ amounts:
            //   smaller = monthly installment, larger = total purchase price
            const parsedAmts = amtMatches.map(m => parseAmount(m[1])).filter(a => a > 0 && a < 200000).sort((a, b) => a - b);
            if (parsedAmts.length >= 2) {
                amount = parsedAmts[0]; // monthly (smaller)
                secondaryAmount = parsedAmts[parsedAmts.length - 1]; // total (larger)
            } else {
                amount = parsedAmts[0] || parseAmount(amtMatches[amtMatches.length - 1][1]);
            }
        } else {
            // Non-installment: use LAST amount (standard behavior)
            amount = parseAmount(amtMatches[amtMatches.length - 1][1]);
        }

        if (!amount || amount <= 0 || amount >= 200000) continue;

        const txn = {
            date: safeDate(year, month - 1, day),
            description: desc,
            amount,
            currency: "TL",
        };

        if (secondaryAmount && secondaryAmount > amount) {
            txn._possibleTotalAmount = secondaryAmount;
        }

        txns.push(txn);
    }

    return txns;
}

// ─────────────────────────────────────────────────────────────
// STRATEGY 3: AMOUNT-ONLY FALLBACK (no dates found)
// ─────────────────────────────────────────────────────────────
function parseAmountOnly(text) {
    const txns = [];
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 3);

    for (let i = 0; i < lines.length; i++) {
        if (isSkipPhrase(lines[i])) continue;
        const amounts = [...lines[i].matchAll(/([\d.]+,\d{2})/g)];
        if (amounts.length === 0) continue;

        const lastAmt = amounts[amounts.length - 1];
        const amount = parseAmount(lastAmt[1]);
        if (amount <= 0 || amount >= 200000) continue;

        let desc = lines[i].substring(0, amounts[0].index).trim();
        desc = desc.replace(/\d{1,2}[.\/-]\d{1,2}(?:[.\/-]\d{2,4})?/g, "").trim();
        desc = desc.replace(/^\d+\s*/, "").trim();

        if (desc.length < 2 && i > 0) {
            desc = lines[i - 1].replace(/\d{1,2}[.\/-]\d{1,2}(?:[.\/-]\d{2,4})?/g, "").trim();
        }

        if (desc.length > 1 && !/^\d+$/.test(desc) && !isSkipPhrase(desc)) {
            if (desc.length > 80) desc = desc.substring(0, 80);
            txns.push({ date: new Date().toISOString(), description: desc, amount, currency: "TL" });
        }
    }

    return txns;
}

// ═══════════════════════════════════════════════════════════════
// 3. CATEGORIZATION
// ═══════════════════════════════════════════════════════════════
export function categorizeTransactions(transactions) {
    return transactions.map(t => {
        const lower = (t.description || "").toLowerCase();
        let category = "yasam_tarzi"; // default
        for (const [key, cat] of Object.entries(CATEGORY_RULES)) {
            if (cat.keywords.some(kw => lower.includes(kw))) { category = key; break; }
        }
        return { ...t, category, categoryLabel: CATEGORY_RULES[category].label, categoryColor: CATEGORY_RULES[category].color, categoryIcon: CATEGORY_RULES[category].icon };
    });
}

// ═══════════════════════════════════════════════════════════════
// 4. BURN RATE
// ═══════════════════════════════════════════════════════════════
export function calculateBurnRate(monthlyIncome, transactions) {
    const totalExpense = transactions.reduce((s, t) => s + t.amount, 0);
    if (totalExpense <= 0) return { burnDay: null, dailyBurn: 0, daysRemaining: 30, status: "safe", totalExpense: 0, monthlyIncome, savingsRate: 100 };

    const dailyBurn = totalExpense / 30;
    const burnDay = Math.min(Math.ceil(monthlyIncome / dailyBurn), 30);
    const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - totalExpense) / monthlyIncome) * 100) : 0;

    return {
        burnDay, dailyBurn: Math.round(dailyBurn * 100) / 100,
        daysRemaining: Math.max(0, burnDay - new Date().getDate()),
        totalExpense, monthlyIncome, savingsRate,
        status: burnDay <= 15 ? "critical" : burnDay <= 22 ? "warning" : burnDay <= 28 ? "caution" : "safe",
    };
}

// ═══════════════════════════════════════════════════════════════
// 5. OPPORTUNITY COST — Real Prices via Tiingo (SPY, GLD, QQQ)
// ═══════════════════════════════════════════════════════════════
export async function calculateOpportunityCost(monthlyIncome) {
    const monthlySavings = Math.round(monthlyIncome * 0.20); // Always 20% of income

    const assets = [
        { key: "sp500", symbol: "SPY", label: "S&P 500", icon: "📊" },
        { key: "gold", symbol: "GLD", label: "Altın (GLD)", icon: "🥇" },
        { key: "nasdaq", symbol: "QQQ", label: "Nasdaq 100", icon: "💻" },
    ];

    const projections = {};

    for (const asset of assets) {
        const returns = await fetchRealReturns(asset.symbol);
        projections[asset.key] = {
            label: asset.label, icon: asset.icon,
            year1: buildProjection(monthlySavings, returns.year1, 1, returns.price1yAgo, returns.priceNow),
            year5: buildProjection(monthlySavings, returns.year5, 5, returns.price5yAgo, returns.priceNow),
            year10: buildProjection(monthlySavings, returns.year10, 10, returns.price10yAgo, returns.priceNow),
        };
    }

    return { monthlySavings, projections };
}

async function fetchRealReturns(symbol) {
    const fallback = { year1: 0.10, year5: 0.10, year10: 0.10, priceNow: null, price1yAgo: null, price5yAgo: null, price10yAgo: null };
    if (!TIINGO_API_KEY) return fallback;

    try {
        const now = new Date();
        const fmt = (d) => d.toISOString().split("T")[0];
        const y1 = new Date(now); y1.setFullYear(y1.getFullYear() - 1);
        const y5 = new Date(now); y5.setFullYear(y5.getFullYear() - 5);
        const y10 = new Date(now); y10.setFullYear(y10.getFullYear() - 10);

        const [res1, res5, res10, resNow] = await Promise.all([
            axios.get(`https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${fmt(y1)}&endDate=${fmt(y1)}&token=${TIINGO_API_KEY}`, { timeout: 5000 }).catch(() => ({ data: [] })),
            axios.get(`https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${fmt(y5)}&endDate=${fmt(y5)}&token=${TIINGO_API_KEY}`, { timeout: 5000 }).catch(() => ({ data: [] })),
            axios.get(`https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${fmt(y10)}&endDate=${fmt(y10)}&token=${TIINGO_API_KEY}`, { timeout: 5000 }).catch(() => ({ data: [] })),
            axios.get(`https://api.tiingo.com/iex/?tickers=${symbol}&token=${TIINGO_API_KEY}`, { timeout: 5000 }).catch(() => ({ data: [] })),
        ]);

        const priceNow = resNow.data?.[0]?.last || resNow.data?.[0]?.tngoLast || null;
        const price1yAgo = res1.data?.[0]?.close || null;
        const price5yAgo = res5.data?.[0]?.close || null;
        const price10yAgo = res10.data?.[0]?.close || null;

        const calcReturn = (old, current, years) => {
            if (!old || !current || old <= 0) return null;
            return Math.pow(current / old, 1 / years) - 1;
        };

        return {
            year1: calcReturn(price1yAgo, priceNow, 1) ?? fallback.year1,
            year5: calcReturn(price5yAgo, priceNow, 5) ?? fallback.year5,
            year10: calcReturn(price10yAgo, priceNow, 10) ?? fallback.year10,
            priceNow, price1yAgo, price5yAgo, price10yAgo,
        };
    } catch (err) {
        console.error(`[OpportunityCost] Tiingo fetch failed for ${symbol}:`, err.message);
        return fallback;
    }
}

function buildProjection(monthlySavings, annualReturn, years, priceOld, priceNow) {
    const monthlyRate = annualReturn / 12;
    const totalMonths = years * 12;
    const futureValue = monthlySavings * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    const totalInvested = monthlySavings * totalMonths;

    return {
        futureValue: Math.round(futureValue),
        totalInvested: Math.round(totalInvested),
        totalGain: Math.round(futureValue - totalInvested),
        annualReturn: `${(annualReturn * 100).toFixed(1)}%`,
        priceOld: priceOld ? Math.round(priceOld * 100) / 100 : null,
        priceNow: priceNow ? Math.round(priceNow * 100) / 100 : null,
    };
}

// ═══════════════════════════════════════════════════════════════
// 6. ZOMBIE SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════
export function detectZombieSubscriptions(transactions) {
    const descMap = {};
    transactions.forEach(t => {
        const key = `${(t.description || "").toLowerCase().replace(/[\d.\-]/g, "").trim().substring(0, 20)}_${t.amount}`;
        if (!descMap[key]) descMap[key] = { description: t.description, amount: t.amount, count: 0, dates: [] };
        descMap[key].count++;
        descMap[key].dates.push(t.date);
    });

    const zombies = Object.values(descMap)
        .filter(z => z.count >= 2 && z.amount <= 500 && z.amount > 0)
        .sort((a, b) => b.count - a.count)
        .map(z => ({
            ...z, monthlyWaste: z.amount, yearlyWaste: z.amount * 12,
            severity: z.amount * 12 > 2000 ? "high" : z.amount * 12 > 500 ? "medium" : "low",
        }));

    return {
        zombies,
        totalMonthlyWaste: zombies.reduce((s, z) => s + z.monthlyWaste, 0),
        totalYearlyWaste: zombies.reduce((s, z) => s + z.yearlyWaste, 0),
        count: zombies.length,
    };
}

// ═══════════════════════════════════════════════════════════════
// 7. HEATMAP — Month-by-month, with full daysInMonth
// ═══════════════════════════════════════════════════════════════
export function generateHeatmapData(transactions) {
    const monthMap = {};

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return;
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const day = d.getDate();

        if (!monthMap[monthKey]) {
            monthMap[monthKey] = {
                month: monthKey,
                label: formatMonthLabel(d),
                daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
                days: {},
                totalSpend: 0,
            };
        }
        if (!monthMap[monthKey].days[day]) {
            monthMap[monthKey].days[day] = { day, total: 0, count: 0, transactions: [] };
        }
        monthMap[monthKey].days[day].total += t.amount;
        monthMap[monthKey].days[day].count++;
        monthMap[monthKey].days[day].transactions.push(t.description);
        monthMap[monthKey].totalSpend += t.amount;
    });

    return Object.values(monthMap)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(m => {
            const dayArray = [];
            const maxSpend = Math.max(...Object.values(m.days).map(d => d.total), 1);
            for (let i = 1; i <= m.daysInMonth; i++) {
                const dayData = m.days[i] || { day: i, total: 0, count: 0, transactions: [] };
                dayArray.push({ ...dayData, intensity: dayData.total / maxSpend, total: Math.round(dayData.total * 100) / 100 });
            }
            return { ...m, days: dayArray, totalSpend: Math.round(m.totalSpend) };
        });
}

function formatMonthLabel(date) {
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ═══════════════════════════════════════════════════════════════
// 8. CATEGORY BREAKDOWN (TreeMap)
// ═══════════════════════════════════════════════════════════════
export function getCategoryBreakdown(transactions) {
    const breakdown = {};
    transactions.forEach(t => {
        const cat = t.category || "yasam_tarzi";
        if (!breakdown[cat]) {
            breakdown[cat] = { name: CATEGORY_RULES[cat]?.label || cat, color: CATEGORY_RULES[cat]?.color || "#999", icon: CATEGORY_RULES[cat]?.icon || "📦", total: 0, count: 0, items: [] };
        }
        breakdown[cat].total += t.amount;
        breakdown[cat].count++;
        breakdown[cat].items.push({ description: t.description, amount: t.amount });
    });

    return Object.entries(breakdown).map(([key, val]) => ({
        key, ...val, total: Math.round(val.total * 100) / 100,
    })).sort((a, b) => b.total - a.total);
}

// ═══════════════════════════════════════════════════════════════
// 9. FULL ANALYSIS PIPELINE
// ═══════════════════════════════════════════════════════════════
export async function runFullAnalysis(transactions, monthlyIncome) {
    // Normalize installments first
    const normalized = normalizeTransactions(transactions);
    const categorized = categorizeTransactions(normalized);
    // Only count expenses for burn rate (exclude income-type transactions)
    const expenseOnly = categorized.filter(t => t.type !== "income");
    const burnRate = calculateBurnRate(monthlyIncome, expenseOnly);
    const opportunityCost = await calculateOpportunityCost(monthlyIncome);
    const zombieSubscriptions = detectZombieSubscriptions(expenseOnly);
    const heatmapData = generateHeatmapData(expenseOnly);
    const categoryBreakdown = getCategoryBreakdown(expenseOnly);

    const totalExpense = expenseOnly.reduce((s, t) => s + t.amount, 0);
    const gaugeValue = monthlyIncome > 0 ? Math.round(((monthlyIncome - totalExpense) / monthlyIncome) * 100) : 0;

    return {
        transactions: categorized,
        metrics: {
            monthlyIncome,
            totalExpense: Math.round(totalExpense * 100) / 100,
            netBalance: Math.round((monthlyIncome - totalExpense) * 100) / 100,
            gaugeValue: Math.max(-100, Math.min(100, gaugeValue)),
            burnRate, opportunityCost, zombieSubscriptions,
        },
        charts: { heatmapData, categoryBreakdown },
        summary: {
            transactionCount: categorized.length,
            categoryCount: categoryBreakdown.length,
            healthStatus: gaugeValue >= 20 ? "healthy" : gaugeValue >= 0 ? "warning" : "critical",
            topCategory: categoryBreakdown.length > 0 ? categoryBreakdown[0].name : "N/A",
        },
    };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function isSkipPhrase(line) {
    const lower = line.toLowerCase();
    return SKIP_PHRASES.some(kw => lower.includes(kw));
}

function safeDate(year, month, day) {
    try {
        // Clamp day to actual days in month (month is 0-indexed here)
        const maxDay = new Date(year, month + 1, 0).getDate();
        const clampedDay = Math.min(day, maxDay);
        const d = new Date(year, month, clampedDay);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch { return new Date().toISOString(); }
}

function findTransactionSectionStart(text) {
    const headers = [
        "işlem tarihi", "tarih açıklama", "harcama detayları",
        "dönem içi harcamalar", "ekstre detayları", "işlem detayları"
    ];
    const lower = text.toLowerCase();
    for (const h of headers) {
        const idx = lower.indexOf(h);
        if (idx !== -1) return idx + h.length; // Return index after the header
    }
    return 0;
}

function parseAmount(str) {
    if (!str) return 0;
    let c = str.replace(/\s/g, "");
    // Turkish format: 1.234,56 → 1234.56
    if (c.includes(",") && c.includes(".")) c = c.replace(/\./g, "").replace(",", ".");
    else if (c.includes(",")) c = c.replace(",", ".");
    c = c.replace(/[^\d.]/g, "");
    return parseFloat(c) || 0;
}

export { CATEGORY_RULES };
