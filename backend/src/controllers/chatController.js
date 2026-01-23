// PATH: backend/src/controllers/chatController.js
/**
 * FinBot Chat Controller - US Market Edition
 * Powered by Tiingo API for stock data, news, and fundamentals
 */

import "dotenv/config";
import { OpenAI } from "openai";

// Models
import Chat from "../models/Chat.js";
import Portfolio from "../models/Portfolio.js";

// Tiingo Services
import {
  getPrice,
  getProfile,
  searchTicker,
  getHistoricalPrices
} from "../services/tiingo/stockService.js";
import {
  getNews,
  analyzeSentiment
} from "../services/tiingo/newsService.js";
import {
  getFundamentals,
  getKeyMetrics,
  formatNumber
} from "../services/tiingo/fundamentalsService.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============== HELPER FUNCTIONS ==============

function fmtNum(n) {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return Number(n).toFixed(2);
}

// US Stock ticker detection - common US stocks
const US_STOCK_ALIASES = {
  apple: 'AAPL', aapl: 'AAPL',
  tesla: 'TSLA', tsla: 'TSLA',
  nvidia: 'NVDA', nvda: 'NVDA',
  microsoft: 'MSFT', msft: 'MSFT',
  google: 'GOOGL', googl: 'GOOGL', alphabet: 'GOOGL',
  amazon: 'AMZN', amzn: 'AMZN',
  meta: 'META', facebook: 'META',
  netflix: 'NFLX', nflx: 'NFLX',
  disney: 'DIS', dis: 'DIS',
  'berkshire': 'BRK.B', 'brk': 'BRK.B',
  jpmorgan: 'JPM', jpm: 'JPM',
  'bank of america': 'BAC', bac: 'BAC',
  visa: 'V',
  mastercard: 'MA',
  intel: 'INTC', intc: 'INTC',
  amd: 'AMD',
  coca: 'KO', 'coca-cola': 'KO', ko: 'KO',
  pepsi: 'PEP', pepsico: 'PEP', pep: 'PEP',
  walmart: 'WMT', wmt: 'WMT',
  costco: 'COST', cost: 'COST',
  boeing: 'BA', ba: 'BA',
  exxon: 'XOM', xom: 'XOM',
  chevron: 'CVX', cvx: 'CVX'
};

function normalizeUSTicker(input) {
  if (!input) return null;
  const n = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!n) return null;

  // Check aliases
  if (US_STOCK_ALIASES[n]) return US_STOCK_ALIASES[n];

  // Check if it's already a ticker format (2-5 uppercase letters)
  const upper = input.trim().toUpperCase();
  if (/^[A-Z]{1,5}$/.test(upper)) return upper;

  return null;
}

function extractTickersFromMessage(text) {
  if (!text) return [];
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/gi, " ");
  const words = normalized.split(/\s+/);
  const out = [];

  for (const w of words) {
    const t = normalizeUSTicker(w);
    if (t && !out.includes(t)) out.push(t);
  }

  return out;
}

function detectQuestionType(text) {
  if (!text) return 'unknown';
  const lowerText = text.toLowerCase();

  const financialKeywords = [
    'stock', 'share', 'price', 'market', 'invest', 'portfolio', 'trade',
    'earnings', 'revenue', 'profit', 'loss', 'dividend', 'pe ratio', 'p/e',
    'roe', 'roa', 'eps', 'ebitda', 'margin', 'growth', 'valuation',
    'bull', 'bear', 'sector', 'nasdaq', 'nyse', 's&p', 'dow',
    'analysis', 'fundamental', 'technical', 'chart', 'trend',
    'buy', 'sell', 'hold', 'long', 'short', 'option', 'call', 'put',
    // Turkish keywords
    'hisse', 'yatırım', 'portföy', 'piyasa', 'borsa', 'analiz', 'fiyat'
  ];

  const irrelevantKeywords = [
    'recipe', 'cook', 'movie', 'song', 'game', 'sport', 'weather',
    'tarif', 'yemek', 'film', 'şarkı', 'oyun', 'spor', 'hava'
  ];

  const hasFinancial = financialKeywords.some(kw => lowerText.includes(kw));
  const hasIrrelevant = irrelevantKeywords.some(kw => lowerText.includes(kw));

  if (hasIrrelevant && !hasFinancial) return 'irrelevant';
  if (hasFinancial) return 'financial';
  return 'general';
}

