// PATH: backend/src/services/financeAnalysisService.js
/**
 * Personal Finance Analysis Service — v2 (Metric-Driven)
 * 
 * Pipeline:
 *   1. AI parses raw PDF → structured JSON transactions
 *   2. Server calculates ALL financial metrics (ratios, thresholds, scores)
 *   3. AI receives pre-calculated metrics → generates ACCURATE commentary
 * 
 * This ensures AI never invents numbers — it only interprets what we compute.
 */

import { invokeClaude } from "./bedrockService.js";

// ════════════════════════════════════════════════════════════════
// FINANCIAL THRESHOLDS & BENCHMARKS
// ════════════════════════════════════════════════════════════════
const THRESHOLDS = {
    // Gider/Gelir oranı sınıflandırması
    expenseRatio: {
        excellent: 0.50,   // ≤50% → Mükemmel
        good: 0.65,        // ≤65% → İyi
        moderate: 0.80,    // ≤80% → Orta
        high: 0.90,        // ≤90% → Yüksek
        // >90% → Kritik
    },
    // Tasarruf oranı sınıflandırması
    savingsRate: {
        excellent: 30,     // ≥30% → Mükemmel
        good: 20,          // ≥20% → İyi (50/30/20 kuralı hedefi)
        moderate: 10,      // ≥10% → Orta
        low: 5,            // ≥5%  → Düşük
        // <5% → Kritik
    },
    // Tek kategori dominansı (bir kategori toplam giderin X%'inden fazlaysa uyar)
    categoryDominance: 0.40,   // %40'tan fazla → uyarı
    // Zorunlu gider oranı (sabit giderler gelirin X%'inden fazlaysa uyar)
    fixedExpenseWarn: 0.50,    // %50'den fazla → uyarı
    // Acil durum fonu hedefi (aylık giderin kaç katı)
    emergencyFundMonths: 3,
};

/**
 * Classify a ratio against thresholds
 */
function classifyExpenseRatio(ratio) {
    if (ratio <= THRESHOLDS.expenseRatio.excellent) return { level: "MÜKEMMEL", emoji: "🟢", detail: "Harcama kontrolü mükemmel" };
    if (ratio <= THRESHOLDS.expenseRatio.good) return { level: "İYİ", emoji: "🟢", detail: "Sağlıklı harcama dengesi" };
    if (ratio <= THRESHOLDS.expenseRatio.moderate) return { level: "ORTA", emoji: "🟡", detail: "Harcamalar takip edilmeli" };
    if (ratio <= THRESHOLDS.expenseRatio.high) return { level: "YÜKSEK", emoji: "🟠", detail: "Giderler gelire yakın, tasarruf alanı dar" };
    return { level: "KRİTİK", emoji: "🔴", detail: "Harcamalar geliri aşıyor veya çok yakın" };
}

function classifySavingsRate(rate) {
    if (rate >= THRESHOLDS.savingsRate.excellent) return { level: "MÜKEMMEL", emoji: "🟢" };
    if (rate >= THRESHOLDS.savingsRate.good) return { level: "İYİ", emoji: "🟢" };
    if (rate >= THRESHOLDS.savingsRate.moderate) return { level: "ORTA", emoji: "🟡" };
    if (rate >= THRESHOLDS.savingsRate.low) return { level: "DÜŞÜK", emoji: "🟠" };
    return { level: "KRİTİK", emoji: "🔴" };
}

// ════════════════════════════════════════════════════════════════
// STEP 1: AI PARSING (Haiku)
// ════════════════════════════════════════════════════════════════

/**
 * Parse bank statement text into structured transactions using HAIKU
 */
