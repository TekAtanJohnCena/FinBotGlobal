import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/structuredResponse.css'; // Yeni stilleri import ediyoruz

/**
 * FinBot Structured Response Renderer
 * Uses React Markdown to render rich text, financial tables, and code chips.
 */
export default function StructuredResponse({ text }) {
  if (!text) return null;

  return (
    <div className="structured-response">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Linkleri yeni sekmede aç
          a: ({ node, children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#34D399' }}>{children}</a>
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