function detectPortfolioStrategy(text) {
  if (!text) return null;
  const lowerText = text.toLowerCase();

  const portfolioKeywords = ['portfolio', 'portföy', 'allocation', 'dağılım', 'build', 'create', 'suggest'];
  const hasPortfolioRequest = portfolioKeywords.some(kw => lowerText.includes(kw));
  if (!hasPortfolioRequest) return null;

  const dividendKeywords = ['dividend', 'income', 'yield', 'temettü', 'gelir'];
  if (dividendKeywords.some(kw => lowerText.includes(kw))) return 'dividend';

  const aggressiveKeywords = ['aggressive', 'growth', 'risk', 'agresif', 'büyüme'];
  if (aggressiveKeywords.some(kw => lowerText.includes(kw))) return 'aggressive';

  const defensiveKeywords = ['safe', 'defensive', 'low risk', 'güvenli', 'düşük risk'];
  if (defensiveKeywords.some(kw => lowerText.includes(kw))) return 'defensive';

  return 'general';
}

// ============== SYSTEM PROMPTS ==============

const WALL_STREET_ANALYST_PROMPT = `You are FinBot, a sophisticated Wall Street financial analyst with expertise in US stock markets. You have access to real-time data from Tiingo API.

CORE BEHAVIORS:
1. Provide data-driven analysis based on the financial data provided
2. Use professional but accessible language
3. Always cite specific metrics (P/E, ROE, EPS, etc.)
4. Never give direct buy/sell recommendations - provide objective analysis
5. Use emojis sparingly for better readability
6. Format responses with clear sections using markdown

RESPONSE FORMAT:
=== 💡 Executive Summary ===
(2-3 sentence overview)

=== 📊 Key Metrics ===
(Table or bullet points of important financials)

=== 🔍 Analysis ===
(Detailed analysis with comparisons)

=== ⚠️ Risk Factors ===
(Potential concerns or risks)

=== ❓ Follow-up ===
(Proactive question to continue the conversation)

LANGUAGE: Respond in the same language as the user's question (Turkish or English).`;

const CONCEPT_PROMPT = `You are FinBot, a Wall Street financial educator. Explain financial concepts clearly and concisely.

For concept questions, respond with:
=== Definition ===
(Clear, simple explanation)

=== Example ===
(Real-world example using US stocks)

=== Why It Matters ===
(Why investors should care)

Keep explanations simple enough for a beginner but accurate enough for an expert.
LANGUAGE: Match the user's language (Turkish or English).`;

// ============== MAIN CHAT LOGIC ==============

async function askFinbot(question, history = [], portfolioContext = null) {
  const tickers = extractTickersFromMessage(question);
  const questionType = detectQuestionType(question);

  // Reject irrelevant questions
  if (questionType === 'irrelevant') {
    return {
      reply: "I'm FinBot, your US stock market analyst. I can help with stock analysis, market trends, portfolio strategies, and financial concepts. What would you like to know about the markets today?",
      params: null,
      chartData: null
    };
  }

  // Portfolio context formatting
  let portfolioContextBlock = "";
  if (portfolioContext && portfolioContext.length > 0) {
    const totalValue = portfolioContext.reduce((sum, h) => sum + (h.qty * h.avg_cost), 0);
    portfolioContextBlock = `
USER PORTFOLIO:
${portfolioContext.map(h => `- ${h.symbol}: ${h.qty} shares @ $${h.avg_cost.toFixed(2)}`).join("\n")}
Total Value: $${totalValue.toLocaleString()}
`;
  }

  // CONCEPT MODE (no tickers detected)
  if (!tickers.length) {
    const messages = [
      { role: "system", content: CONCEPT_PROMPT },
      ...history.filter(m => m.text?.trim()).slice(-10).map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text.trim()
      })),
      { role: "user", content: question }
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3,
        messages
      });
      return { reply: completion.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response.", params: null, chartData: null };
    } catch (err) {
      console.error("OpenAI error:", err.message);
      return { reply: "I encountered an error. Please try again.", params: null, chartData: null };
    }
  }

  // STOCK ANALYSIS MODE
  const ticker = tickers[0];

  try {
    // Fetch data from Tiingo services
    console.log(`[askFinbot] Fetching data for ticker: ${ticker}`);
    const [priceData, profileData, fundamentalsData] = await Promise.all([
      getPrice(ticker).catch((e) => { console.error(`[Tiingo] Price error for ${ticker}:`, e.message); return null; }),
      getProfile(ticker).catch((e) => { console.error(`[Tiingo] Profile error for ${ticker}:`, e.message); return null; }),
      getFundamentals(ticker).catch((e) => { console.error(`[Tiingo] Fundamentals error for ${ticker}:`, e.message); return null; })
    ]);
    console.log(`[askFinbot] Tiingo data fetch complete for ${ticker}.`);

    // Build fact block
    const factBlock = `
STOCK: ${ticker}
Company: ${profileData?.name || ticker}
Sector: ${profileData?.sector || 'N/A'}
Industry: ${profileData?.industry || 'N/A'}

PRICE DATA:
- Current Price: $${priceData?.price || 'N/A'}
- Change: ${priceData?.change > 0 ? '+' : ''}${priceData?.change?.toFixed(2) || 'N/A'} (${priceData?.changePercent?.toFixed(2) || 'N/A'}%)
- Volume: ${fmtNum(priceData?.volume)}

FUNDAMENTALS (${fundamentalsData?.period || 'Latest'}):
- Revenue: $${fmtNum(fundamentalsData?.revenue)}
- Net Income: $${fmtNum(fundamentalsData?.netIncome)}
- EPS: $${fundamentalsData?.eps?.toFixed(2) || 'N/A'}
- ROE: ${fundamentalsData?.roe?.toFixed(1) || 'N/A'}%
- ROA: ${fundamentalsData?.roa?.toFixed(1) || 'N/A'}%
- Debt/Equity: ${fundamentalsData?.debtToEquity?.toFixed(2) || 'N/A'}

${portfolioContextBlock}
`.trim();

    const messages = [
      { role: "system", content: WALL_STREET_ANALYST_PROMPT },
      ...history.filter(m => m.text?.trim()).slice(-10).map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text.trim()
      })),
      {
        role: "user",
        content: `User Question: "${question}"\n\nMARKET DATA:\n${factBlock}\n\nProvide a comprehensive analysis based on this data.`
      }
    ];

    console.log("[askFinbot] Sending request to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      messages
    });
    console.log("[askFinbot] OpenAI response received.");

    const replyText = completion.choices?.[0]?.message?.content?.trim() || "Analysis could not be generated.";

    return {
      reply: replyText,
      params: { ticker, priceData, fundamentalsData },
      chartData: null
    };

  } catch (error) {
    console.error("Stock analysis error:", error.message);
    return {
      reply: `I'm having trouble fetching data for ${ticker}. Please try again or ask about another stock.`,
      params: { ticker },
      chartData: null
    };
  }
}

