import React, { useState } from 'react';
import {
    Calendar as CalendarIcon,
    DollarSign,
    PieChart,
    ArrowRight,
    Clock,
    ChevronRight,
    TrendingUp,
    Briefcase
} from 'lucide-react';

const Calendar = () => {
    const [filter, setFilter] = useState("This Week");

    const MOCK_EVENTS = [
        {
            id: 1,
            symbol: "NVDA",
            name: "NVIDIA Corp.",
            date: "Feb 25, 2026",
            type: "Earnings",
            timing: "After Market",
            expectation: "EPS: $4.59",
            impact: "High",
            week: "This Week"
        },
        {
            id: 2,
            symbol: "AAPL",
            name: "Apple Inc.",
            date: "Feb 12, 2026",
            type: "Dividend",
            expectation: "Amount: $0.24",
            impact: "Medium",
            week: "This Week"
        },
        {
            id: 3,
            symbol: "TSLA",
            name: "Tesla, Inc.",
            date: "Mar 02, 2026",
            type: "Earnings",
            timing: "After Market",
            expectation: "EPS: $0.78",
            impact: "High",
            week: "Next Week"
        },
        {
            id: 4,
            symbol: "KO",
            name: "Coca-Cola Co.",
            date: "Mar 15, 2026",
            type: "Dividend",
            expectation: "Amount: $0.48",
            impact: "Low",
            week: "Next Week"
        },
        {
            id: 5,
            symbol: "MSFT",
            name: "Microsoft",
            date: "Feb 20, 2026",
            type: "Split",
            expectation: "Ratio: 2-for-1",
            impact: "High",
            week: "Next Week"
        }
    ];

    const filteredEvents = MOCK_EVENTS.filter(e => e.week === filter);

    const getEventIcon = (type) => {
        switch (type) {
            case 'Earnings': return <PieChart className="text-indigo-400" size={18} />;
            case 'Dividend': return <DollarSign className="text-emerald-400" size={18} />;
            case 'Split': return <TrendingUp className="text-amber-400" size={18} />;
            default: return <CalendarIcon className="text-slate-400" size={18} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon className="text-indigo-500" size={32} />
                            <h1 className="text-3xl font-black tracking-tight">Economic Calendar</h1>
                        </div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Upcoming Market Events & Corporate Actions</p>
                    </div>

                    <div className="flex p-1 bg-[#1e222d] border border-slate-800 rounded-2xl shadow-inner">
                        {["This Week", "Next Week"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${filter === f
                                        ? 'bg-[#0f111a] text-white shadow-lg border border-slate-700/50'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Event List */}
                <div className="space-y-4">
                    {filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            className="bg-[#1e222d] border border-slate-800/60 p-5 rounded-3xl hover:bg-[#252a36] transition-all flex items-center justify-between group cursor-default"
                        >
                            <div className="flex items-center gap-6">
                                {/* Logo Placeholder */}
                                <div className="w-14 h-14 bg-[#0f111a] rounded-2xl flex items-center justify-center border border-slate-800 text-indigo-400 font-black text-xl shadow-inner group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                                    {event.symbol[0]}
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-slate-100">{event.symbol}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${event.impact === 'High' ? 'bg-rose-500/10 text-rose-500' :
                                                event.impact === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {event.impact} Impact
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{event.name}</span>
                                </div>
                            </div>

                            <div className="hidden md:flex flex-col items-center">
                                <span className="text-sm font-black text-slate-300">{event.date}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase mt-1">
                                    <Clock size={12} />
                                    {event.timing || "Date Only"}
                                </div>
                            </div>

                            <div className="flex items-center gap-10">
                                <div className="flex flex-col items-end min-w-[120px]">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getEventIcon(event.type)}
                                        <span className="text-sm font-black text-slate-200">{event.type}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-tight">{event.expectation}</span>
                                </div>
                                <ChevronRight className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                            </div>
                        </div>
                    ))}

                    {filteredEvents.length === 0 && (
                        <div className="py-20 text-center bg-[#1e222d]/50 border border-dashed border-slate-800 rounded-3xl">
                            <Briefcase className="mx-auto text-slate-700 mb-4" size={48} />
                            <h3 className="text-xl font-bold text-slate-400">No scheduled events found</h3>
                            <p className="text-slate-600 text-sm mt-1">Market activities for this period have not been updated yet.</p>
                        </div>
                    )}
                </div>

                {/* Legend / Info */}
                <div className="mt-12 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center md:text-left">
                        Information shown is based on corporate guidance and historical records. Dates are subject to change.
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Major Volatility</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Cash Distribution</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
