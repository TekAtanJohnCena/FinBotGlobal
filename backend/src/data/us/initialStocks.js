// PATH: backend/src/data/us/initialStocks.js

export const INITIAL_US_STOCKS = [
    // MAG 7 & Tech Titans
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", assetType: "Stock" },
    { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", sector: "Technology", assetType: "Stock" },
    { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", sector: "Technology", assetType: "Stock" },
    { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", sector: "Communication Services", assetType: "Stock" },
    { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", assetType: "Stock" },
    { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", sector: "Communication Services", assetType: "Stock" },
    { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", assetType: "Stock" },
    { symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ", sector: "Technology", assetType: "Stock" },
    { symbol: "AMD", name: "Advanced Micro Devices", exchange: "NASDAQ", sector: "Technology", assetType: "Stock" },
    { symbol: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ", sector: "Technology", assetType: "Stock" },
    { symbol: "CRM", name: "Salesforce Inc.", exchange: "NYSE", sector: "Technology", assetType: "Stock" },
    { symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE", sector: "Technology", assetType: "Stock" },
    { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ", sector: "Technology", assetType: "Stock" },
    { symbol: "CSCO", name: "Cisco Systems", exchange: "NASDAQ", sector: "Technology", assetType: "Stock" },
    { symbol: "NFLX", name: "Netflix Inc.", exchange: "NASDAQ", sector: "Communication Services", assetType: "Stock" },

    // Financials
    { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "BAC", name: "Bank of America Corp", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "WFC", name: "Wells Fargo & Co", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "V", name: "Visa Inc.", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "MA", name: "Mastercard Inc.", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "AXP", name: "American Express", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "GS", name: "Goldman Sachs Group", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "MS", name: "Morgan Stanley", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "BLK", name: "BlackRock Inc.", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },
    { symbol: "C", name: "Citigroup Inc.", exchange: "NYSE", sector: "Financial Services", assetType: "Stock" },

    // Retail & Consumer
    { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE", sector: "Consumer Defensive", assetType: "Stock" },
    { symbol: "COST", name: "Costco Wholesale", exchange: "NASDAQ", sector: "Consumer Defensive", assetType: "Stock" },
    { symbol: "PG", name: "Procter & Gamble", exchange: "NYSE", sector: "Consumer Defensive", assetType: "Stock" },
    { symbol: "KO", name: "Coca-Cola Company", exchange: "NYSE", sector: "Consumer Defensive", assetType: "Stock" },
    { symbol: "PEP", name: "PepsiCo Inc.", exchange: "NASDAQ", sector: "Consumer Defensive", assetType: "Stock" },
    { symbol: "MCD", name: "McDonald's Corp", exchange: "NYSE", sector: "Consumer Cyclical", assetType: "Stock" },
    { symbol: "NKE", name: "Nike Inc.", exchange: "NYSE", sector: "Consumer Cyclical", assetType: "Stock" },
    { symbol: "SBUX", name: "Starbucks Corp", exchange: "NASDAQ", sector: "Consumer Cyclical", assetType: "Stock" },
    { symbol: "HD", name: "Home Depot Inc.", exchange: "NYSE", sector: "Consumer Cyclical", assetType: "Stock" },
    { symbol: "DIS", name: "Walt Disney Company", exchange: "NYSE", sector: "Communication Services", assetType: "Stock" },

    // Healthcare
    { symbol: "LLY", name: "Eli Lilly and Co", exchange: "NYSE", sector: "Healthcare", assetType: "Stock" },
    { symbol: "UNH", name: "UnitedHealth Group", exchange: "NYSE", sector: "Healthcare", assetType: "Stock" },
    { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", sector: "Healthcare", assetType: "Stock" },
    { symbol: "MRK", name: "Merck & Co Inc.", exchange: "NYSE", sector: "Healthcare", assetType: "Stock" },
    { symbol: "ABBV", name: "AbbVie Inc.", exchange: "NYSE", sector: "Healthcare", assetType: "Stock" },
    { symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE", sector: "Healthcare", assetType: "Stock" },
    { symbol: "TMO", name: "Thermo Fisher Scientific", exchange: "NYSE", sector: "Healthcare", assetType: "Stock" },
    { symbol: "DHR", name: "Danaher Corp", exchange: "NYSE", sector: "Healthcare", assetType: "Stock" },
    { symbol: "ISRG", name: "Intuitive Surgical", exchange: "NASDAQ", sector: "Healthcare", assetType: "Stock" },

    // Industrial / Energy / Others
    { symbol: "XOM", name: "Exxon Mobil Corp", exchange: "NYSE", sector: "Energy", assetType: "Stock" },
    { symbol: "CVX", name: "Chevron Corp", exchange: "NYSE", sector: "Energy", assetType: "Stock" },
    { symbol: "GE", name: "General Electric", exchange: "NYSE", sector: "Industrials", assetType: "Stock" },
    { symbol: "CAT", name: "Caterpillar Inc.", exchange: "NYSE", sector: "Industrials", assetType: "Stock" },
    { symbol: "BA", name: "Boeing Company", exchange: "NYSE", sector: "Industrials", assetType: "Stock" },
    { symbol: "LMT", name: "Lockheed Martin", exchange: "NYSE", sector: "Industrials", assetType: "Stock" },
    { symbol: "RTX", name: "Raytheon Technologies", exchange: "NYSE", sector: "Industrials", assetType: "Stock" },
    { symbol: "HON", name: "Honeywell Intl", exchange: "NASDAQ", sector: "Industrials", assetType: "Stock" },
    { symbol: "UNP", name: "Union Pacific Corp", exchange: "NYSE", sector: "Industrials", assetType: "Stock" },
    { symbol: "UPS", name: "United Parcel Service", exchange: "NYSE", sector: "Industrials", assetType: "Stock" },

    // Crypto (Keep as requested "except Crypto")
    { symbol: "BTC-USD", name: "Bitcoin USD", exchange: "CRYPTO", sector: "Cryptocurrency", assetType: "Crypto" },
    { symbol: "ETH-USD", name: "Ethereum USD", exchange: "CRYPTO", sector: "Cryptocurrency", assetType: "Crypto" }
];
