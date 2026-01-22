// PATH: backend/src/controllers/stockAnalysisController.js
/**
 * Stock Analysis Controller - US Market Edition
 * Provides AI-powered stock analysis using Tiingo data
 */

import "dotenv/config";
import { OpenAI } from "openai";

// Tiingo Services
import { getPrice, getProfile } from "../services/tiingo/stockService.js";
import { getFundamentals, formatNumber } from "../services/tiingo/fundamentalsService.js";
import { getNews } from "../services/tiingo/newsService.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyzes a stock using FinBot Scoring System
 * Returns structured JSON with score, metrics, and AI verdict
 */
export async function analyzeStock(req, res) {
  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ error: "ticker is required" });
    }

    const normalizedTicker = ticker.toUpperCase().replace('.IS', '');

    // Fetch data from Tiingo
    const [priceData, profileData, fundamentalsData, newsData] = await Promise.all([
      getPrice(normalizedTicker).catch(() => null),
      getProfile(normalizedTicker).catch(() => null),
      getFundamentals(normalizedTicker).catch(() => null),
      getNews(normalizedTicker, 5).catch(() => [])
    ]);

    if (!priceData && !fundamentalsData) {
      return res.status(404).json({
        error: "Unable to fetch data for this ticker. Please try a major US stock like AAPL, TSLA, or NVDA."
      });
    }

    // Build analysis prompt
    const dataBlock = `
STOCK: ${normalizedTicker}
COMPANY: ${profileData?.name || normalizedTicker}
SECTOR: ${profileData?.sector || 'N/A'}
INDUSTRY: ${profileData?.industry || 'N/A'}

PRICE DATA:
- Current Price: $${priceData?.price?.toFixed(2) || 'N/A'}
- Daily Change: ${priceData?.change > 0 ? '+' : ''}${priceData?.change?.toFixed(2) || '0'} (${priceData?.changePercent?.toFixed(2) || '0'}%)
- Volume: ${formatNumber(priceData?.volume)}

FUNDAMENTALS (${fundamentalsData?.period || 'Latest'}):
- Revenue: $${formatNumber(fundamentalsData?.revenue)}
- Net Income: $${formatNumber(fundamentalsData?.netIncome)}
- Gross Profit: $${formatNumber(fundamentalsData?.grossProfit)}
- EPS: $${fundamentalsData?.eps?.toFixed(2) || 'N/A'}
- ROE: ${fundamentalsData?.roe?.toFixed(1) || 'N/A'}%
- ROA: ${fundamentalsData?.roa?.toFixed(1) || 'N/A'}%
- Debt/Equity: ${fundamentalsData?.debtToEquity?.toFixed(2) || 'N/A'}

RECENT NEWS SENTIMENT:
${newsData.slice(0, 3).map(n => `- ${n.title} (${n.sentiment})`).join('\n') || 'No recent news'}
`.trim();

    const systemPrompt = `You are FinBot, an advanced financial analyst. Analyze stocks and return ONLY valid JSON.

SCORING RULES:
- Score 0-4: Weak/Underperforming
- Score 5-7: Neutral/Average
- Score 8-10: Strong/Outperforming

REQUIRED JSON FORMAT (return ONLY this, no other text):
{
  "score": 7.5,
  "score_label": "Strong",
  "metrics": [
    {
      "title": "Valuation",
      "value": "Fair",
      "detail": "P/E ratio analysis...",
      "sentiment": "positive"
    }
  ],
  "ai_verdict": "Brief 2-3 sentence summary with emoji..."
}

Metrics should include: Valuation, Profitability, Growth, Financial Health, Momentum.
Sentiment must be: "positive", "neutral", or "negative".`;

    const userPrompt = `Analyze this stock and return JSON only:\n\n${dataBlock}`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    let analysis;
    try {
      const content = completion.choices?.[0]?.message?.content?.trim() || "{}";
      let parsed = JSON.parse(content);

      // Validate and normalize
      if (!parsed.score || typeof parsed.score !== 'number') {
        parsed.score = 5.0;
      }
      parsed.score = Math.max(0, Math.min(10, Number(parsed.score.toFixed(1))));

      if (!parsed.score_label) {
        parsed.score_label = parsed.score >= 8 ? "Strong" : parsed.score >= 5 ? "Neutral" : "Weak";
      }

      if (!Array.isArray(parsed.metrics)) {
        parsed.metrics = [];
      }

      parsed.metrics = parsed.metrics
        .filter(m => m && m.title && m.value && m.detail && m.sentiment)
        .map(m => ({
          title: String(m.title),
          value: String(m.value),
          detail: String(m.detail),
          sentiment: ['positive', 'neutral', 'negative'].includes(m.sentiment) ? m.sentiment : 'neutral'
        }))
        .slice(0, 5);

      if (!parsed.ai_verdict) {
        parsed.ai_verdict = `${normalizedTicker} analysis completed. See metrics for details.`;
      }

      analysis = {
        ticker: normalizedTicker,
        company: profileData?.name || normalizedTicker,
        price: priceData?.price,
        change: priceData?.change,
        changePercent: priceData?.changePercent,
        score: parsed.score,
        scoreLabel: parsed.score_label,
        aiSummary: parsed.ai_verdict.substring(0, 300),
        metrics: parsed.metrics,
        fundamentals: {
          revenue: fundamentalsData?.revenue,
          netIncome: fundamentalsData?.netIncome,
          eps: fundamentalsData?.eps,
          roe: fundamentalsData?.roe,
          roa: fundamentalsData?.roa,
          debtToEquity: fundamentalsData?.debtToEquity
        },
        source: priceData?.source || 'tiingo'
      };

    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      analysis = {
        ticker: normalizedTicker,
        company: profileData?.name || normalizedTicker,
        price: priceData?.price,
        score: 5.0,
        scoreLabel: "Neutral",
        aiSummary: "Analysis could not be completed. Please try again.",
        metrics: []
      };
    }

    res.json(analysis);

  } catch (error) {
    console.error("Stock Analysis Error:", error);
    res.status(500).json({
      error: "Analysis failed",
      details: error.message
    });
  }
}

