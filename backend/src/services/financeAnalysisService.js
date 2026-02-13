// PATH: backend/src/services/financeAnalysisService.js
// Personal Finance & Expense Analysis Engine
// Universal PDF Parser — Works with ALL Turkish bank statements
// -----------------------------------------------------------

import { createRequire } from "module";
import axios from "axios";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

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
    const transactions = best.txns.filter(t => {
        if (t.amount <= 0 || !t.description || t.description.length < 2) return false;
        // Create unique key: description(20chars)_amount_date
        const key = `${t.description.substring(0, 20)}_${t.amount}_${t.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`[PDF] ✅ Final: ${transactions.length} transactions (strategy: ${best.name})`);
    if (transactions.length > 0) {
        console.log(`[PDF] First: ${transactions[0].date} | ${transactions[0].description} | ${transactions[0].amount}`);
        console.log(`[PDF] Last:  ${transactions[transactions.length - 1].date} | ${transactions[transactions.length - 1].description} | ${transactions[transactions.length - 1].amount}`);
    }

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
        // Find the nearest amount AFTER this date (within MAX_DIST chars)
        let bestAmt = null;
        let bestDist = Infinity;

        for (let i = 0; i < amounts.length; i++) {
            if (usedAmounts.has(i)) continue;
            const dist = amounts[i].pos - date.end;
            if (dist > 0 && dist < MAX_DIST && dist < bestDist) {
                bestDist = dist;
                bestAmt = i;
            }
        }

        if (bestAmt === null) continue;

        // Extract description: text between date and amount
        let desc = text.substring(date.end, amounts[bestAmt].pos).trim();
        // Clean up: remove extra whitespace, newlines
        desc = desc.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
        // Remove secondary dates (like valör tarihi)
        desc = desc.replace(/\d{1,2}[.\/-]\d{1,2}(?:[.\/-]\d{2,4})?\s*/g, "").trim();
        // Remove trailing special chars
        desc = desc.replace(/[*\/\-]+$/, "").trim();
        // Remove reference numbers at end
        desc = desc.replace(/\s+\d{6,}$/, "").trim();

        if (desc.length < 2 || isSkipPhrase(desc)) continue;
        if (desc.length > 80) desc = desc.substring(0, 80);

        const amount = amounts[bestAmt].value;
        usedAmounts.add(bestAmt);

        txns.push({
            date: safeDate(date.year, date.month - 1, date.day),
            description: desc,
            amount,
            currency: "TL",
        });
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

        // Find amount(s) in the line
        const amtMatches = [...t.matchAll(/([\d.]+,\d{2})/g)];
        if (amtMatches.length === 0) continue;

        // Use the last amount (usually the transaction amount, not balance)
        const lastAmt = amtMatches[amtMatches.length - 1];
        const amount = parseAmount(lastAmt[1]);
        if (amount <= 0 || amount >= 200000) continue;

        // Description: text between date and amount
        const dateEnd = dateMatch.index + dateMatch[0].length;
        const amtStart = lastAmt.index;
        let desc = t.substring(dateEnd, amtStart).trim();
        // Remove secondary dates
        desc = desc.replace(/\d{1,2}[.\/-]\d{1,2}(?:[.\/-]\d{2,4})?\s*/g, "").trim();
        desc = desc.replace(/\s+/g, " ");
        desc = desc.replace(/\s+\d{6,}$/, "").trim();
        desc = desc.replace(/[*\/\-]+$/, "").trim();

        if (desc.length < 2 || isSkipPhrase(desc)) continue;
        if (desc.length > 80) desc = desc.substring(0, 80);

        txns.push({
            date: safeDate(year, month - 1, day),
            description: desc,
            amount,
            currency: "TL",
        });
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
    const categorized = categorizeTransactions(transactions);
    const burnRate = calculateBurnRate(monthlyIncome, categorized);
    const opportunityCost = await calculateOpportunityCost(monthlyIncome);
    const zombieSubscriptions = detectZombieSubscriptions(categorized);
    const heatmapData = generateHeatmapData(categorized);
    const categoryBreakdown = getCategoryBreakdown(categorized);

    const totalExpense = categorized.reduce((s, t) => s + t.amount, 0);
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
    try { const d = new Date(year, month, day); return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); }
    catch { return new Date().toISOString(); }
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
