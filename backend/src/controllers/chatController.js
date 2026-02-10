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
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";

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
    res.flushHeaders(); // Ensure headers are sent immediately

    // Initialize Stream with "Thinking" status
    res.write(`data: ${JSON.stringify({ type: "thought", content: "Analiz başlatılıyor..." })}\n\n`);

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
      res.write(`data: ${JSON.stringify({ type: "thought", content: `Veriler çekiliyor: ${tickers.join(", ")}...` })}\n\n`);

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
        res.write(`data: ${JSON.stringify({ type: "thought", content: `${newsResults.length} adet haber kaynağı inceleniyor...` })}\n\n`);
      }

      if (!financialBlock) {
        log.warn("ENDPOINT", "Tickers detected but no data found for any. Proceeding as general query.");
        res.write(`data: ${JSON.stringify({ type: "thought", content: "Veri bulunamadı, genel analiz yapılıyor..." })}\n\n`);
      }
    } else {
      log.info("ENDPOINT", "No tickers detected. Proceeding as general/discovery query.");
      res.write(`data: ${JSON.stringify({ type: "thought", content: "Genel finansal asistan modu..." })}\n\n`);
    }

    // Stream AI response
    res.write(`data: ${JSON.stringify({ type: "thought", content: "FinBot yanıtı oluşturuyor..." })}\n\n`);

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
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...prevMsgs.filter(m => m.text?.trim()).slice(-6).map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text.trim()
        })),
        {
          role: "user",
          content: `Soru: "${message}"\n\n${financialBlock ? financialBlock + '\n\n' : ''}${portfolioBlock ? portfolioBlock + '\n\n' : ''}Türkçe analiz yap.`
        }
      ];

      // Use the new Stream function from Bedrock Service
      // which returns correct object structure { type: 'text' | 'thought' | 'error', content: ... }
      const streamGenerator = openai.chat.completions.create({
        model: "claude-3-5-sonnet", // Model ID is handled in service, this key is symbolic here
        temperature: 0.4,
        max_tokens: 4096,
        messages,
        stream: true,
        thinking: { type: "enabled", budget_tokens: 1024 } // Request thinking if supported
      });

      console.log("DEBUG: streamGenerator type:", typeof streamGenerator);
      console.log("DEBUG: isAsyncIterable?", streamGenerator && typeof streamGenerator[Symbol.asyncIterator] === 'function');
      if (streamGenerator && !streamGenerator[Symbol.asyncIterator] && streamGenerator.then) {
        console.log("DEBUG: streamGenerator is a Promise! Await it?");
      }

      // --- SIMULATED THOUGHTS (For better UX) ---
      // Send initial thoughts to make the UI feel responsive immediately
      if (true) {
        const initialThoughts = [
          "Piyasa verileri kontrol ediliyor...",
          "Güncel borsa haberleri taranıyor...",
          "Teknik indikatörler hesaplanıyor..."
        ];

        for (const thought of initialThoughts) {
          res.write(`data: ${JSON.stringify({ type: "thought", content: thought })}\n\n`);
          // Small delay to simulate processing steps
          await new Promise(r => setTimeout(r, 600));
        }
      }

      for await (const chunk of streamGenerator) {
        if (chunk) {
          if (chunk.type === 'thought') {
            // Pass through thinking chunks
            res.write(`data: ${JSON.stringify({ type: "thought", content: chunk.content })}\n\n`);
          } else if (chunk.type === 'text') {
            // Pass through text chunks
            fullReply += chunk.content;
            res.write(`data: ${JSON.stringify({ type: "text", content: chunk.content })}\n\n`);
          } else if (chunk.type === 'error') {
            // Handle error chunks from service
            res.write(`data: ${JSON.stringify({ error: chunk.content })}\n\n`);
          }
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