export async function parseStatementWithAI(statementText) {
    const systemPrompt = `Sen bir Türk banka ekstresi ayrıştırıcısın. PDF'den çıkarılan ham metni analiz edip JSON formatında döndür.
SADECE geçerli JSON döndür, başka hiçbir metin yazma.

KRİTİK KURALLAR:
1. Kredi kartı ekstrelerinde:
   - "ÖDEME" veya "ALACAK" satırları → type: "income" (kart ödemesi/iade)
   - Diğer tüm satırlar → type: "expense"
   - TAKSİT ifadesi varsa (ör: "2/6 TAKSİT") → sadece O AYki taksit tutarını yaz, toplam tutarı DEĞİL
2. EFT/Havale gelen → type: "income"
3. Maaş, ikramiye → type: "income"
4. İade, cashback → type: "income"
5. Aynı yere birden fazla ödeme varsa HER BİRİNİ ayrı satır olarak yaz
6. Tüm tutarlar POZİTİF sayı olarak yaz. type alanı gelir/gider ayrımını yapar.

Döndürülecek JSON:
{
  "bankName": "Banka adı",
  "accountHolder": "Hesap sahibi veya null",
  "period": "Ekstre dönemi (ör: Ocak 2026)",
  "currency": "TRY",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "İşlem açıklaması (kısa ve net)",
      "amount": 1234.56,
      "type": "expense|income",
      "category": "market|kira|fatura|ulasim|yeme_icme|giyim|saglik|egitim|eglence|teknoloji|finansal_odeme|gelir|diger"
    }
  ],
  "summary": {
    "totalIncome": 0,
    "totalExpense": 0,
    "netBalance": 0,
    "transactionCount": 0
  }
}

KATEGORİ KURALLARI:
- market: A101, BİM, Migros, CarrefourSA, ŞOK, Macro Center, bakkal
- kira: Kira, aidat
- fatura: Elektrik, su, doğalgaz, internet, telefon, turkcell, vodafone, türk telekom, ISKI, IGDAS
- ulasim: Shell, BP, Opet, benzin, otobüs, metro, taksi, BiTaksi, Uber, HGS, OGS, araç bakım, sigorta (kasko/trafik)
- yeme_icme: Restoran, kafe, Starbucks, yemeksepeti, getir yemek, McDonald's, Burger King, pizza
- giyim: Zara, H&M, LC Waikiki, Koton, DeFacto, Mavi, ayakkabı
- saglik: Eczane, hastane, doktor, medikal
- egitim: Okul, kurs, Udemy, kitap, D&R
- eglence: Netflix, Spotify, Disney+, sinema, konser, oyun, Steam, PlayStation
- teknoloji: Hepsiburada, Trendyol (elektronik), Apple, Samsung, yazılım aboneliği
- finansal_odeme: Kredi taksiti, kredi kartı borcu, sigorta primi, BES, yatırım
- gelir: Maaş, EFT gelen, havale gelen, iade, cashback, faiz
- diger: Yukarıdakilere uymayan

ÖNEMLİ: summary alanındaki totalIncome ve totalExpense değerlerini transactions dizisindeki tutarları toplayarak DOĞRU hesapla. netBalance = totalIncome - totalExpense.`;

    try {
        const result = await invokeClaude(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Bu banka/kredi kartı ekstresini analiz et ve JSON formatında döndür:\n\n${statementText}` }
            ],
            {
                temperature: 0,
                max_tokens: 4096,
                model: "haiku"
            }
        );

        const rawText = (result.choices?.[0]?.message?.content || "").trim();

        // Extract JSON from response
        let jsonStr = rawText;
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        const parsed = JSON.parse(jsonStr);

        // SERVER-SIDE VALIDATION: Recalculate summary from transactions
        if (parsed.transactions?.length > 0) {
            let totalIncome = 0;
            let totalExpense = 0;
            for (const tx of parsed.transactions) {
                if (tx.type === "income") {
                    totalIncome += Number(tx.amount) || 0;
                } else {
                    totalExpense += Number(tx.amount) || 0;
                }
            }
            // Override AI's summary with our calculation (AI can miscalculate)
            parsed.summary = {
                totalIncome: Math.round(totalIncome * 100) / 100,
                totalExpense: Math.round(totalExpense * 100) / 100,
                netBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
                transactionCount: parsed.transactions.length,
            };
        }

        console.log(`[FinanceAnalysis] Parsed ${parsed.transactions?.length || 0} transactions | Income: ${parsed.summary?.totalIncome} | Expense: ${parsed.summary?.totalExpense}`);
        return parsed;
    } catch (error) {
        console.error("[FinanceAnalysis] Parse error:", error.message);
        throw new Error("Ekstre analiz edilemedi. Lütfen farklı bir formatta deneyin.");
    }
}

// ════════════════════════════════════════════════════════════════
// STEP 2: SERVER-SIDE METRICS (No AI — pure math)
// ════════════════════════════════════════════════════════════════

/**
 * Calculate comprehensive financial metrics from parsed data
 * These are computed server-side — AI does NOT calculate, only interprets
 */
export function calculateFinancialMetrics(parsedData, monthlyIncome = null) {
    const { summary, transactions = [] } = parsedData;
    const income = monthlyIncome || summary?.totalIncome || 0;
    const expense = summary?.totalExpense || 0;

    // --- Core Ratios ---
    const expenseRatio = income > 0 ? expense / income : 1;
    const savingsAmount = Math.max(0, income - expense);
    const savingsRate = income > 0 ? Math.round((savingsAmount / income) * 100) : 0;

    const expenseClass = classifyExpenseRatio(expenseRatio);
    const savingsClass = classifySavingsRate(savingsRate);

    // --- Category Breakdown ---
    const categoryTotals = {};
    for (const tx of transactions) {
        if (tx.type === "expense") {
            const cat = tx.category || "diger";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(tx.amount) || 0);
        }
    }
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, total]) => ({
            category: cat,
            total: Math.round(total),
            percentage: expense > 0 ? Math.round((total / expense) * 100) : 0,
            isDominant: expense > 0 ? (total / expense) > THRESHOLDS.categoryDominance : false,
        }));

    // --- Fixed vs Variable expenses ---
    const fixedCategories = ["kira", "fatura", "finansal_odeme"];
    const fixedExpense = sortedCategories
        .filter(c => fixedCategories.includes(c.category))
        .reduce((sum, c) => sum + c.total, 0);
    const variableExpense = expense - fixedExpense;
    const fixedExpenseRatio = income > 0 ? fixedExpense / income : 0;

    // --- Emergency Fund Target ---
    const emergencyFundTarget = expense * THRESHOLDS.emergencyFundMonths;

    // --- 50/30/20 Rule Comparison ---
    const rule502030 = {
        needs: { target: Math.round(income * 0.50), actual: fixedExpense, status: fixedExpense <= income * 0.50 ? "✅" : "⚠️" },
        wants: { target: Math.round(income * 0.30), actual: variableExpense, status: variableExpense <= income * 0.30 ? "✅" : "⚠️" },
        savings: { target: Math.round(income * 0.20), actual: savingsAmount, status: savingsAmount >= income * 0.20 ? "✅" : "⚠️" },
    };

    return {
        income: Math.round(income),
        expense: Math.round(expense),
        savingsAmount: Math.round(savingsAmount),
        savingsRate,
        expenseRatio: Math.round(expenseRatio * 100),
        expenseClass,
        savingsClass,
        categories: sortedCategories,
        fixedExpense: Math.round(fixedExpense),
        variableExpense: Math.round(variableExpense),
        fixedExpenseRatio: Math.round(fixedExpenseRatio * 100),
        fixedExpenseWarning: fixedExpenseRatio > THRESHOLDS.fixedExpenseWarn,
        emergencyFundTarget: Math.round(emergencyFundTarget),
        rule502030,
        dominantCategories: sortedCategories.filter(c => c.isDominant),
    };
}

// ════════════════════════════════════════════════════════════════
// STEP 3: AI COMMENTARY (Haiku — interprets pre-calculated metrics)
// ════════════════════════════════════════════════════════════════

/**
 * Generate savings recommendations based on PRE-CALCULATED metrics
 * AI receives exact numbers and thresholds — it does NOT calculate anything
 */
export async function generateSavingsRecommendations(parsedData, monthlyIncome = null) {
    const metrics = calculateFinancialMetrics(parsedData, monthlyIncome);

    // Build structured metrics report for AI
    const metricsReport = `
═══ FİNANSAL METRİKLER (Hesaplanmış — Doğru Değerler) ═══

📊 TEMEL GÖSTERGELER:
- Aylık Gelir: ${metrics.income.toLocaleString("tr-TR")} TL
- Aylık Gider: ${metrics.expense.toLocaleString("tr-TR")} TL
- Net Tasarruf: ${metrics.savingsAmount.toLocaleString("tr-TR")} TL
- Gider/Gelir Oranı: %${metrics.expenseRatio} → ${metrics.expenseClass.emoji} ${metrics.expenseClass.level}
- Tasarruf Oranı: %${metrics.savingsRate} → ${metrics.savingsClass.emoji} ${metrics.savingsClass.level}

📋 HARCAMA DAĞILIMI:
${metrics.categories.map(c => `- ${c.category}: ${c.total.toLocaleString("tr-TR")} TL (%${c.percentage})${c.isDominant ? " ⚠️ DOMINANT" : ""}`).join("\n")}

🔒 SABİT vs DEĞİŞKEN:
- Sabit Giderler (kira+fatura+kredi): ${metrics.fixedExpense.toLocaleString("tr-TR")} TL (%${metrics.fixedExpenseRatio})${metrics.fixedExpenseWarning ? " ⚠️ Gelirin yarısından fazla!" : ""}
- Değişken Giderler: ${metrics.variableExpense.toLocaleString("tr-TR")} TL

📐 50/30/20 KURALI KARŞILAŞTIRMASI:
- İhtiyaçlar (%50): Hedef ${metrics.rule502030.needs.target.toLocaleString("tr-TR")} TL vs Gerçek ${metrics.rule502030.needs.actual.toLocaleString("tr-TR")} TL ${metrics.rule502030.needs.status}
- İstekler (%30): Hedef ${metrics.rule502030.wants.target.toLocaleString("tr-TR")} TL vs Gerçek ${metrics.rule502030.wants.actual.toLocaleString("tr-TR")} TL ${metrics.rule502030.wants.status}
- Tasarruf (%20): Hedef ${metrics.rule502030.savings.target.toLocaleString("tr-TR")} TL vs Gerçek ${metrics.rule502030.savings.actual.toLocaleString("tr-TR")} TL ${metrics.rule502030.savings.status}

🚨 ACİL DURUM FONU HEDEFİ: ${metrics.emergencyFundTarget.toLocaleString("tr-TR")} TL (${THRESHOLDS.emergencyFundMonths} aylık gider)
`.trim();

    const systemPrompt = `Sen bir kişisel finans danışmanısın. Kullanıcının banka ekstresinden hesaplanmış FİNANSAL METRİKLER sana veriliyor.

KRİTİK KURALLAR:
1. Verilen metrikleri AYNEN kullan, kendin hesaplama yapma.
2. Gider/Gelir oranına göre DOĞRU değerlendirme yap:
   - %50 ve altı → MÜKEMMEL: Övgü ver, yatırım öner
   - %51-%65 → İYİ: Olumlu yorum, küçük iyileştirmeler öner
   - %66-%80 → ORTA: Bazı alanlar kısılabilir, dengeli yaklaş
   - %81-%90 → YÜKSEK: Ciddi tasarruf önerileri ver
   - %91+ → KRİTİK: Acil önlem gerektiğini belirt
3. Eğer kişi gelirinin %80'inden azını harcıyorsa OLUMSUZ yorum YAPMA
4. Taksit ödemeleri ve kredi kartı borçları normal gider sayılır, panik YAPMA
5. Türkçe yaz. Markdown formatı kullan. MAX 350 kelime.
6. Samimi ve yapıcı ol. Gerçekçi öneriler ver.`;

    const userPrompt = `Aşağıdaki hesaplanmış finansal metriklere göre kişisel finans değerlendirmesi yap:

${metricsReport}

Şu başlıklarla yanıt ver:

### 📊 Finansal Durum Değerlendirmesi
(Gider/Gelir oranı ve tasarruf oranını yorumla. Durum iyi ise bunu açıkça söyle.)

### 🏆 Güçlü Yönler
(Eğer varsa: iyi kontrol edilen alanlar, düşük harcama kategorileri)

### 💡 İyileştirme Fırsatları
(Dominant kategoriler veya 50/30/20 kuralından sapan alanlar için somut öneriler)

### 🎯 Bu Ay İçin 3 Adım
(Uygulanabilir, somut aksiyon maddeleri)

### 💰 Yatırım & Birikim Önerisi
(Tasarruf oranına göre: acil durum fonu mu, yatırıma mı yönlendirmeli?)`;

    try {
        const result = await invokeClaude(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            {
                temperature: 0.3,
                max_tokens: 1200,
                model: "haiku"
            }
        );

        return (result.choices?.[0]?.message?.content || "Öneri üretilemedi.").trim();
    } catch (error) {
        console.error("[FinanceAnalysis] Recommendation error:", error.message);
        return "Şu an öneriler üretilemiyor. Lütfen daha sonra tekrar deneyin.";
    }
}

export default { parseStatementWithAI, generateSavingsRecommendations, calculateFinancialMetrics };