// ============== MAIN ENDPOINT ==============

export const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const userId = req.user._id;
    console.log(`[Chat] Incoming message from user ${userId}: "${message?.substring(0, 20)}..." (chatId: ${chatId || 'new'})`);

    // Create new chat if no message and no chatId
    if ((!message || message.trim() === "") && !chatId) {
      const chat = new Chat({
        user: userId,
        messages: [],
        title: "New Chat"
      });
      await chat.save();
      return res.json({ reply: null, chatId: chat._id, messages: [], title: "New Chat" });
    }

    if (!message) return res.status(400).json({ message: "Message cannot be empty" });

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: userId });
      if (!chat) return res.status(404).json({ message: "Chat not found" });
    } else {
      chat = new Chat({
        user: userId,
        messages: [],
        title: "New Chat"
      });
    }

    // Add user message
    chat.messages.push({ sender: "user", text: message });

    // Get portfolio context
    let portfolioContext = null;
    try {
      const portfolioItems = await Portfolio.find({ user: userId }).select("ticker quantity avgCost -_id");
      if (portfolioItems && portfolioItems.length > 0) {
        portfolioContext = portfolioItems.map(item => ({
          symbol: item.ticker,
          qty: item.quantity,
          avg_cost: item.avgCost
        }));
      }
    } catch (err) {
      console.error("Portfolio fetch error:", err.message);
    }

    // Generate bot response
    console.log("[Chat] Calling askFinbot...");
    const prevMsgs = chat.messages.filter(m => m.text?.trim()).slice(-10);
    const { reply: rawReply, chartData, params } = await askFinbot(message, prevMsgs, portfolioContext);
    console.log("[Chat] askFinbot response received.");

    let reply = rawReply || "I couldn't generate a response.";
    chat.messages.push({ sender: "bot", type: "text", text: reply });

    // Update chat title from first message
    if (chat.messages.filter(m => m.sender === 'user').length === 1) {
      chat.title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
    }

    await chat.save();
    console.log("[Chat] Saved successfully.");

    res.json({
      reply,
      chatId: chat._id,
      messages: chat.messages,
      title: chat.title,
      chartData,
      params
    });

  } catch (err) {
    console.error("[Chat] CRITICAL ERROR in sendMessage:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ user: userId })
      .select("_id title messages createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json(chats);
  } catch (err) {
    console.error("getChatHistory error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getChatById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, user: userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json(chat);
  } catch (err) {
    console.error("getChatById error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const result = await Chat.deleteOne({ _id: chatId, user: userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json({ message: "Chat deleted" });
  } catch (err) {
    console.error("deleteChat error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const renameChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;
    const { title } = req.body;

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, user: userId },
      { title },
      { new: true }
    );

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json(chat);
  } catch (err) {
    console.error("renameChat error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export function withDisclaimer(text) {
  return text;
}

export default {
  sendMessage,
  getChatHistory,
  getChatById,
  deleteChat,
  renameChat,
  withDisclaimer
};