import React from 'react';

/**
 * Parses structured FinBot response into sections
 */
export function parseStructuredResponse(text) {
  if (!text) return [];

  // Section markers with emojis and titles
  const sections = [
    {
      id: 'executive_summary',
      pattern: /={2,}\s*💡\s*(?:FinBot\s+)?Yönetici\s+Özeti\s*={2,}|💡\s*(?:FinBot\s+)?Yönetici\s+Özeti:?/i,
      icon: '💡',
      title: 'FinBot Yönetici Özeti'
    },
    {
      id: 'portfolio_status',
      pattern: /={2,}\s*📊\s*Portföy\s+Durumu\s*={2,}|📊\s*Portföy\s+Durumu:?/i,
      icon: '📊',
      title: 'Portföy Durumu'
    },
    {
      id: 'critical_indicators',
      pattern: /={2,}\s*🔍\s*Kritik\s+Temel\s+Göstergeler\s*={2,}|🔍\s*Kritik\s+Temel\s+Göstergeler:?/i,
      icon: '🔍',
      title: 'Kritik Temel Göstergeler'
    },
    {
      id: 'comparative_analysis',
      pattern: /={2,}\s*📊\s*Karşılaştırmalı\s+Analiz(?:\s+Tablosu)?\s*={2,}|📈\s*Karşılaştırmalı\s+Analiz:?/i,
      icon: '📈',
      title: 'Karşılaştırmalı Analiz'
    },
    {
      id: 'financial_synthesis',
      pattern: /={2,}\s*🔍\s*Finansal\s+Sentez\s*={2,}/i,
      icon: '🔬',
      title: 'Finansal Sentez'
    },
    {
      id: 'long_term_view',
      pattern: /={2,}\s*🔮\s*Uzun\s+Vadeli\s+Görünüm\s*={2,}|🔮\s*Uzun\s+Vadeli\s+Görünüm:?/i,
      icon: '🔮',
      title: 'Uzun Vadeli Görünüm'
    },
    {
      id: 'conclusion',
      pattern: /={2,}\s*✅\s*Sonuç(?:\s*&\s*FinBot\s+Puanı)?\s*={2,}|✅\s*Sonuç(?:\s*&\s*FinBot\s+Puanı)?:?/i,
      icon: '✅',
      title: 'Sonuç & FinBot Puanı'
    },
    {
      id: 'proactive_question',
      pattern: /={2,}\s*❓\s*Proaktif\s+Soru\s*={2,}|❓\s*Proaktif\s+Soru:?/i,
      icon: '❓',
      title: 'Proaktif Soru'
    }
  ];

  const parsed = [];

  // Find all section positions
  const sectionPositions = [];
  sections.forEach(section => {
    // Collect all matches for this pattern
    const matches = text.matchAll(new RegExp(section.pattern, 'gi'));
    for (const match of matches) {
      sectionPositions.push({
        section,
        index: match.index,
        endIndex: match.index + match[0].length
      });
    }
  });

  // Sort by position
  sectionPositions.sort((a, b) => a.index - b.index);

  // Extract content for each section
  sectionPositions.forEach((pos, idx) => {
    const startIdx = pos.endIndex;
    const endIdx = idx < sectionPositions.length - 1
      ? sectionPositions[idx + 1].index
      : text.length;

    const content = text.substring(startIdx, endIdx).trim();

    if (content) {
      // Clean up section markers and separators
      const cleanContent = content
        .replace(/^===+/gm, '')
        .replace(/^[-*•]\s*/gm, '')
        .trim();

      parsed.push({
        id: pos.section.id,
        icon: pos.section.icon,
        title: pos.section.title,
        content: cleanContent
      });
    }
  });

  // If no structured sections found, return original text as single item
  if (parsed.length === 0) {
    return [{
      id: 'plain_text',
      icon: '📝',
      title: null,
      content: text
    }];
  }

  return parsed;
}

/**
 * Renders structured response as cards
 */
export default function StructuredResponse({ text }) {
  const sections = parseStructuredResponse(text);

  if (!sections || sections.length === 0) {
    return <div className="text-zinc-200 whitespace-pre-line">{text}</div>;
  }

  return (
    <div className="structured-response">
      {sections.map((section, idx) => (
        <div
          key={`${section.id}-${idx}`}
          className="response-card mb-4 last:mb-0"
        >
          {section.title && (
            <div className="response-card-header">
              <span className="response-card-icon">{section.icon}</span>
              <h3 className="response-card-title">{section.title}</h3>
            </div>
          )}
          <div className="response-card-content">
            <div className="text-zinc-200 whitespace-pre-line leading-relaxed">
              {section.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
