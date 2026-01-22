// PATH: backend/src/data/us/mockFinancials.js

/**
 * Mock Financial Data for US Stocks
 * Used when Polygon.io API is unavailable or USE_MOCK_DATA=true
 * Contains realistic sample data for major US stocks
 */

export const mockFinancials = {
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    ceo: "Tim Cook",
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 2800000000000, // $2.8T
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
    
    // Latest Quarter (Q4 2023)
    latestFinancials: {
      period: "2023-Q4",
      reportType: "10-Q",
      revenues: 89498000000, // $89.5B
      netIncome: 22956000000, // $23.0B
      eps: 1.46,
      totalAssets: 352755000000,
      totalLiabilities: 290437000000,
      shareholderEquity: 62318000000,
      operatingCashFlow: 26769000000,
      freeCashFlow: 24000000000,
    },
    
    // Annual Data (FY 2023)
    annualFinancials: {
      period: "2023",
      reportType: "10-K",
      revenues: 383285000000, // $383.3B
      netIncome: 96995000000, // $97.0B
      eps: 6.16,
      totalAssets: 352755000000,
      totalLiabilities: 290437000000,
      shareholderEquity: 62318000000,
      operatingCashFlow: 110543000000,
      freeCashFlow: 99584000000,
      researchDevelopment: 29915000000,
    },
    
    // Key Metrics
    metrics: {
      peRatio: 28.5,
      pbRatio: 45.0,
      dividendYield: 0.52,
      profitMargin: 25.31,
      roe: 155.7,
      debtToEquity: 1.81,
      currentRatio: 0.98,
    }
  },

  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    ceo: "Elon Musk",
    sector: "Consumer Discretionary",
    industry: "Automobiles",
    marketCap: 650000000000, // $650B
    description: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.",
    
    latestFinancials: {
      period: "2023-Q4",
      reportType: "10-Q",
      revenues: 25167000000, // $25.2B
      netIncome: 7928000000, // $7.9B
      eps: 2.27,
      totalAssets: 106618000000,
      totalLiabilities: 43009000000,
      shareholderEquity: 63609000000,
      operatingCashFlow: 13256000000,
      freeCashFlow: 10815000000,
    },
    
    annualFinancials: {
      period: "2023",
      reportType: "10-K",
      revenues: 96773000000, // $96.8B
      netIncome: 14974000000, // $15.0B
      eps: 4.30,
      totalAssets: 106618000000,
      totalLiabilities: 43009000000,
      shareholderEquity: 63609000000,
      operatingCashFlow: 13256000000,
      freeCashFlow: 10815000000,
      researchDevelopment: 3969000000,
    },
    
    metrics: {
      peRatio: 65.2,
      pbRatio: 10.2,
      dividendYield: 0.0,
      profitMargin: 15.5,
      roe: 23.5,
      debtToEquity: 0.17,
      currentRatio: 1.73,
    }
  },

  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    ceo: "Jensen Huang",
    sector: "Technology",
    industry: "Semiconductors",
    marketCap: 1200000000000, // $1.2T
    description: "NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.",
    
    latestFinancials: {
      period: "2024-Q3",
      reportType: "10-Q",
      revenues: 18120000000, // $18.1B
      netIncome: 9243000000, // $9.2B
      eps: 3.71,
      totalAssets: 65728000000,
      totalLiabilities: 26606000000,
      shareholderEquity: 39122000000,
      operatingCashFlow: 14999000000,
      freeCashFlow: 14500000000,
    },
    
    annualFinancials: {
      period: "2024",
      reportType: "10-K",
      revenues: 60922000000, // $60.9B
      netIncome: 29760000000, // $29.8B
      eps: 11.93,
      totalAssets: 65728000000,
      totalLiabilities: 26606000000,
      shareholderEquity: 39122000000,
      operatingCashFlow: 28090000000,
      freeCashFlow: 27000000000,
      researchDevelopment: 8675000000,
    },
    
    metrics: {
      peRatio: 40.3,
      pbRatio: 30.7,
      dividendYield: 0.03,
      profitMargin: 48.9,
      roe: 76.1,
      debtToEquity: 0.26,
      currentRatio: 3.42,
    }
  },

  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    ceo: "Satya Nadella",
    sector: "Technology",
    industry: "Software",
    marketCap: 2900000000000, // $2.9T
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
    
    latestFinancials: {
      period: "2024-Q2",
      reportType: "10-Q",
      revenues: 62020000000, // $62.0B
      netIncome: 21870000000, // $21.9B
      eps: 2.93,
      totalAssets: 512163000000,
      totalLiabilities: 238268000000,
      shareholderEquity: 273895000000,
      operatingCashFlow: 34317000000,
      freeCashFlow: 27000000000,
    },
    
    annualFinancials: {
      period: "2024",
      reportType: "10-K",
      revenues: 245122000000, // $245.1B
      netIncome: 88136000000, // $88.1B
      eps: 11.80,
      totalAssets: 512163000000,
      totalLiabilities: 238268000000,
      shareholderEquity: 273895000000,
      operatingCashFlow: 118548000000,
      freeCashFlow: 74000000000,
      researchDevelopment: 27195000000,
    },
    
    metrics: {
      peRatio: 32.9,
      pbRatio: 10.6,
      dividendYield: 0.75,
      profitMargin: 35.9,
      roe: 32.2,
      debtToEquity: 0.35,
      currentRatio: 1.28,
    }
  },

  // Add more stocks as needed
  GOOGL: {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    ceo: "Sundar Pichai",
    sector: "Communication Services",
    industry: "Internet Content & Information",
    marketCap: 1700000000000,
    description: "Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
    
    latestFinancials: {
      period: "2023-Q4",
      reportType: "10-Q",
      revenues: 86310000000,
      netIncome: 20687000000,
      eps: 1.64,
      totalAssets: 402392000000,
      totalLiabilities: 120016000000,
      shareholderEquity: 282376000000,
      operatingCashFlow: 30689000000,
      freeCashFlow: 23000000000,
    },
    
    annualFinancials: {
      period: "2023",
      reportType: "10-K",
      revenues: 307394000000,
      netIncome: 73795000000,
      eps: 5.80,
      totalAssets: 402392000000,
      totalLiabilities: 120016000000,
      shareholderEquity: 282376000000,
      operatingCashFlow: 101736000000,
      freeCashFlow: 69495000000,
      researchDevelopment: 45427000000,
    },
    
    metrics: {
      peRatio: 23.0,
      pbRatio: 6.0,
      dividendYield: 0.0,
      profitMargin: 24.0,
      roe: 26.1,
      debtToEquity: 0.11,
      currentRatio: 2.78,
    }
  },

  AMZN: {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    ceo: "Andy Jassy",
    sector: "Consumer Discretionary",
    industry: "Internet & Direct Marketing Retail",
    marketCap: 1500000000000,
    description: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.",
    
    latestFinancials: {
      period: "2023-Q4",
      reportType: "10-Q",
      revenues: 169961000000,
      netIncome: 10624000000,
      eps: 1.00,
      totalAssets: 527854000000,
      totalLiabilities: 356304000000,
      shareholderEquity: 171550000000,
      operatingCashFlow: 21391000000,
      freeCashFlow: 12000000000,
    },
    
    annualFinancials: {
      period: "2023",
      reportType: "10-K",
      revenues: 574785000000,
      netIncome: 30425000000,
      eps: 2.90,
      totalAssets: 527854000000,
      totalLiabilities: 356304000000,
      shareholderEquity: 171550000000,
      operatingCashFlow: 84946000000,
      freeCashFlow: 35574000000,
      researchDevelopment: 85000000000,
    },
    
    metrics: {
      peRatio: 49.3,
      pbRatio: 8.7,
      dividendYield: 0.0,
      profitMargin: 5.3,
      roe: 17.7,
      debtToEquity: 0.54,
      currentRatio: 1.09,
    }
  }
};

