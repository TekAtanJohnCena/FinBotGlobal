// PATH: backend/src/data/mockScreeningData.js
// Mock data for stock screening - US Market Edition

export const MOCK_DATA_TIMESTAMP = new Date().toISOString();

export const MOCK_DIVIDEND_STOCKS = [
    {
        ticker: 'KO',
        company: 'Coca-Cola Company',
        sector: 'Consumer Defensive',
        composite_score: 82,
        metrics: {
            div_yield: 3.1,
            fk: 24.5,
            roe: 42.0,
            stability_rating: 'Very High'
        },
        sector_comparison: {
            div_yield_percentile: 85,
            fk_percentile: 60
        },
        highlights: [
            'Dividend King (>50 years of growth)',
            'Strong global brand power',
            'Consistent cash flow'
        ]
    },
    {
        ticker: 'JPM',
        company: 'JPMorgan Chase & Co.',
        sector: 'Financial Services',
        composite_score: 85,
        metrics: {
            div_yield: 2.4,
            fk: 11.2,
            roe: 17.0,
            stability_rating: 'High'
        },
        sector_comparison: {
            div_yield_percentile: 75,
            fk_percentile: 40
        },
        highlights: [
            'Strong balance sheet',
            'Market leader in banking',
            'Solid capital return program'
        ]
    },
    {
        ticker: 'CVX',
        company: 'Chevron Corporation',
        sector: 'Energy',
        composite_score: 75,
        metrics: {
            div_yield: 4.1,
            fk: 14.5,
            roe: 13.5,
            stability_rating: 'High'
        },
        sector_comparison: {
            div_yield_percentile: 90,
            fk_percentile: 45
        },
        highlights: [
            'High dividend yield',
            'Strong energy sector presence',
            'Efficient capital allocation'
        ]
    }
];

export const MOCK_AGGRESSIVE_STOCKS = [
    {
        ticker: 'NVDA',
        company: 'NVIDIA Corporation',
        sector: 'Technology',
        composite_score: 94,
        metrics: {
            growth_qoq: 260,
            fk: 65.0,
            roe: 55.0,
            volatility: 'High'
        },
        sector_comparison: {
            growth_percentile: 99,
            fk_percentile: 90,
            roe_percentile: 95
        },
        highlights: [
            'Leading the AI revolution',
            'Massive revenue growth',
            'Dominant data center market share',
            'High valuation but high growth'
        ],
        risk_note: 'High volatility, valuation concerns'
    },
    {
        ticker: 'TSLA',
        company: 'Tesla Inc.',
        sector: 'Auto Manufacturers',
        composite_score: 88,
        metrics: {
            growth_qoq: 15,
            fk: 70.0,
            roe: 25.0,
            volatility: 'Very High'
        },
        sector_comparison: {
            growth_percentile: 90,
            fk_percentile: 95,
            roe_percentile: 88
        },
        highlights: [
            'EV market leader',
            'Innovation in FSD and energy',
            'Strong brand loyalty'
        ],
        risk_note: 'Subject to CEO news cycle'
    },
    {
        ticker: 'AMD',
        company: 'Advanced Micro Devices',
        sector: 'Technology',
        composite_score: 81,
        metrics: {
            growth_qoq: 45,
            fk: 95.0,
            roe: 6.0,
            volatility: 'High'
        },
        sector_comparison: {
            growth_percentile: 92,
            fk_percentile: 98,
            roe_percentile: 60
        },
        highlights: [
            'Strong CPU/GPU product line',
            'Gaining market share in data center',
            'AI chip expansion'
        ],
        risk_note: 'Intense competition with NVDA/INTC'
    }
];

export const MOCK_DEFENSIVE_STOCKS = [
    {
        ticker: 'WMT',
        company: 'Walmart Inc.',
        sector: 'Consumer Defensive',
        composite_score: 89,
        metrics: {
            beta: 0.50,
            debt_equity: 0.45,
            current_ratio: 0.90,
            roe: 18.0
        },
        sector_comparison: {
            beta_percentile: 20,
            stability_percentile: 95
        },
        highlights: [
            'Recession-resistant business',
            'Massive scale efficiency',
            'Growing e-commerce presence'
        ],
        risk_note: 'Low volatility, steady growth'
    },
    {
        ticker: 'PG',
        company: 'Procter & Gamble',
        sector: 'Consumer Defensive',
        composite_score: 87,
        metrics: {
            beta: 0.45,
            debt_equity: 0.55,
            current_ratio: 0.85,
            roe: 30.0
        },
        sector_comparison: {
            beta_percentile: 15,
            stability_percentile: 98
        },
        highlights: [
            'Portfolio of essential brands',
            'Strong pricing power',
            'Dividend Aristocrat'
        ],
        risk_note: 'Low risk, safe haven stock'
    },
    {
        ticker: 'JNJ',
        company: 'Johnson & Johnson',
        sector: 'Healthcare',
        composite_score: 84,
        metrics: {
            beta: 0.55,
            debt_equity: 0.40,
            current_ratio: 1.10,
            roe: 25.0
        },
        sector_comparison: {
            beta_percentile: 25,
            stability_percentile: 92
        },
        highlights: [
            'Diversified healthcare giant',
            'AAA credit rating',
            'Consistent earnings growth'
        ],
        risk_note: 'Litigation risks occasionally'
    }
];