/**
 * Get quick stock summary
 */
export async function getStockSummary(req, res) {
  try {
    const { ticker } = req.params;
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');

    if (!normalizedTicker) {
      return res.status(400).json({ error: "Ticker is required" });
    }

    const [priceData, profileData, fundamentalsData] = await Promise.all([
      getPrice(normalizedTicker).catch(() => null),
      getProfile(normalizedTicker).catch(() => null),
      getFundamentals(normalizedTicker).catch(() => null)
    ]);

    res.json({
      ticker: normalizedTicker,
      name: profileData?.name || normalizedTicker,
      sector: profileData?.sector,
      price: priceData?.price,
      change: priceData?.change,
      changePercent: priceData?.changePercent,
      volume: priceData?.volume,
      marketCap: profileData?.marketCap,
      eps: fundamentalsData?.eps,
      roe: fundamentalsData?.roe,
      peRatio: profileData?.peRatio,
      source: priceData?.source || 'tiingo'
    });

  } catch (error) {
    console.error("Stock Summary Error:", error);
    res.status(500).json({ error: "Failed to get stock summary" });
  }
}

/**
 * Compare two stocks
 */
export async function compareStocks(req, res) {
  try {
    const { ticker1, ticker2 } = req.body;

    if (!ticker1 || !ticker2) {
      return res.status(400).json({ error: "Two tickers are required" });
    }

    const t1 = ticker1.toUpperCase().replace('.IS', '');
    const t2 = ticker2.toUpperCase().replace('.IS', '');

    const [data1, data2] = await Promise.all([
      Promise.all([
        getPrice(t1).catch(() => null),
        getProfile(t1).catch(() => null),
        getFundamentals(t1).catch(() => null)
      ]),
      Promise.all([
        getPrice(t2).catch(() => null),
        getProfile(t2).catch(() => null),
        getFundamentals(t2).catch(() => null)
      ])
    ]);

    const [price1, profile1, fund1] = data1;
    const [price2, profile2, fund2] = data2;

    res.json({
      comparison: [
        {
          ticker: t1,
          name: profile1?.name || t1,
          sector: profile1?.sector,
          price: price1?.price,
          changePercent: price1?.changePercent,
          eps: fund1?.eps,
          roe: fund1?.roe,
          debtToEquity: fund1?.debtToEquity
        },
        {
          ticker: t2,
          name: profile2?.name || t2,
          sector: profile2?.sector,
          price: price2?.price,
          changePercent: price2?.changePercent,
          eps: fund2?.eps,
          roe: fund2?.roe,
          debtToEquity: fund2?.debtToEquity
        }
      ]
    });

  } catch (error) {
    console.error("Compare Stocks Error:", error);
    res.status(500).json({ error: "Comparison failed" });
  }
}

export default {
  analyzeStock,
  getStockSummary,
  compareStocks
};
