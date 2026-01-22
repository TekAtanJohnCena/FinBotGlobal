import React, { useMemo } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import {
  SparklesIcon as SparklesIconOutline,
} from '@heroicons/react/24/outline';

/**
 * Parses data that might be a string or object
 */
function parseAnalysisData(data) {
  if (!data) return null;
  
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse analysis data:', e);
      return null;
    }
  }
  
  return data;
}

/**
 * Get score color based on value (0-10)
 */
function getScoreColor(score) {
  if (score >= 7) return 'text-emerald-400'; // Green for good
  if (score >= 4) return 'text-amber-400'; // Yellow for neutral
  return 'text-rose-400'; // Red for bad
}

/**
 * Get score background color
 */
function getScoreBgColor(score) {
  if (score >= 7) return 'bg-emerald-500/20 border-emerald-500/30';
  if (score >= 4) return 'bg-amber-500/20 border-amber-500/30';
  return 'bg-rose-500/20 border-rose-500/30';
}

/**
 * Get sentiment icon and color
 */
function getSentimentIcon(sentiment) {
  switch (sentiment) {
    case 'positive':
      return {
        icon: CheckCircleIcon,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      };
    case 'negative':
      return {
        icon: XCircleIcon,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
      };
    default:
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
      };
  }
}

/**
 * Calculate score percentage for circular progress
 */
function getScorePercentage(score) {
  return (score / 10) * 100;
}

export default function FinbotAnalysisCard({ data, loading = false }) {
  const parsedData = useMemo(() => parseAnalysisData(data), [data]);

  // Skeleton Loader - Kap.jsx stiline uygun
  if (loading || !parsedData) {
    return (
      <div className="bg-[#1e1e2d] border border-gray-800 rounded-2xl p-6 shadow-xl animate-pulse">
        {/* Header Skeleton - Başlık ve Skor */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Icon Box */}
            <div className="w-14 h-14 bg-gray-800 rounded-xl border border-gray-700" />
            {/* Title & Label */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-800 rounded w-32" />
              <div className="h-4 bg-gray-800 rounded w-24" />
            </div>
          </div>
          {/* Circular Score Skeleton */}
          <div className="w-20 h-20 bg-gray-800 rounded-full border border-gray-700" />
        </div>

        {/* AI Summary Skeleton */}
        <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-800 rounded w-5/6" />
            <div className="h-4 bg-gray-800 rounded w-4/6" />
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded w-20 mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/30 border border-gray-800">
              {/* Icon Skeleton */}
              <div className="w-9 h-9 bg-gray-800 rounded-lg" />
              {/* Content Skeleton */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 bg-gray-800 rounded w-24" />
                  <div className="h-4 bg-gray-800 rounded w-20" />
                </div>
                <div className="h-3 bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { score, scoreLabel, aiSummary, metrics } = parsedData;
  const scoreColor = getScoreColor(score);
  const scoreBgColor = getScoreBgColor(score);
  const scorePercentage = getScorePercentage(score);

  return (
    <div className="bg-[#1e1e2d] border border-gray-800 rounded-2xl p-6 shadow-xl">
      {/* Header with Score */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${scoreBgColor} border`}>
            <SparklesIconOutline className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">FinBot Analizi</h3>
            <p className="text-gray-400 text-sm">{scoreLabel || 'Değerlendirme'}</p>
          </div>
        </div>

        {/* Circular Score Indicator */}
        <div className="relative">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#374151"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${scorePercentage}, 100`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {score.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-gray-300 text-sm leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Metrics */}
      {metrics && metrics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm mb-3">Metrikler</h4>
          {metrics.map((metric, index) => {
            const sentimentData = getSentimentIcon(metric.sentiment);
            const Icon = sentimentData.icon;

            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/30 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className={`p-2 rounded-lg ${sentimentData.bgColor}`}>
                  <Icon className={`w-5 h-5 ${sentimentData.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h5 className="text-white font-medium text-sm">{metric.title}</h5>
                    <span className={`text-xs font-semibold ${sentimentData.color} whitespace-nowrap`}>
                      {metric.value}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">{metric.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {(!metrics || metrics.length === 0) && !aiSummary && (
        <div className="text-center py-8">
          <SparklesIconOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Analiz verisi bulunamadı</p>
        </div>
      )}
    </div>
  );
}

