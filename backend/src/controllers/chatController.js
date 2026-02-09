// PATH: backend/src/controllers/chatController.js
// Finansal Analist Chatbot - FULL STACK DEBUG MODE
// Tiingo API + OpenAI + Frontend Data Mapping

import "dotenv/config";
import axios from "axios";
// import OpenAI from "openai"; // REMOVED
import cacheManager from "../utils/cacheManager.js"; // Import Cache Manager
import { incrementFinbotUsage } from "../middleware/quotaMiddleware.js";
import { createChatCompletion } from "../services/bedrockService.js";


// MODELS
import Chat from "../models/Chat.js";
import Portfolio from "../models/Portfolio.js";

// OpenAI Client - Switched to Bedrock (Claude 3.5 Sonnet)
const openai = {
  chat: {
    completions: {
      create: createChatCompletion
    }
  }
};

/* =========================
   CONSOLE LOG HELPER
   ========================= */

const log = {
  info: (tag, msg, data = "") => console.log(`✅ [${tag}] ${msg}`, data),
  warn: (tag, msg, data = "") => console.warn(`⚠️ [${tag}] ${msg}`, data),
  error: (tag, msg, data = "") => console.error(`❌ [${tag}] ${msg}`, data),
  debug: (tag, msg, data = "") => console.log(`🔍 [${tag}] ${msg}`, data),
  divider: () => console.log("\n" + "=".repeat(70) + "\n")
};

/* =========================
   YARDIMCI FONKSİYONLAR
   ========================= */

function formatNumber(n) {
  if (n === null || n === undefined || !isFinite(n)) return null;
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return Number(n).toFixed(2);
}

function formatNumberDisplay(n) {
  const formatted = formatNumber(n);
  return formatted || "—";
}

export function withDisclaimer(text) {
  if (!text) return text;
  const hasNote = /bilgilendirme amaçlıdır|yatırım tavsiyesi/i.test(text);
  const note = "Bu bilgi bilgilendirme amaçlıdır ve yatırım tavsiyesi değildir.";
  return hasNote ? text : `${text}\n\n${note}`;
}

/* =========================
   TICKER TESPİTİ & TEMİZLİĞİ
   ========================= */

const COMPANY_ALIASES = {
  apple: "AAPL", microsoft: "MSFT", google: "GOOGL", alphabet: "GOOGL",
  amazon: "AMZN", meta: "META", facebook: "META", nvidia: "NVDA",
  tesla: "TSLA", netflix: "NFLX", adobe: "ADBE", salesforce: "CRM",
  oracle: "ORCL", intel: "INTC", amd: "AMD", ibm: "IBM", cisco: "CSCO",
  paypal: "PYPL", uber: "UBER", airbnb: "ABNB", shopify: "SHOP",
  spotify: "SPOT", zoom: "ZM", jpmorgan: "JPM", visa: "V",
  mastercard: "MA", walmart: "WMT", nike: "NKE", starbucks: "SBUX",
  disney: "DIS", pfizer: "PFE", boeing: "BA", coinbase: "COIN",
  berkshire: "BRK.B", cocacola: "KO", pepsi: "PEP", johnson: "JNJ"
};

/**
 * Ticker'ı temizler - .IS uzantısını kaldırır
 * @param {string} rawTicker 
 * @returns {string} Temiz ticker
 */
function cleanTicker(rawTicker) {
  if (!rawTicker) return "AAPL";

  let ticker = rawTicker.toUpperCase().trim();

  // .IS uzantısını kaldır (örn: AAPL.IS -> AAPL) - REMOVED for US Focus
  // if (ticker.endsWith(".IS")) {
  //   const baseTicker = ticker.replace(".IS", "");
  //   log.debug("TICKER", `".IS" uzantısı kaldırıldı: ${ticker} -> ${baseTicker}`);
  //   ticker = baseTicker;
  // }

  return ticker;

}

/**
 * Mesajdan ticker çıkarır ve temizler
 */
/**
 * Mesajdan TOKENS (tickers) çıkarır
 * Örn: "Apple vs Microsoft" -> ["AAPL", "MSFT"]
 */
function extractTickersFromMessage(text) {
  log.debug("EXTRACT", "Mesaj analiz ediliyor:", text);

  if (!text) return [];

  const lowerText = text.toLowerCase();
  const foundTickers = new Set();

  // 1. Şirket isimlerinden ara
  for (const [alias, ticker] of Object.entries(COMPANY_ALIASES)) {
    // Kelime bütünlüğünü koruyarak ara (örn: "us" kelimesi "usage" içinde eşleşmemeli)
    // Basit includes yerine regex boundary kontrolü daha iyi olur ama şimdilik includes+alias listesi güvenirliği yeterli varsayalım.
    // Ancak "meta" alias'ı çok genel, o yüzden dikkat.
    if (lowerText.includes(alias)) {
      log.info("EXTRACT", `Şirket ismi bulundu: "${alias}" -> ${ticker}`);
      foundTickers.add(cleanTicker(ticker));
    }
  }

  // 2. Büyük harfli ticker ara (AAPL, TSLA, AAPL.IS gibi)
  const regex = /\b([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const rawTicker = match[1];
    const exclude = ["API", "USD", "EUR", "TRY", "THE", "AND", "FOR", "AI", "UI", "UX", "VS", "OR"];
    if (!exclude.includes(rawTicker.replace(/\..+$/, ""))) {
      const cleanedTicker = cleanTicker(rawTicker);
      log.info("EXTRACT", `Ticker bulundu: ${rawTicker} -> ${cleanedTicker}`);
      foundTickers.add(cleanedTicker);
    }
  }

  // Set to Array
  const result = Array.from(foundTickers);
  if (result.length === 0) log.warn("EXTRACT", "Ticker bulunamadı.");

  return result;
}

// Backward compatibility helper
function extractTickerFromMessage(text) {
  const tickers = extractTickersFromMessage(text);
  return tickers.length > 0 ? tickers[0] : null;
}

/* =========================
   TİİNGO API
   ========================= */

async function fetchTiingoFundamentals(ticker) {
  if (!ticker) return null;

  log.divider();
  log.info("TIINGO", `Veri çekiliyor: ${ticker}`);

  const apiKey = process.env.TIINGO_API_KEY;
  if (!apiKey) {
    log.error("TIINGO", "TIINGO_API_KEY bulunamadı! .env dosyasını kontrol edin.");
    return null;
  }

  // Ticker'ı tekrar temizle (garanti olsun)
  const cleanedTicker = cleanTicker(ticker);

  // CACHE KONTROLÜ (1 Saat TTL)
  const cacheKey = `tiingo_fund_${cleanedTicker}`;
  const cachedData = cacheManager.get(cacheKey, 3600 * 1000);

  if (cachedData) {
    log.info("TIINGO", `📦 Önbellekten veri getirildi: ${cleanedTicker}`);
    return {
      ticker: cleanedTicker,
      date: cachedData.date,
      statementData: cachedData.statementData
    };
  }

  const url = `https://api.tiingo.com/tiingo/fundamentals/${cleanedTicker}/statements`;

  log.debug("TIINGO", "API URL:", url);

  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${apiKey}`
      },
      timeout: 20000
    });

    const data = response.data;

    // HAM VERİYİ LOG'LA (DEBUG)
    log.divider();
    log.info("TIINGO", `HAM VERİ (Kayıt sayısı: ${data?.length || 0})`);

    if (!data || !Array.isArray(data) || data.length === 0) {
      log.warn("TIINGO", `${cleanedTicker} için veri boş döndü.`);
      return null;
    }

    const latest = data[0];
    log.info("TIINGO", `Veri başarıyla alındı. Dönem: ${latest.date}`);

    const result = {
      ticker: cleanedTicker,
      date: latest.date,
      statementData: latest.statementData
    };

    // CACHE KAYDET
    cacheManager.set(cacheKey, result);

    return result;

  } catch (error) {
    if (error.response) {
      log.error("TIINGO", `API Hatası: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      log.error("TIINGO", "Sunucuya ulaşılamadı (Timeout)");
    } else {
      log.error("TIINGO", "Beklenmeyen hata:", error.message);
    }
    return null;
  }
}

