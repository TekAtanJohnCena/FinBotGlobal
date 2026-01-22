// PATH: frontend/src/pages/Kap.jsx
/**
 * US Market News Page
 * Displays news with sentiment analysis from Tiingo API
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ClockIcon,
  SparklesIcon,
  NewspaperIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  ArrowTrendingUpIcon as ArrowTrendingUpIconSolid,
  ArrowTrendingDownIcon as ArrowTrendingDownIconSolid,
  MinusCircleIcon as MinusCircleIconSolid
} from '@heroicons/react/24/solid';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Mock news data for now (will be replaced with API call)
const MOCK_NEWS = [
  {
    id: 1,
    title: 'Apple Reports Record Q4 Revenue Driven by iPhone Sales',
    description: 'Apple Inc. announced record fourth-quarter revenue of $89.5 billion, driven by strong iPhone 15 sales and growing services revenue.',
    source: 'Reuters',
    url: 'https://example.com/apple-q4-2024',
    publishedDate: new Date().toISOString(),
    tickers: ['AAPL'],
    tags: ['earnings', 'technology'],
    sentiment: 'positive'
  },
  {
    id: 2,
    title: 'Tesla Expands Supercharger Network Across Europe',
    description: 'Tesla announced plans to add 5,000 new Supercharger stations across Europe by 2025, accelerating EV infrastructure development.',
    source: 'Bloomberg',
    url: 'https://example.com/tesla-supercharger',
    publishedDate: new Date(Date.now() - 3600000).toISOString(),
    tickers: ['TSLA'],
    tags: ['infrastructure', 'ev'],
    sentiment: 'positive'
  },
  {
    id: 3,
    title: 'NVIDIA AI Chips See Unprecedented Demand from Cloud Providers',
    description: 'NVIDIA reports H100 GPU demand exceeding supply as major cloud providers race to build AI infrastructure.',
    source: 'CNBC',
    url: 'https://example.com/nvidia-ai-demand',
    publishedDate: new Date(Date.now() - 7200000).toISOString(),
    tickers: ['NVDA'],
    tags: ['ai', 'semiconductors'],
    sentiment: 'positive'
  },
  {
    id: 4,
    title: 'Microsoft Azure Revenue Surges 29% on AI Services',
    description: 'Microsoft cloud division reports strong growth as enterprise customers adopt Azure OpenAI services.',
    source: 'Wall Street Journal',
    url: 'https://example.com/msft-azure',
    publishedDate: new Date(Date.now() - 10800000).toISOString(),
    tickers: ['MSFT'],
    tags: ['cloud', 'ai'],
    sentiment: 'positive'
  },
  {
    id: 5,
    title: 'Fed Signals Potential Rate Cuts in 2024',
    description: 'Federal Reserve officials indicate openness to interest rate cuts if inflation continues to moderate.',
    source: 'Financial Times',
    url: 'https://example.com/fed-rates',
    publishedDate: new Date(Date.now() - 14400000).toISOString(),
    tickers: ['SPY', 'QQQ'],
    tags: ['fed', 'rates', 'macro'],
    sentiment: 'neutral'
  },
  {
    id: 6,
    title: 'Amazon Faces FTC Antitrust Lawsuit',
    description: 'The Federal Trade Commission files a major antitrust lawsuit against Amazon, challenging its marketplace practices.',
    source: 'New York Times',
    url: 'https://example.com/amazon-ftc',
    publishedDate: new Date(Date.now() - 18000000).toISOString(),
    tickers: ['AMZN'],
    tags: ['legal', 'regulation'],
    sentiment: 'negative'
  }
];

// Sentiment Badge Component
const SentimentBadge = ({ sentiment }) => {
  const styles = {
    positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    negative: "bg-red-500/10 text-red-400 border-red-500/20",
    neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
  };

  const icons = {
    positive: ArrowTrendingUpIconSolid,
    negative: ArrowTrendingDownIconSolid,
    neutral: MinusCircleIconSolid
  };

  const labels = {
    positive: "BULLISH",
    negative: "BEARISH",
    neutral: "NEUTRAL"
  };

  const Icon = icons[sentiment] || icons.neutral;

  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${styles[sentiment] || styles.neutral} tracking-wider`}>
      <Icon className="w-3.5 h-3.5" />
      {labels[sentiment] || "NEUTRAL"}
    </span>
  );
};

// Filter Tab Component
const FilterTab = ({ label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] ${active
      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
      : "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
      }`}
  >
    {label}
    {count > 0 && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-black/20 text-emerald-100' : 'bg-zinc-700 text-zinc-400'}`}>
        {count}
      </span>
    )}
  </button>
);

// News Card Component
const NewsCard = ({ article, onClick }) => {
  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div
      onClick={onClick}
      className="group p-4 md:p-5 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-emerald-500/30 rounded-xl cursor-pointer transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <SentimentBadge sentiment={article.sentiment} />
          <span className="text-xs text-zinc-500">{article.source}</span>
        </div>
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" />
          {timeAgo(article.publishedDate)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-sm md:text-base mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
        {article.title}
      </h3>

      {/* Description */}
      <p className="text-zinc-400 text-xs md:text-sm line-clamp-2 mb-3">
        {article.description}
      </p>

      {/* Tickers & Tags */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {article.tickers?.slice(0, 3).map(ticker => (
            <span
              key={ticker}
              className="text-[10px] md:text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded"
            >
              ${ticker}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {article.tags?.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function MarketNews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [newsList, setNewsList] = useState(MOCK_NEWS);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Filter options
  const filters = [
    { label: "All", value: "all" },
    { label: "Bullish", value: "positive" },
    { label: "Bearish", value: "negative" },
    { label: "Neutral", value: "neutral" }
  ];

  // Filtered news
  const filteredNews = useMemo(() => {
    let result = newsList;

    // Filter by sentiment
    if (activeFilter !== "All") {
      const sentimentMap = { "Bullish": "positive", "Bearish": "negative", "Neutral": "neutral" };
      result = result.filter(n => n.sentiment === sentimentMap[activeFilter]);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.description.toLowerCase().includes(term) ||
        n.tickers?.some(t => t.toLowerCase().includes(term))
      );
    }

    return result;
  }, [newsList, activeFilter, searchTerm]);

  // Sentiment counts
  const sentimentCounts = useMemo(() => ({
    all: newsList.length,
    positive: newsList.filter(n => n.sentiment === 'positive').length,
    negative: newsList.filter(n => n.sentiment === 'negative').length,
    neutral: newsList.filter(n => n.sentiment === 'neutral').length
  }), [newsList]);

  const refreshNews = async () => {
    setLoading(true);
    // In future, this will call the actual API
    setTimeout(() => {
      setNewsList([...MOCK_NEWS]);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-zinc-800 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                <NewspaperIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Market News</h1>
                <p className="text-xs text-zinc-500">Real-time US market news with AI sentiment</p>
              </div>
            </div>
            <button
              onClick={refreshNews}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search news, tickers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <FunnelIcon className="w-4 h-4 text-zinc-500 shrink-0" />
            {filters.map(filter => (
              <FilterTab
                key={filter.label}
                label={filter.label}
                count={sentimentCounts[filter.value]}
                active={activeFilter === filter.label}
                onClick={() => setActiveFilter(filter.label)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-20">
            <NewspaperIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No news found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.map(article => (
              <NewsCard
                key={article.id}
                article={article}
                onClick={() => window.open(article.url, '_blank')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-sm border-t border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-zinc-400">Bullish: {sentimentCounts.positive}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-zinc-400">Bearish: {sentimentCounts.negative}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
            <span className="text-zinc-400">Neutral: {sentimentCounts.neutral}</span>
          </div>
        </div>
      </div>
    </div>
  );
}