import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const ThinkingAccordion = ({ thoughtText, isThinking, isFinished }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Auto-collapse when thinking is done and text generation starts
    useEffect(() => {
        if (isFinished && !isThinking) {
            setIsOpen(false);
        }
    }, [isFinished, isThinking]);

    if (!thoughtText) return null;

    return (
        <div className="mb-4 max-w-[85%] md:max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
                className={`
          rounded-xl border transition-all duration-300 overflow-hidden
          ${isThinking
                        ? 'bg-zinc-800/50 border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]'
                        : 'bg-zinc-900/30 border-zinc-700/50'
                    }
        `}
            >
                {/* Header / Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isThinking ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
                            <LightBulbIcon className={`w-4 h-4 ${isThinking ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className={`text-sm font-medium ${isThinking ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            {isThinking ? "FinBot Düşünüyor..." : "Düşünme Süreci"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isThinking && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        )}
                        {isOpen ? (
                            <ChevronUpIcon className="w-4 h-4 text-zinc-500" />
                        ) : (
                            <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
                        )}
                    </div>
                </button>

                {/* Content */}
                <div
                    className={`
            transition-[max-height,opacity] duration-300 ease-in-out
            ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
            overflow-y-auto slim-scrollbar
          `}
                >
                    <div className="px-4 pb-4 pt-1">
                        <div className="text-xs text-zinc-400 font-mono space-y-1 pl-1 border-l-2 border-zinc-700/50 ml-1">
                            {thoughtText.split('\n').filter(line => line.trim()).map((line, i) => (
                                <div key={i} className="pl-3 py-0.5 animate-in fade-in slide-in-from-left-1 duration-300">
                                    {line}
                                </div>
                            ))}
                            {isThinking && (
                                <div className="pl-3 py-0.5 animate-pulse text-emerald-500/70">▋</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThinkingAccordion;
