// PATH: backend/src/controllers/chatController.js
// Finansal Analist Chatbot - FULL STACK DEBUG MODE
// Tiingo API + OpenAI + Frontend Data Mapping

import "dotenv/config";
import axios from "axios";
import OpenAI from "openai";

// MODELS
import Chat from "../models/Chat.js";
import Portfolio from "../models/Portfolio.js";

// OpenAI Client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  // .IS uzantısını kaldır (örn: AAPL.IS -> AAPL)
  if (ticker.endsWith(".IS")) {
    const baseTicker = ticker.replace(".IS", "");
    log.debug("TICKER", `".IS" uzantısı kaldırıldı: ${ticker} -> ${baseTicker}`);
    ticker = baseTicker;
  }

  // Diğer borsa uzantılarını da temizle
  ticker = ticker.replace(/\.(NS|BO|L|T|SS|SZ|HK|AX|TO|SA)$/i, "");

  return ticker;
}

/**
 * Mesajdan ticker çıkarır ve temizler
 */
function extractTickerFromMessage(text) {
  log.debug("EXTRACT", "Mesaj analiz ediliyor:", text);

  if (!text) {
    log.warn("EXTRACT", "Mesaj boş, varsayılan: AAPL");
    return "AAPL";
  }

  const lowerText = text.toLowerCase();

  // 1. Şirket isimlerinden ara
  for (const [alias, ticker] of Object.entries(COMPANY_ALIASES)) {
    if (lowerText.includes(alias)) {
      log.info("EXTRACT", `Şirket ismi bulundu: "${alias}" -> ${ticker}`);
      return cleanTicker(ticker);
    }
  }

  // 2. Büyük harfli ticker ara (AAPL, TSLA, AAPL.IS gibi)
  const tickerMatch = text.match(/\b([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\b/);
  if (tickerMatch) {
    const rawTicker = tickerMatch[1];
    const exclude = ["API", "USD", "EUR", "TRY", "THE", "AND", "FOR", "AI", "UI", "UX"];
    if (!exclude.includes(rawTicker.replace(/\..+$/, ""))) {
      const cleanedTicker = cleanTicker(rawTicker);
      log.info("EXTRACT", `Ticker bulundu: ${rawTicker} -> ${cleanedTicker}`);
      return cleanedTicker;
    }
  }

  log.warn("EXTRACT", "Ticker bulunamadı, varsayılan: AAPL");
  return "AAPL";
}

/* =========================
   TİİNGO API
   ========================= */

async function fetchTiingoFundamentals(ticker) {
  log.divider();
  log.info("TIINGO", `Veri çekiliyor: ${ticker}`);

  const apiKey = process.env.TIINGO_API_KEY;
  if (!apiKey) {
    log.error("TIINGO", "TIINGO_API_KEY bulunamadı! .env dosyasını kontrol edin.");
    return null;
  }

  // Ticker'ı tekrar temizle (garanti olsun)
  const cleanedTicker = cleanTicker(ticker);
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

    // Tiingo API yapısı:
    // latest.statementData.incomeStatement -> Array of { dataCode, value }
    // latest.statementData.balanceSheet -> Array of { dataCode, value }
    // latest.statementData.cashFlow -> Array of { dataCode, value }
    // VEYA bazen direkt latest.statementData içinde overview olabilir.

    // Debug için statementData yapısını logla
    if (latest.statementData) {
      log.debug("TIINGO", "StatementData Keys:", Object.keys(latest.statementData));
      if (latest.statementData.incomeStatement) {
        log.debug("TIINGO", "IncomeStatement Length:", latest.statementData.incomeStatement.length);
      }
    }

    return {
      ticker: cleanedTicker,
      date: latest.date,
      statementData: latest.statementData
    };

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

  log.info("PARSE", "Ham Değerler:");
  console.log("   - Revenue:", rawMetrics.revenue);
  console.log("   - Net Income (net_val):", rawMetrics.netIncome);
  console.log("   - Total Assets:", rawMetrics.totalAssets);
  console.log("   - Total Equity:", rawMetrics.totalEquity);

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
  const isGrowing = true; // Yeterli veri yok varsayılan

  return `
=== 💡 FinBot Özeti (Otomatik) ===
${ticker} için finansal veriler incelendi. Şirket son dönemde ${formatNumberDisplay(metrics.netIncome)} net kâr açıklamıştır. Toplam varlıkları ${formatNumberDisplay(metrics.totalAssets)} seviyesindedir. NOT: Şu an yapay zeka servisine erişilemediği için bu otomatik bir özettir.

=== 📊 Temel Göstergeler ===
• Gelir: ${formatNumberDisplay(metrics.revenue)}
• Net Kâr: ${formatNumberDisplay(metrics.netIncome)}
• Özkaynak: ${formatNumberDisplay(metrics.totalEquity)}
• Borç: ${formatNumberDisplay(metrics.totalDebt)}

=== 🔍 Analiz ===
Şirketin finansal durumu veriler ışığında değerlendirilmelidir. ${isProfit ? "Şirket kârlı bir dönem geçirmiştir." : "Şirket bu dönem zarar açıklamıştır."} Yatırım kararı alırken sektörel karşılaştırma yapmanız önerilir.

=== ❓ Proaktif Soru ===
Bu şirketin son 5 yıllık gelir büyümesini görmek ister misiniz?
    `.trim();
}

async function getAIAnalysis(ticker, metrics, question, history = []) {
  log.divider();
  log.info("OPENAI", `${ticker} için AI analizi başlıyor...`);

  const systemPrompt = `Sen "FinBot" adında profesyonel bir finansal analistsın.

GÖREV: Finansal verileri analiz et, Türkçe kısa yatırımcı özeti oluştur.

KURALLAR:
1. Yanıtlar Türkçe olmalı
2. AL/SAT tavsiyesi VERME, objektif ol
3. Rakamları B (milyar), M (milyon) formatında göster
4. Her yanıtın sonunda kullanıcıya proaktif bir soru sor

FORMAT:
=== 💡 Özet ===
(2-3 cümle genel değerlendirme)

=== 📊 Temel Göstergeler ===
(Önemli metrikler liste halinde)

=== 🔍 Analiz ===
(Güçlü ve zayıf yönler)

=== ❓ Proaktif Soru ===
(Kullanıcıya yönlendirici soru)`;

  const financialBlock = `
FİNANSAL VERİLER (Kaynak: Tiingo API)
Hisse: ${ticker}
Dönem: ${metrics?.date || "Son Dönem"}

📈 GELİR TABLOSU:
- Gelir (Revenue): ${formatNumberDisplay(metrics?.revenue)} USD
- Brüt Kâr (Gross Profit): ${formatNumberDisplay(metrics?.grossProfit)} USD
- Net Kâr (Net Income): ${formatNumberDisplay(metrics?.netIncome)} USD
- EBITDA: ${formatNumberDisplay(metrics?.ebitda)} USD

📋 BİLANÇO:
- Toplam Varlık (Total Assets): ${formatNumberDisplay(metrics?.totalAssets)} USD
- Toplam Yükümlülük (Total Liabilities): ${formatNumberDisplay(metrics?.totalLiabilities)} USD
- Özkaynak (Equity): ${formatNumberDisplay(metrics?.totalEquity)} USD
- Toplam Borç (Total Debt): ${formatNumberDisplay(metrics?.totalDebt)} USD
- Nakit (Cash): ${formatNumberDisplay(metrics?.cash)} USD

💵 NAKİT AKIŞI:
- Faaliyetlerden Nakit: ${formatNumberDisplay(metrics?.operatingCashFlow)} USD
- Serbest Nakit Akışı: ${formatNumberDisplay(metrics?.freeCashFlow)} USD`;

  try {
    log.info("OPENAI", "API çağrısı yapılıyor (gpt-4o)...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.filter(m => m.text?.trim()).slice(-6).map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text.trim()
        })),
        { role: "user", content: `Soru: "${question}"\n\n${financialBlock}\n\nTürkçe analiz yap.` }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    log.info("OPENAI", `Yanıt alındı (${reply?.length || 0} karakter)`);

    return reply || getFallbackAnalysis(ticker, metrics);

  } catch (error) {
    log.error("OPENAI", "API Hatası:", error.message);

    // QUOTA (429) veya diğer hatalarda Fallback kullan
    return getFallbackAnalysis(ticker, metrics);
  }
}

