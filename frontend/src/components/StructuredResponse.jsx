import React, { memo, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/structuredResponse.css";

const MARKDOWN_COMPONENTS = {
  a: ({ node, children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: "#34D399" }}>
      {children}
    </a>
  ),
  table: ({ node, className, ...props }) => (
    <div className="table-wrapper finbot-table-wrapper" data-table-scope="analysis">
      <table
        {...props}
        className={className ? `${className} finbot-md-table` : "finbot-md-table"}
      />
    </div>
  ),
};

function getTypingProfile(totalLength) {
  if (totalLength > 8000) return { delayMs: 4, charsPerTick: 20 };
  if (totalLength > 4000) return { delayMs: 6, charsPerTick: 12 };
  if (totalLength > 2000) return { delayMs: 8, charsPerTick: 8 };
  if (totalLength > 800) return { delayMs: 10, charsPerTick: 4 };
  return { delayMs: 14, charsPerTick: 1 };
}

function StructuredResponse({
  text,
  enableTypewriter = false,
  onTypingProgress,
}) {
  const safeText = text || "";
  const [displayText, setDisplayText] = useState(safeText);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!enableTypewriter) {
      setShowAll(false);
      setDisplayText(safeText);
      return;
    }

    setDisplayText((prev) => {
      if (!safeText.startsWith(prev)) {
        setShowAll(false);
        return "";
      }
      return prev;
    });
  }, [safeText, enableTypewriter]);

  useEffect(() => {
    if (!enableTypewriter) return;
    if (showAll) {
      setDisplayText(safeText);
      return;
    }
    if (displayText.length >= safeText.length) return;

    const { delayMs, charsPerTick } = getTypingProfile(safeText.length);
    const timer = setInterval(() => {
      setDisplayText((prev) => {
        if (prev.length >= safeText.length) return prev;
        const nextLength = Math.min(safeText.length, prev.length + charsPerTick);
        return safeText.slice(0, nextLength);
      });
    }, delayMs);

    return () => clearInterval(timer);
  }, [safeText, displayText.length, enableTypewriter, showAll]);

  useEffect(() => {
    if (onTypingProgress && enableTypewriter) {
      onTypingProgress();
    }
  }, [displayText, enableTypewriter, onTypingProgress]);

  const visibleText = enableTypewriter ? displayText : safeText;
  const isTyping = enableTypewriter && visibleText.length < safeText.length && !showAll;
  const markdownBody = useMemo(() => visibleText, [visibleText]);

  if (!safeText) return null;

  return (
    <div className="structured-response">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {markdownBody}
      </ReactMarkdown>

      {isTyping && (
        <button
          type="button"
          onClick={() => {
            setShowAll(true);
            setDisplayText(safeText);
          }}
          className="mt-3 rounded-lg border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
        >
          Hepsini Goster
        </button>
      )}
    </div>
  );
}

export default memo(StructuredResponse);