/**
 * Mock real-time price data
 * Simulates live price updates
 */
export const mockPrices = {
  AAPL: { price: 185.50, change: 2.35, changePercent: 1.28 },
  TSLA: { price: 248.75, change: -3.20, changePercent: -1.27 },
  NVDA: { price: 495.30, change: 8.45, changePercent: 1.74 },
  MSFT: { price: 378.90, change: 1.85, changePercent: 0.49 },
  GOOGL: { price: 142.65, change: -0.85, changePercent: -0.59 },
  AMZN: { price: 155.20, change: 2.10, changePercent: 1.37 },
};

/**
 * Get mock financial data for a ticker
 */
export function getMockFinancials(ticker) {
  const upperTicker = ticker.toUpperCase();
  return mockFinancials[upperTicker] || null;
}

/**
 * Get mock price data for a ticker
 */
export function getMockPrice(ticker) {
  const upperTicker = ticker.toUpperCase();
  return mockPrices[upperTicker] || null;
}

/**
 * Simulate price fluctuation for WebSocket mock
 */
export function simulatePriceUpdate(ticker) {
  const upperTicker = ticker.toUpperCase();
  const currentPrice = mockPrices[upperTicker];
  
  if (!currentPrice) return null;
  
  // Random fluctuation between -0.5% and +0.5%
  const fluctuation = (Math.random() - 0.5) * 0.01;
  const newPrice = currentPrice.price * (1 + fluctuation);
  const change = newPrice - currentPrice.price;
  const changePercent = (change / currentPrice.price) * 100;
  
  return {
    ticker: upperTicker,
    price: parseFloat(newPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    timestamp: new Date().toISOString()
  };
}