/* =========================
   ANA BOT FONKSİYONU
   ========================= */

async function getChatResponse(question, history = []) {
  log.divider();
  console.log("🤖🤖🤖 [FINBOT] YENİ SORGU BAŞLADI 🤖🤖🤖");
  log.info("FINBOT", "Kullanıcı sorusu:", question);
  log.divider();

  // AŞAMA 1: Ticker Tespiti ve Temizliği
  log.info("AŞAMA 1", "Ticker tespit ediliyor...");
  const ticker = extractTickerFromMessage(question);
  log.info("AŞAMA 1", `Temizlenmiş Ticker: ${ticker}`);

  // AŞAMA 2: Tiingo'dan Veri Çek
  log.info("AŞAMA 2", "Tiingo API'dan veri çekiliyor...");
  const tiingoData = await fetchTiingoFundamentals(ticker);

  if (!tiingoData) {
    log.error("AŞAMA 2", "Tiingo'dan veri alınamadı!");
    return {
      reply: `Üzgünüm, ${ticker} için finansal veri elde edemedim. Lütfen geçerli bir ABD hissesi deneyin (örn: Apple, Microsoft, Tesla).`,
      params: { ticker },
      financialData: null
    };
  }

  // AŞAMA 3: Metrikleri Parse Et
  log.info("AŞAMA 3", "Metrikler parse ediliyor...");
  const metrics = parseMetrics(tiingoData);

  if (!metrics) {
    log.error("AŞAMA 3", "Metrikler okunamadı!");
    return {
      reply: `${ticker} verisi işlenemedi. Lütfen tekrar deneyin.`,
      params: { ticker },
      financialData: null
    };
  }

  // AŞAMA 4: Frontend İçin Data Mapping
  log.info("AŞAMA 4", "Frontend için veri hazırlanıyor...");
  const financialData = createFinancialDataForFrontend(ticker, metrics);

  // AŞAMA 5: AI Analizi (Fallback Korumalı)
  log.info("AŞAMA 5", "OpenAI analizi...");
  const aiReply = await getAIAnalysis(ticker, metrics, question, history);

  log.divider();
  console.log("✅✅✅ [FINBOT] SORGU TAMAMLANDI ✅✅✅");
  log.divider();

  return {
    reply: aiReply,
    params: { ticker, date: metrics.date },
    financialData: financialData,  // Frontend için
    analysis: financialData        // Alternatif key
  };
}