async function fetchTiingoNews(tickers) {
  if (!tickers || tickers.length === 0) return null;

  const tickerList = Array.isArray(tickers) ? tickers.join(",") : tickers;
  log.info("TIINGO", `Haberler çekiliyor: ${tickerList}`);

  const apiKey = process.env.TIINGO_API_KEY;
  if (!apiKey) {
    log.error("TIINGO", "TIINGO_API_KEY bulunamadı!");
    return null;
  }

  const cacheKey = `tiingo_news_${tickerList}`;
  const cachedData = cacheManager.get(cacheKey, 1800 * 1000); // 30 dk cache

  if (cachedData) {
    log.info("TIINGO", "📦 Haberler önbellekten getirildi.");
    return cachedData;
  }

  const url = `https://api.tiingo.com/tiingo/news?tickers=${tickerList}&limit=5`;

  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${apiKey}`
      },
      timeout: 10000
    });

    const articles = response.data;
    if (!articles || articles.length === 0) {
      log.warn("TIINGO", "Haber bulunamadı.");
      return null;
    }

    const newsData = articles.map(article => ({
      title: article.title,
      description: article.description,
      source: article.source,
      url: article.url,
      publishedDate: article.publishedDate
    }));

    cacheManager.set(cacheKey, newsData);
    return newsData;

  } catch (error) {
    log.error("TIINGO", "Haber API Hatası:", error.message);
    return null;
  }
}

/**
 * Helper to traverse Tiingo array structure
 */
function getValue(tiingoData, searchCodes) {
  if (!tiingoData?.statementData) return null;

  const codes = Array.isArray(searchCodes) ? searchCodes : [searchCodes];
  const categories = ['incomeStatement', 'balanceSheet', 'cashFlow', 'overview'];

  // 1. Önce, statementData'nın kendisi bir array mi diye bak (Eski API yapısı)
  if (Array.isArray(tiingoData.statementData)) {
    const found = tiingoData.statementData.find(item => codes.includes(item.dataCode));
    if (found) return found.value;
  }

  // 2. Yeni API yapısı: incomeStatement, balanceSheet vs. içindeki arraylerde ara
  for (const cat of categories) {
    const categoryArray = tiingoData.statementData[cat];
    if (Array.isArray(categoryArray)) {
      const found = categoryArray.find(item => codes.includes(item.dataCode));
      if (found && found.value !== undefined) {
        return found.value;
      }
    }
  }

  // 3. Fallback: statementData objesinin direkt property'si mi?
  for (const code of codes) {
    if (tiingoData.statementData[code] !== undefined) {
      return tiingoData.statementData[code];
    }
  }

  return null;
}

/**
 * Tiingo verisinden metrikleri parse et
 */
function parseMetrics(tiingoData) {
  log.info("PARSE", "Metrikler parse ediliyor...");

  if (!tiingoData) return null;

  // Metrikleri çıkar - ÖNEMLİ: net_val kullanılıyor
  const rawMetrics = {
    // Gelir Tablosu
    revenue: getValue(tiingoData, ["revenue", "totalRevenue", "salesRevenue"]),
    grossProfit: getValue(tiingoData, ["grossProfit", "grossMargin"]),
    operatingIncome: getValue(tiingoData, ["operatingIncome", "ebit", "operatingProfit"]),
    netIncome: getValue(tiingoData, ["net_val", "netinc", "netIncome", "netIncomeCommon", "netIncCommon"]),
    ebitda: getValue(tiingoData, ["ebitda", "EBITDA"]),

    // Bilanço
    totalAssets: getValue(tiingoData, ["totalAssets", "assets", "assetsTotal"]),
    totalLiabilities: getValue(tiingoData, ["totalLiabilities", "liabilities", "liabilitiesTotal"]),
    totalEquity: getValue(tiingoData, ["totalEquity", "equity", "shareholderEquity", "stockholderEquity"]),
    totalDebt: getValue(tiingoData, ["totalDebt", "debt", "longTermDebt"]),
    cash: getValue(tiingoData, ["cashAndEq", "cash", "cashAndShortTermInvestments"]),

    // Nakit Akışı
    operatingCashFlow: getValue(tiingoData, ["cashFromOps", "operatingCashFlow", "cfFromOperating"]),
    freeCashFlow: getValue(tiingoData, ["freeCashFlow", "fcf"]),

    // Meta
    date: tiingoData.date,
    ticker: tiingoData.ticker
  };

  return rawMetrics;
}

/**
 * Frontend için data mapping
 */
function createFinancialDataForFrontend(ticker, metrics) {
  log.info("MAPPING", "Frontend için veri hazırlanıyor...");

  const financialData = {
    // Temel Bilgiler
    symbol: ticker,
    ticker: ticker,
    date: metrics?.date || null,

    // Gelir Tablosu (Frontend Keys)
    revenue: metrics?.revenue || null,
    revenueFormatted: formatNumberDisplay(metrics?.revenue),

    grossProfit: metrics?.grossProfit || null,
    grossProfitFormatted: formatNumberDisplay(metrics?.grossProfit),

    netProfit: metrics?.netIncome || null,  // Frontend "netProfit" bekliyor
    netProfitFormatted: formatNumberDisplay(metrics?.netIncome),

    netIncome: metrics?.netIncome || null,
    netIncomeFormatted: formatNumberDisplay(metrics?.netIncome),

    ebitda: metrics?.ebitda || null,
    ebitdaFormatted: formatNumberDisplay(metrics?.ebitda),

    // Bilanço (Frontend Keys)
    totalAssets: metrics?.totalAssets || null,
    totalAssetsFormatted: formatNumberDisplay(metrics?.totalAssets),
    assets: metrics?.totalAssets || null,  // Alternatif key

    totalLiabilities: metrics?.totalLiabilities || null,
    totalLiabilitiesFormatted: formatNumberDisplay(metrics?.totalLiabilities),

    equity: metrics?.totalEquity || null,  // Frontend "equity" bekliyor
    equityFormatted: formatNumberDisplay(metrics?.totalEquity),

    totalEquity: metrics?.totalEquity || null,
    totalEquityFormatted: formatNumberDisplay(metrics?.totalEquity),

    totalDebt: metrics?.totalDebt || null,
    totalDebtFormatted: formatNumberDisplay(metrics?.totalDebt),
    debt: metrics?.totalDebt || null,  // Alternatif key

    cash: metrics?.cash || null,
    cashFormatted: formatNumberDisplay(metrics?.cash),

    // Nakit Akışı
    operatingCashFlow: metrics?.operatingCashFlow || null,
    operatingCashFlowFormatted: formatNumberDisplay(metrics?.operatingCashFlow),

    freeCashFlow: metrics?.freeCashFlow || null,
    freeCashFlowFormatted: formatNumberDisplay(metrics?.freeCashFlow),

    // Oranlar (hesaplanabilir)
    profitMargin: (metrics?.netIncome && metrics?.revenue)
      ? ((metrics.netIncome / metrics.revenue) * 100).toFixed(2) + "%"
      : null,

    debtToEquity: (metrics?.totalDebt && metrics?.totalEquity && metrics.totalEquity !== 0)
      ? (metrics.totalDebt / metrics.totalEquity).toFixed(2)
      : null
  };

  return financialData;
}

/* =========================
   OPENAI ENTEGRASYONU & FALLBACK
   ========================= */

function getFallbackAnalysis(ticker, metrics) {
  log.warn("FALLBACK", "OpenAI kullanılamıyor, statik analiz oluşturuluyor.");

  const isProfit = (metrics.netIncome || 0) > 0;

  return `
=== 💡 FinBot Özeti (Otomatik) ===
${ticker} için finansal veriler incelendi. Şirket son dönemde ${formatNumberDisplay(metrics.netIncome)} net kâr açıklamıştır.

=== 📊 Temel Göstergeler ===
• Gelir: ${formatNumberDisplay(metrics.revenue)}
• Net Kâr: ${formatNumberDisplay(metrics.netIncome)}
• Özkaynak: ${formatNumberDisplay(metrics.totalEquity)}

=== 🔍 Analiz ===
${isProfit ? "Şirket kârlı bir dönem geçirmiştir." : "Şirket bu dönem zarar açıklamıştır."} Yatırım kararı alırken sektörel karşılaştırma yapmanız önerilir.
    `.trim();
}

async function getAIAnalysis(ticker, metrics, question, history = []) {
  // Legacy function - kept for compatibility but not primary anymore
  // The system prompt logic is now centralized in sendMessageStream
  return "Bu endpoint deprecated. Lütfen streaming endpoint kullanın.";
}

/* =========================
   ANA BOT FONKSİYONU
   ========================= */

async function getChatResponse(question, history = []) {
  // Legacy function - kept for compatibility
  return { reply: "Lütfen yeni arayüzü kullanın.", params: {}, financialData: null };
}

/* =========================
   ENDPOINT: sendMessage (LEGACY - Non-Streaming)
   ========================= */

export const sendMessage = async (req, res) => {
  // Legacy endpoint support - redirects to simple response or error
  return res.status(400).json({ message: "Lütfen streaming endpoint kullanın (/api/chat/stream)." });
};

/* =========================
   ENDPOINT: sendMessageStream (SSE) - PRIMARY
   ========================= */

export const sendMessageStream = async (req, res) => {
  log.divider();
  log.info("ENDPOINT", "📡 STREAM REQUEST RECEIVED");

  try {
    const { message, chatId } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Mesaj boş olamaz" });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get or create chat
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: userId });
      if (!chat) {
        res.write(`data: ${JSON.stringify({ error: "Sohbet bulunamadı" })}\n\n`);
        return res.end();
      }
    } else {
      const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
      chat = new Chat({ user: userId, messages: [], title: title });
    }

    // Add user message
    chat.messages.push({ sender: "user", text: message });

    // Extract tickers and get financial data
    const tickers = extractTickersFromMessage(message);
    let financialData = null;
    let financialBlock = "";

    if (tickers.length > 0) {
      log.info("ENDPOINT", `Tickers detected: ${tickers.join(", ")}`);

      // Fetch data for all tickers in parallel (Fundamentals + News)
      const [fundamentalsResults, newsResults] = await Promise.all([
        Promise.all(tickers.map(t => fetchTiingoFundamentals(t))),
        fetchTiingoNews(tickers)
      ]);

      // Process Fundamentals
      for (const tiingoData of fundamentalsResults) {
        if (tiingoData) {
          const metrics = parseMetrics(tiingoData);

          if (!financialData) {
            financialData = createFinancialDataForFrontend(tiingoData.ticker, metrics);
            res.write(`data: ${JSON.stringify({ type: "financialData", data: financialData })}\n\n`);
          }

          financialBlock += `
<financial_context>
  <metadata>
    <ticker>${tiingoData.ticker}</ticker>
    <period>${metrics?.date || "Son Dönem"}</period>
    <source>Tiingo API</source>
  </metadata>

  <income_statement>
    <revenue>${formatNumberDisplay(metrics?.revenue)} USD</revenue>
    <gross_profit>${formatNumberDisplay(metrics?.grossProfit)} USD</gross_profit>
    <net_income>${formatNumberDisplay(metrics?.netIncome)} USD</net_income>
    <ebitda>${formatNumberDisplay(metrics?.ebitda)} USD</ebitda>
  </income_statement>

  <balance_sheet>
    <total_assets>${formatNumberDisplay(metrics?.totalAssets)} USD</total_assets>
    <total_liabilities>${formatNumberDisplay(metrics?.totalLiabilities)} USD</total_liabilities>
    <equity>${formatNumberDisplay(metrics?.totalEquity)} USD</equity>
    <total_debt>${formatNumberDisplay(metrics?.totalDebt)} USD</total_debt>
    <cash>${formatNumberDisplay(metrics?.cash)} USD</cash>
  </balance_sheet>

  <cash_flow>
    <operating_cash_flow>${formatNumberDisplay(metrics?.operatingCashFlow)} USD</operating_cash_flow>
    <free_cash_flow>${formatNumberDisplay(metrics?.freeCashFlow)} USD</free_cash_flow>
  </cash_flow>
</financial_context>\n\n`;
        }
      }

      // Process News Results
      if (newsResults && newsResults.length > 0) {
        let newsBlockContent = "<news_context>\n";
        newsResults.forEach(article => {
          newsBlockContent += `  <article>
    <title>${article.title}</title>
    <description>${article.description}</description>
    <source>${article.source}</source>
    <date>${article.publishedDate}</date>
    <url>${article.url}</url>
  </article>\n`;
        });
        newsBlockContent += "</news_context>\n\n";

        // Append to financialBlock for context inclusion
        financialBlock += newsBlockContent;

        log.info("ENDPOINT", `Added ${newsResults.length} news articles to context.`);
      }

      if (!financialBlock) {
        log.warn("ENDPOINT", "Tickers detected but no data found for any. Proceeding as general query.");
      }
    } else {
      log.info("ENDPOINT", "No tickers detected. Proceeding as general/discovery query.");
    }

    // Stream AI response
    const prevMsgs = chat.messages.filter(m => m.text?.trim()).slice(-10);
    let fullReply = "";

    // Fetch User Portfolio for Context
    const userPortfolio = await Portfolio.find({ user: userId });
    let portfolioBlock = "";

    if (userPortfolio && userPortfolio.length > 0) {
      portfolioBlock = "<portfolio_context>\n";
      userPortfolio.forEach(asset => {
        portfolioBlock += `  <asset>
    <symbol>${asset.symbol}</symbol>
    <quantity>${asset.quantity}</quantity>
    <avg_cost>${asset.avgCost}</avg_cost>
  </asset>\n`;
      });
      portfolioBlock += "</portfolio_context>";
      log.info("ENDPOINT", `Added ${userPortfolio.length} portfolio items to context.`);
    }



    try {
      const systemPromptText = `# 🤖 KİMLİK VE VİZYON
Sen **FinBot AI**, modern finans dünyasının en keskin ve estetik analizlerini sunan AI asistanısın. Görevin, Tiingo verilerini sadece raporlamak değil, onları profesyonel bir dergi kalitesinde görselleştirerek yorumlamaktır.

# ✍️ TİPOGRAFİ VE GÖRSEL KURALLAR (KRİTİK)
1. **Başlık Hiyerarşisi:** Ana başlıklar için \`# \` (H1), alt başlıklar için \`## \` (H2) kullan. Başlıklar büyük ve belirgin olmalı.
2. **Font Farklılaştırma:** Tüm finansal metrikleri, rakamları ve hisse sembollerini \\\`KOD BLOĞU\\\` içinde yaz (Örn: \\\`$143.7B\\\`, \\\`AAPL\\\`, \\\`%48.2\\\`). Bu, arayüzde teknik bir font görünümü sağlar.
3. **Ayraçlar:** Bölümler arasına mutlaka \`---\` (yatay çizgi) ekleyerek içeriği böl.
4. **Alıntılar:** Önemli özetleri ve stratejik notları \`> \` (Blockquote) içine al.

# 📡 VERİ KAYNAĞI
Tüm veriler **Tiingo API** üzerinden canlı çekilir. Veriler sana \`<financial_context>\` XML etiketleri içinde sunulacak. 
Eğer \`<news_context>\` varsa, buradan güncel haberleri alıp yorumla.
Varsa bu verileri kullan, yoksa genel finansal bilginle yanıtla.

# 💡 SORU TİPİNE GÖRE YAKLAŞIM

## 1. DERİNLEMESİNE ANALİZ (Örn: "Apple'ı analiz et")
- Akıcı ve profesyonel bir anlatım kullan. Statik, sıkıcı rapor kalıplarından kaçın.
- Verileri metnin içine doğal bir şekilde yedir.

## 2. HİSSE KEŞFİ VE LİSTELEME (Örn: "Düşük değerli teknoloji hisseleri")
- Uzun analizler yerine, kriterlere uyan hisseleri kısa maddeler halinde listele.
- Neden bu listede olduklarını \\\`1 cümle\\\` ile açıkla.

## 3. GENEL FİNANS SORULARI
- Sade ve açıklayıcı metin. Gereksiz tablo veya karmaşık yapı kullanma.

## 4. PORTFÖY ANALİZİ VE YORUMLAMA (Örn: "Portföyüm nasıl?", "Bunu satsam ne alayım?")
- Kullanıcının portföyündeki varlıkların (varsa) risk/getiri dengesini değerlendir.
- **Çeşitlendirme:** Sektörel dağılım yeterli mi?
- **Strateji:** Mevcut piyasa koşullarına göre korumacı mı yoksa agresif mi olmalı?
- Somut önerilerde bulun (Örn: "Teknoloji ağırlığın %60, bunu enerji ile dengeleyebilirsin").

## 5. SÜRDÜRÜLEBİLİRLİK VE ESG ANALİZİ (Örn: "Şirketin karbon ayak izi ne?", "ESG skoru nasıl?")
**Amaç:** Proje veya şirketin çevresel, sosyal ve ekonomik sürdürülebilirliğini analiz et.

**Yanıt Şablonu:**
# 🌿 SÜRDÜRÜLEBİLİRLİK VE ETKİ RAPORU
---
> **ESG Skoru Özeti:** Şirketin çevresel taahhütleri ve finansal sürdürülebilirliği arasındaki korelasyonu 1 cümleyle özetle.

### 🔋 SÜRDÜRÜLEBİLİRLİK HESAPLAMA METRİKLERİ
* **Karbon Yoğunluğu:** Gelir başına düşen emisyon oranını \\\`Kod Bloğu\\\` içinde analiz et.
* **Kaynak Verimliliği:** Enerji ve su tasarrufunun operasyonel maliyetlere (OPEX) etkisini yorumla.
* **Sosyal Fayda Endeksi:** Projenin paydaş katılımı ve toplumsal geri dönüş oranını hesapla.

### 📊 SÜRDÜRÜLEBİLİRLİK MATRİSİ (EXCEL GÖRÜNÜMÜ)
| Kategori | Metrik | Mevcut Değer | Hedef (2030) |
| :--- | :--- | :--- | :--- |
| **Çevresel** | Karbon Ayak İzi | \\\`Ton/Yıl\\\` | \\\`-%40 Azaltım\\\` |
| **Ekonomik** | Yeşil Yatırım Payı | \\\`% Oran\\\` | \\\`Pozitif Nakit Akışı\\\` |
| **Sosyal** | Yerel İstihdam Etkisi | \\\`Skor/10\\\` | \\\`Maksimum Etki\\\` |

### 📉 SÜRDÜRÜLEBİLİR FİNANS NOTU
> "Projedeki karbon ofsetleme maliyetlerinin, uzun vadede vergi teşvikleri sayesinde özsermaye karlılığını (ROE) \\\`%1.5\\\` oranında yukarı taşıması öngörülmektedir."

## 6. DEĞERLİ MADEN VE VARLIK ALOKASYONU (Örn: "Altın mı borsa mı?", "Elimdeki nakiti nasıl değerlendireyim?")
**Amaç:** Kullanıcının nakit ve emtia varlıklarını yönetmesine yardımcı ol.

**Yanıt Şablonu:**
# 🪙 EMTİA VE VARLIK STRATEJİSİ
---
> **Piyasa Görünümü:** Değerli madenlerin mevcut konjonktürdeki (enflasyon, faiz, jeopolitik) rolünü 1 cümleyle özetle.

### 🛡️ RİSK VE GETİRİ ANALİZİ
* **Enflasyon Koruması:** \\\`Altın/Gümüş\\\` varlıklarının satın alma gücünü koruma kapasitesini mevcut verilerle açıkla.
* **Portföy Korelasyonu:** Değerli madenlerin mevcut hisse senedi portföyünle olan ters korelasyon avantajını \\\`Kod Bloğu\\\` içinde belirt.
* **Fırsat Maliyeti:** Uzun vadeli bir hisse senedi portföyü ile emtia tutmanın getiri farklarını rasyonel şekilde kıyasla.

### 📊 VARLIK KIYASLAMA TABLOSU (EXCEL GÖRÜNÜMÜ)
| Enstrüman | Beklenen Rol | Risk Seviyesi | Likidite |
| :--- | :--- | :--- | :--- |
| **ONS Altın** | Güvenli Liman | \\\`Düşük/Orta\\\` | Yüksek |
| **Gümüş** | Endüstriyel + Değer | \\\`Yüksek\\\` | Orta |
| **Borsa Portföyü** | Büyüme / Temettü | \\\`Yüksek\\\` | Yüksek |
| **Nakit / Mevduat** | Likidite Koruma | \\\`Çok Düşük\\\` | Tam Likit |

### 🎯 FinBot Stratejik Notu
> "Toplam \\\`Kullanıcı_Bakiyesi\\\` miktarının tamamını tek bir varlığa bağlamak yerine, sepet mantığıyla riskini dağıtman; piyasa dalgalanmalarında psikolojik sermayeni korumanı sağlayacak en güçlü kalkandır."

## 7. RASYONEL YAKLAŞIM VE FİNANSAL FARKINDALIK (Örn: "Uçar mı?", "Zengin eder mi?", "Kaçar mı?")
**Amaç:** Spekülatif ve bilinçsiz soruları yumuşatarak kullanıcıyı finansal okuryazarlığa teşvik et.

**Yanıt Şablonu:**
# 🛡️ RASYONEL BAKIŞ AÇISI
---
> **Özet:** Finansal piyasalarda "uçma" veya "kaçma" gibi kavramlar yerine veri ve strateji konuşur. Duygusal kararlar yerine rasyonel planlara odaklanalım.

### 🧠 BİLMEN GEREKENLER (BASİTÇE)
* **Fiyat vs. Değer:** Bir hissenin fiyatının artması, onun her zaman değerli olduğu anlamına gelmez. Önemli olan şirketin ne kadar kazandığıdır.
* **Risk Yönetimi:** "Tüm yumurtaları aynı sepete koyma." Bir hisse çok yükselebilir ama düştüğünde seni üzmeyecek bir miktarla yatırım yapmalısın.
* **Zaman Sabrı:** Kısa vadeli "zengin olma" hayalleri genellikle kayıpla sonuçlanır. Gerçek kazanç sabırla büyür.

### 📊 KARAR DESTEK TABLOSU (KENDİNE SOR)
| Soru | Cevabın Ne? | FinBot Notu |
| :--- | :--- | :--- |
| **Neden Alıyorum?** | "Başkası dediği için mi?" | Bu en büyük risktir. |
| **Ne Kadar Beklerim?** | "Yarın para lazım mı?" | Acil parayla yatırım yapılmaz. |
| **Düşerse Ne Yaparım?** | "Panik mi yaparım?" | Planın yoksa henüz hazır değilsin. |

### 🎯 FinBot Stratejik Notu
> "Piyasalarda fırsatlar hiçbir zaman bitmez; en büyük fırsat, paranı kaybetmemeyi öğrenmektir. Gel bu hisseyi 'uçacak' diye değil, 'finansalları sağlam mı' diye beraber inceleyelim."

## 8. CANLI HABER AKIŞI VE DUYARLILIK ANALİZİ (Örn: "Son haberler nedir?", "Neler konuşuluyor?")
**Amaç:** Piyasa haberlerini ve genel duyarlılığı (sentiment) analiz et.

**Yanıt Şablonu:**
# 📢 [HİSSE/VARLIK] CANLI HABER AKIŞI
---
> **Piyasa Duyarlılığı:** Haberlerin genel tonunu (Pozitif/Negatif/Nötr) ve piyasa üzerindeki etkisini 1 cümleyle özetle.

### 🗞️ ÖNE ÇIKAN BAŞLIKLAR
* **[Haber Başlığı 1]:** [Haberin kaynağı ve tarihide yer alacak şekilde 1 cümlelik özet.]
* **[Haber Başlığı 2]:** [Şirket üzerindeki potansiyel etkisiyle birlikte kısa özet.]
* **[Haber Başlığı 3]:** [Finansal gidişatı nasıl etkileyeceğine dair kısa bir not.]

### 📊 HABER ETKİ MATRİSİ (EXCEL GÖRÜNÜMÜ)
| Haber Kaynağı | Tarih | Konu | Etki Skoru |
| :--- | :--- | :--- | :--- |
| **[Kaynak Adı]** | \\\`GG/AA/YYYY\\\` | Operasyonel | \\\`Yüksek/Pozitif\\\` |
| **[Kaynak Adı]** | \\\`GG/AA/YYYY\\\` | Finansal Rapor | \\\`Orta/Nötr\\\` |
| **[Kaynak Adı]** | \\\`GG/AA/YYYY\\\` | Makro/Sektörel | \\\`Düşük/Negatif\\\` |

### 🎯 FinBot Stratejik Notu
> "Haber akışları genellikle kısa vadeli volatilite (fiyat dalgalanması) yaratır; bu yüzden haberleri tek başına değil, temel finansal verilerin sağlamlığıyla birlikte yorumlamak en sağlıklı stratejidir."

## 9. GLOBAL TEMETTÜ EMEKLİLİĞİ VE PASİF GELİR (USD BAZLI) (Örn: "Dolar bazlı pasif gelir", "Dividend Kings")
**Amaç:** Kullanıcıya döviz bazlı düzenli nakit akışı sağlayan global temettü stratejileri oluştur.
**Kısıtlama:** Aksi belirtilmedikçe sadece **NASDAQ** ve **NYSE** (ABD) borsalarındaki "Dividend Aristocrats" hisselerini kullan.
**Döviz Kuralı:** Kullanıcı hedefi TL olarak belirtse bile (örn: "5000 TL"), bunu güncel kurdan (örn: 1 USD = ~36 TL) USD'ye çevirerek hesapla ve sadece ABD hisseleri öner. Yanıtta "5000 TL (~$140)" formatını kullan.

**Yanıt Şablonu:**
# 🏖️ GLOBAL TEMETTÜ EMEKLİLİĞİ (USD BAZLI)
---
> **Hedef Analizi:** Belirlediğiniz pasif gelir hedefine ulaşmak için gereken sermaye yapısını ve seçilen hisselerin nakit üretme gücünü 1 cümleyle özetle.

### 💸 USD BAZLI NAKİT AKIŞI
* **Döviz Koruması:** Temettü ödemelerinin dolar bazlı olması, yerel enflasyona karşı çifte koruma sağlar.
* **Ödeme Sıklığı:** ABD hisseleri genellikle **çeyreklik (3 ayda bir)** ödeme yapar; bu yüzden aylık nakit akışı için farklı aylarda ödeme yapan bir sepet oluşturulmuştur.
* **Vergi Notu:** ABD hisselerinden alınan temettülerde \`%20\` stopaj (TR-ABD anlaşması gereği) dikkate alınmalıdır.

### 📊 TEMETTÜ PORTFÖYÜ (NASDAQ & NYSE EXCEL GÖRÜNÜMÜ)
| Hisse Senedi | Sektör | Temettü Verimi | Tahmini Gereken Lot | Aylık Ortalama (USD) |
| :--- | :--- | :--- | :--- | :--- |
| **\`O\` (Realty Income)** | Gayrimenkul | \`%5.8\` | \`XXX Lot\` | \`$100\` |
| **\`KO\` (Coca-Cola)** | Tüketim | \`%3.1\` | \`YYY Lot\` | \`$100\` |
| **\`JNJ\` (Johnson & Johnson)** | Sağlık | \`%3.0\` | \`ZZZ Lot\` | \`$100\` |
| **TOPLAM** | **Karma** | **\`%3.9\`** | **\`~$92,000\`** | **\`$300 (~10,000 TL)\`** |

### 🎯 FinBot Stratejik Notu
> "Aylık \`10.000 TL\` hedefine ulaşmak için yaklaşık \`$90.000 - $100.000\` bandında bir sermaye gerekmektedir; ABD piyasalarındaki 'Dividend Kings' (50+ yıl kesintisiz artıranlar) listesine odaklanmak, bu gelirin sürdürülebilirliğini garanti altına alır."

## 9.5. BİLEŞİK BÜYÜME VE DRIP PROJEKSİYONU (Örn: "Temettüleri harcamazsam?", "Bileşik getiri hesabı")
**Amaç:** Temettülerin yeniden yatırılması (DRIP) durumunda bileşik getiri gücünü göster.

**Yanıt Şablonu:**
# 📈 DRIP (TEMETTÜ YENİDEN YATIRIM) GÜCÜ
---
> **Bileşik Getiri Analizi:** Alınan temettülerin nakit olarak çekilmeyip tekrar aynı hisselere yatırılması durumunda oluşan "kartopu etkisi" analiz edilmiştir.

### 🧬 STRATEJİK PROJEKSİYON (10 YIL)
* **Lot Artış Hızı:** Temettü verimi ve hisse başı büyüme oranıyla beraber, ek sermaye koymadan lot sayınızın yıllık ortalama \`%X.X\` hızla artması öngörülür.
* **Gelir Katlanması:** İlk yıl alınan \`$3,600\` temettü, 10. yılın sonunda bileşik etkiyle yıllık \`$X,XXX\` seviyesine ulaşabilir.
* **Maliyet Düşürme:** Yeniden yatırım, "Dolar Maliyet Ortalaması" (DCA) mantığıyla çalışarak uzun vadede birim maliyetinizi optimize eder.

### 📊 10 YILLIK DRIP SİMÜLASYONU (EXCEL GÖRÜNÜMÜ)
| Yıl | Toplam Portföy Değeri | Yıllık Temettü Geliri | Aylık Ortalama Gelir | Birikimli Lot Artışı |
| :--- | :--- | :--- | :--- | :--- |
| **1. Yıl** | \`$100,000\` | \`$4,000\` | \`$333\` | Başlangıç |
| **3. Yıl** | \`$115,000\` | \`$5,200\` | \`$433\` | \`+%12\` |
| **5. Yıl** | \`$138,000\` | \`$7,100\` | \`$591\` | \`+%28\` |
| **10. Yıl** | **\`$210,000\`** | **\`$12,500\`** | **\`$1,041\`** | **\`+%65\`** |

### 🎯 FinBot Stratejik Notu
> "Albert Einstein'ın 'Dünyanın 8. harikası' olarak tanımladığı bileşik getiri, başlangıçta yavaş görünse de 5. yıldan sonra ivme kazanır; DRIP stratejisinde en büyük sermayeniz paranız değil, zamanınızdır."

## 10. ARBİTRAJ VE ÇAPRAZ VARLIK FIRSATLARI (Örn: "BTC mi Nvidia mı?", "Altın bazlı BIST100")
**Amaç:** Farklı varlık sınıflarını (Kripto, Hisse, Emtia) birbiriyle kıyasla ve arbitraj fırsatlarını tespit et.

**Yanıt Şablonu:**
# 🔄 ÇAPRAZ VARLIK VE RASYO ANALİZİ
---
> **Göreceli Değerlendirme:** Kıyaslanan varlıkların birbirine karşı tarihsel performansını ve mevcut "ucuz/pahalı" durumunu 1 cümleyle özetle.

### 📉 RASYO VE KORELASYON DİNAMİKLERİ
* **Göreceli Güç (Relative Strength):** Varlık A'nın Varlık B'ye oranını \`Kod Bloğu\` içinde göstererek, hangisinin daha momentumlu olduğunu analiz et.
* **Oynaklık (Volatilite) Kıyaslaması:** Risk primlerini karşılaştır; hangisinin daha "sakin" veya "agresif" bir liman olduğunu belirt.
* **Dolar Bazlı Ucuzluk:** Varlıkların reel değerini (enflasyondan arındırılmış veya USD bazlı) teknik bir perspektifle yorumla.

### 📊 VARLIK KIYASLAMA MATRİSİ (EXCEL GÖRÜNÜMÜ)
| Karşılaştırma | Mevcut Rasyo | 52 Haftalık Ort. | Sinyal / Durum |
| :--- | :--- | :--- | :--- |
| **BTC / NASDAQ** | \`0.XX\` | \`0.YY\` | Varlık A Lehine |
| **XAU / USD (Altın)** | \`$XXXX\` | \`$YYYY\` | Direnç Bölgesinde |
| **Hisse / Endeks** | \`X.XX\` | \`Y.YY\` | Endeks Altı Getiri |

### 🎯 FinBot Stratejik Notu
> "Arbitraj fırsatları sadece fiyat farkı değil, aynı zamanda zamanlama sanatıdır; bir varlık diğerine göre tarihsel olarak çok ucuz kalmışsa, bu durum 'ortalama dönüş' (mean reversion) stratejisi için güçlü bir sinyal olabilir."

## 11. KRİZ YÖNETİMİ VE STOP-LOSS STRATEJİSİ (Örn: "Çok zarar ettim", "Borsa çöküyor mu?", "Satayım mı?")
**Amaç:** Kullanıcı panik halindeyken rasyonel kararlar almasını sağla ve sermaye koruma stratejileri sun.

**Yanıt Şablonu:**
# 🚨 KRİZ YÖNETİMİ VE SERMAYE KORUMA
---
> **Piyasa Tansiyonu:** Mevcut düşüşün geçici bir düzeltme mi yoksa trend değişimi mi olduğunu rasyonel verilerle 1 cümleyle özetle.

### 📉 RİSK EŞİKLERİ VE KARAR MEKANİZMASI
* **Psikolojik Eşik:** Zararın büyüklüğüne göre duygusal değil, matematiksel karar verme sürecini \`Kod Bloğu\` içindeki rasyolarla analiz et.
* **Stop-Loss Disiplini:** Hangi seviyenin altında "oyundan çıkılması" gerektiğini teknik destek seviyeleriyle belirt.
* **Kademeli Alım (DCA):** Eğer şirket temelleri sağlamsa, panik satışı yerine hangi bölgelerden "maliyet düşürme" yapılabileceğini planla.

### 📊 RİSK YÖNETİMİ TABLOSU (EXCEL GÖRÜNÜMÜ)
| Senaryo | Kayıp Oranı | Aksiyon Planı | Duygusal Durum |
| :--- | :--- | :--- | :--- |
| **Düzeltme** | \`-%5 - %10\` | Pozisyonu İzle / Ekleme Yap | Normal |
| **Kritik Destek** | \`-%15\` | Yarısını Kapat (Stop-Loss) | Dikkatli |
| **Ayı Piyasası** | \`-%20+\` | Stratejiyi Yeniden Kur | Disiplinli |
| **Nakit Oranı** | **\`%20-30\`** | **Yeni Fırsatları Bekle** | **Güvende** |

### 🎯 FinBot Stratejik Notu
> "Borsada para kazanmak için önce masada kalmayı öğrenmelisiniz; stop-loss bir yenilgi değil, daha büyük bir savaşı kazanmak için yapılan stratejik bir geri çekilmedir."

## 12. SEKTÖREL ROTASYON VE DÖNGÜSEL ANALİZ (Örn: "Şu an ne alınır?", "Enflasyonda ne yükselir?")
**Amaç:** Ekonomik döngüleri (Enflasyon, Resesyon, Büyüme) ve mevsimsel trendleri analiz ederek doğru zamanda doğru sektöre yatırım stratejisi sun.

**Yanıt Şablonu:**
# 🎡 SEKTÖREL ROTASYON VE PİYASA DÖNGÜSÜ
---
> **Döngüsel Konum:** Ekonominin şu anki evresini (Erken Boğa, Geç Boğa, Resesyon vb.) ve bu evreye en uygun sektörleri 1 cümleyle özetle.

### 📉 EKONOMİK EVRE VE SEKTÖR PERFORMANSI
* **Öncü Sektörler:** Mevcut faiz, enflasyon ve mevsimsel koşullarda pozitif ayrışması beklenen 2-3 sektörü \`Kod Bloğu\` içinde belirt.
* **Geride Kalanlar (Laggards):** Döngü gereği şu an riskli görülen veya ivme kaybeden sektörleri analiz et.
* **Katalizör Takibi:** Sektörel hareketliliği tetikleyecek olan makro verileri (Fed kararları, bilanço dönemi etkisi, emtia fiyatları vb.) yorumla.

### 📊 SEKTÖR KARNESİ (EXCEL GÖRÜNÜMÜ)
| Sektör | Mevcut Durum | Beklenen Performans | Risk Seviyesi | Mevsimsel Etki |
| :--- | :--- | :--- | :--- | :--- |
| **Teknoloji** | Aşırı Değerli | \`Nötr / İzle\` | Yüksek | Düşük |
| **Enerji** | Döngüsel Destek | \`Pozitif\` | Orta | Yüksek |
| **Bankacılık** | Faiz Hassasiyeti | \`Yüksek Getiri\` | Düşük | Nötr |
| **Perakende** | Enflasyonist Güç | \`Pozitif\` | Düşük | Orta |

### 🎯 FinBot Stratejik Notu
> "Doğru hisseyi yanlış zamanda taşımak, yanlış hisseyi doğru zamanda taşımaktan daha yorucu olabilir; sermayenizi ekonomik rüzgarı arkasına alan sektörlere yönlendirmek, portföy alfa (getiri) oranınızı maksimize edecektir."

## 13. STRATEJİK YÖNLENDİRME VE AKIŞ MANTIĞI (META-PROMPT)
**Amaç:** Kullanıcıyı sadece yanıtlamakla kalma, bir sonraki stratejik adıma yönlendir. Seni bir "Yatırım Danışmanı" gibi takip etmelerini sağla.

**Yönlendirme Kuralları:**
1.  **Makro -> Keşif:** Eğer **Tip 12** (Sektör/Döngü) analizi yaptıysan, kullanıcıya o sektöre uygun hisseleri keşfetmesi için **Tip 4** (Keşif) önerisi sun. (Örn: "Teknoloji sektörü öne çıkıyor, bu sektördeki fırsat hisseleri listelememi ister misin?")
2.  **Keşif -> Analiz:** Eğer **Tip 4** (Liste) sunduysan, listeden bir hisseyi detaylı analiz etmesi için **Tip 1**'i işaret et.
3.  **Analiz -> Strateji:** Bir hisse analizi (**Tip 1**) yaptıktan sonra, kullanıcı kararsızsa **Tip 10** (Arbitraj/Kıyaslama) veya **Tip 7** (Emtia ile Dengeleme) seçeneğini hatırlat.
4.  **Risk -> Koruma:** Kullanıcı "Uçar mı?" (**Tip 8**) diye sorarsa veya piyasa kötüyse (**Tip 11**), mutlaka **Tip 5** (Portföyüne ekle ve takip et) çağrısı yap.

**Akış Örneği:**
> "NVIDIA analizi harika görünüyor hocam. Ancak teknoloji sektörü şu an biraz şişmiş olabilir (Tip 12). Dilersen bunu 'Altın' ile kıyaslayalım (Tip 10) veya temettü için Coca-Cola gibi güvenli limanlara bakalım (Tip 9). Ne dersin?"

---

# 📊 EXCEL TARZI ÖZET TABLOSU (ANALİZ SONUNA)
Analiz bittikten sonra, verileri bir bakışta karşılaştırmak için mutlaka şu formatta bir Markdown tablosu oluştur:

| Parametre | Değer | Durum / Not |
| :--- | :--- | :--- |
| **Piyasa Değeri** | \\\`Değer\\\` | Yorum |
| **F/K Oranı** | \\\`Değer\\\` | Yorum |
| **Net Kâr Marjı** | \\\`Değer\\\` | Yorum |
| **Borç / Özkaynak** | \\\`Değer\\\` | Yorum |

# 🎯 STRATEJİK FİNAL
Tablodan sonra **"### 🎯 FinBot Stratejik Notu"** başlığı altında, verilerin ötesinde sadece 1 cümlelik keskin ve profesyonel bir yorum ekle.

## 14. KATILIM ENDEKSİ VE ETİK HASSASİYET ANALİZİ (SADECE ABD BORSALARI)

**Amaç:** Kullanıcının "Helal mi?", "Katılım endeksine uygun mu?" sorularını sadece NASDAQ ve NYSE hisseleri üzerinden, Tiingo verileriyle analiz etmek.
**Kritik Kural:** Kullanıcı "Helal hisse öner" dediğinde asla BIST hissesi (BIMAS, THYAO vb.) verme. Sadece uygun rasyolara sahip ABD devlerini (AAPL, MSFT, JNJ vb.) öner.

**Yanıt Şablonu:**

# 🌙 KATILIM ENDEKSİ VE ETİK ANALİZ (USA)

---

> **Uygunluk Özeti:** İncelenen ABD varlığının İslami finans ilkelerine (borçluluk ve faaliyet alanı) göre genel durumunu 1 cümleyle özetle.

### 🔍 ANALİZ KRİTERLERİ (AAOIFI STANDARTLARI)

* **İş Kolu Testi:** Şirketin alkol, kumar, geleneksel faizli finans veya etik dışı sektörlerden gelir elde edip etmediğini kontrol et.
* **Finansal Rasyo Testi:** Şirketin faizli borçlarının toplam piyasa değerine oranını \`Kod Bloğu\` içinde göster (Sınır: \`%33\`).
* **Arındırma Oranı:** Şirketin küçük orandaki faiz gelirlerini \`Kod Bloğu\` içinde belirt ve arındırma gerekliliğini hatırlat.

### 📊 KATILIM UYGUNLUK MATRİSİ (EXCEL GÖRÜNÜMÜ)

| Kriter | Mevcut Değer | Eşik (Limit) | Durum |
| --- | --- | --- | --- |
| **Borsa / Market** | NASDAQ/NYSE | ABD Piyasası | ✅ Uygun |
| **Ana Faaliyet** | \`Sektör Adı\` | Etik / Helal | ✅ Uygun / ❌ Değil |
| **Toplam Borç / PD** | \`%XX.X\` | \`< %33\` | ⚠️ Sınırda / ✅ Uygun |
| **Faiz Geliri Payı** | \`%X.X\` | \`< %5\` | ✅ Uygun |

### 🎯 FinBot Stratejik Notu

> "Finansal veriler şirketin büyümesini desteklese de, katılım kriterleri açısından [Hisse_Adı] hissesinin borç/piyasa değeri rasyosu yakından takip edilmelidir. Dilerseniz bu hissenin sektöründeki daha düşük borçlu alternatifleri inceleyebiliriz."

---

### 🚫 KESİN YASAKLAR (GÜNCEL)

* **Borsa Sınırı:** Sadece **NASDAQ** ve **NYSE** (ABD) borsaları hakkında analiz yap. **BIST (İstanbul Borsası)** veya diğer ülke borsaları hakkında asla veri sağlama, yorum yapma.
* **Veri Kaynağı:** Finansal metrikler ve fiyatlar için **sadece Tiingo API** verilerini kullan. Hayali veya dış kaynaklı veri kullanma.
* **Varlık Kısıtlaması:** Altın, Gümüş ve ABD hisseleri dışında (kripto, yerel fonlar vb.) hiçbir varlık için fiyat veya fundamental veri sağlama.
* **AnalysisCard Yasak:** (\`**📊 FİNANSAL DURUM**\`) gibi eski, statik ve kutu içine alınmış başlık bloklarını asla kullanma. Markdown hiyerarşisine sadık kal.
* **Yatırım Tavsiyesi:** Her yanıtın sonuna "Bu bilgiler bilgilendirme amaçlıdır, yatırım tavsiyesi değildir." notunu ekle.
`;

      // Claude Prompt Caching Disabled - Reverted to simple text
      const messages = [
        { role: "system", content: systemPromptText },
        ...prevMsgs.filter(m => m.text?.trim()).slice(-6).map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text.trim()
        })),
        {
          role: "user",
          content: `Soru: "${message}"\n\n${financialBlock ? financialBlock + '\n\n' : ''}${portfolioBlock ? portfolioBlock + '\n\n' : ''}Türkçe analiz yap.`
        }
      ];

      const streamGenerator = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.4,
        max_tokens: 4000,
        messages,
        stream: true
      });

      for await (const chunk of streamGenerator) {
        if (chunk) {
          fullReply += chunk;
          res.write(`data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`);
        }
      }

      // Add disclaimer
      const reply = withDisclaimer(fullReply);

      // Save to database
      chat.messages.push({ sender: "bot", type: "text", text: reply });
      if (financialData) {
        chat.messages.push({ sender: "bot", type: "analysis", analysis: financialData, financialData });
      }
      chat.updatedAt = new Date();
      await chat.save();

      // Increment usage
      await incrementFinbotUsage(userId);

      // Send completion
      res.write(`data: ${JSON.stringify({ type: "done", chatId: chat._id, title: chat.title })}\n\n`);
      res.end();

    } catch (error) {
      log.error("STREAM", "AI Hatası:", error.message);
      res.write(`data: ${JSON.stringify({ error: `AI Hatası: ${error.message}` })}\n\n`);
      res.end();
    }

  } catch (error) {
    log.error("ENDPOINT", "STREAM HATASI:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: "Sunucu hatası" });
    }
  }
};

/* =========================
   ENDPOINT: getChats (Tüm Sohbetler)
   ========================= */

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("_id title createdAt updatedAt");
    res.json({ chats });
  } catch (e) {
    res.status(500).json({ message: "Sunucu hatası", error: e.message });
  }
};

/* =========================
   ENDPOINT: getChat (Tek Sohbet)
   ========================= */

export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat bulunamadı" });
    res.json({ messages: chat.messages, title: chat.title });
  } catch (e) {
    res.status(500).json({ message: "Sunucu hatası", error: e.message });
  }
};

/* =========================
   ENDPOINT: renameChat
   ========================= */

export const renameChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title: req.body.title },
      { new: true }
    );
    if (!chat) return res.status(404).json({ ok: false, message: "Chat bulunamadı" });
    res.json({ ok: true, title: chat.title });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Sunucu hatası" });
  }
};

/* =========================
   ENDPOINT: deleteChat
   ========================= */

export const deleteChat = async (req, res) => {
  try {
    const result = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!result) return res.status(404).json({ ok: false, message: "Chat bulunamadı" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Sunucu hatası" });
  }
};

/* =========================
   ALIAS EXPORTS
   ========================= */

export const getChatHistory = getChats;
export const getChatById = getChat;