/* =========================
   ENDPOINT: sendMessage
   ========================= */

export const sendMessage = async (req, res) => {
  log.divider();
  console.log("📥📥📥 [ENDPOINT] /api/chat ÇAĞRILDI 📥📥📥");
  log.divider();

  try {
    const { message, chatId } = req.body;
    const userId = req.user._id;

    log.info("ENDPOINT", "User ID:", userId);

    // Boş mesaj + chatId yok = yeni sohbet oluştur
    if ((!message || !message.trim()) && !chatId) {
      const chat = new Chat({ user: userId, messages: [], title: "Yeni Sohbet" });
      await chat.save();
      return res.json({ reply: null, chatId: chat._id, messages: [], title: "Yeni Sohbet" });
    }

    if (!message) {
      return res.status(400).json({ message: "Mesaj boş olamaz" });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: userId });
      if (!chat) {
        return res.status(404).json({ message: "Sohbet bulunamadı." });
      }
    } else {
      chat = new Chat({ user: userId, messages: [], title: "Yeni Sohbet" });
    }

    // Kullanıcı mesajını ekle
    chat.messages.push({ sender: "user", text: message });

    // Bot yanıtı al
    const prevMsgs = chat.messages.filter(m => m.text?.trim()).slice(-10);
    const { reply: rawReply, params, financialData, analysis } = await getChatResponse(message, prevMsgs);

    // Yanıtı ekle
    const reply = withDisclaimer(rawReply || "Yanıt alınamadı.");
    chat.messages.push({ sender: "bot", type: "text", text: reply });

    // Finansal veriyi ekle
    if (financialData) {
      chat.messages.push({ sender: "bot", type: "analysis", analysis: financialData, financialData: financialData });
    }

    chat.updatedAt = new Date();
    await chat.save();

    return res.json({
      reply,
      chatId: chat._id,
      messages: chat.messages,
      title: chat.title,
      financialData: financialData, // Frontend için
      analysis: financialData
    });

  } catch (error) {
    log.error("ENDPOINT", "SUNUCU HATASI:", error.message);
    return res.status(500).json({ message: "Sunucu hatası." });
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