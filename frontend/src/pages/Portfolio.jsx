import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from "../lib/api";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Search,
  X,
  RefreshCw,
  PieChart as PieChartIcon,
  Activity,
  DollarSign,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const Portfolio = () => {
  const queryClient = useQueryClient();

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [addQty, setAddQty] = useState("");
  const [addCost, setAddCost] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cash Balance State
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashInput, setCashInput] = useState("");

  // Default Popular Stocks
  const popularStocks = [
    { ticker: 'AAPL', name: 'Apple Inc.', price: 0 },
    { ticker: 'TSLA', name: 'Tesla, Inc.', price: 0 },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 0 },
    { ticker: 'MSFT', name: 'Microsoft', price: 0 },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', price: 0 },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 0 },
    { ticker: 'META', name: 'Meta Platforms', price: 0 },
    { ticker: 'NFLX', name: 'Netflix, Inc.', price: 0 }
  ];

  // --- QUERIES ---

  // 1. Portfolio Data
  const {
    data: portfolioRes,
    isLoading: portfolioLoading,
    refetch: refetchPortfolio
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await api.get('/portfolio');
      return res.data;
    },
    refetchInterval: 60000, // Refresh every 1 min
    staleTime: 30000,
  });

  const portfolioData = portfolioRes?.data || [];
  const totals = portfolioRes?.totals || { totalValue: 0, totalPnl: 0, totalPnlPercent: 0 };
  const loading = portfolioLoading;

  // 2. Popular Stocks Prices
  const { data: popularStocksRes } = useQuery({
    queryKey: ['popularStocks'],
    queryFn: async () => {
      const tickers = popularStocks.map(s => s.ticker).join(",");
      const res = await api.get(`/prices/batch?tickers=${tickers}`);
      return res.data;
    },
    refetchInterval: 60000,
  });

  // Merge popular stocks with prices
  const currentPopularStocks = popularStocks.map(s => ({
    ...s,
    price: popularStocksRes?.data?.[s.ticker] || s.price
  }));

  // 3. Cash Balance
  const { data: cashRes } = useQuery({
    queryKey: ['cashBalance'],
    queryFn: async () => {
      const res = await api.get('/portfolio/cash');
      return res.data;
    }
  });

  const cashBalance = cashRes?.balance || 0;

  // Removed manual useEffects in favor of useQuery

  // handleSearch needs to stay, but useEffects are gone. Re-adding handleSearch.

  const handleSearch = useCallback(async (val) => {
    setSearchTerm(val);
    if (!val || val.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/portfolio/search?query=${val}`);
      if (res.data.ok) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const saveCashBalance = async () => {
    try {
      const res = await api.post('/portfolio/cash', { amount: Number(cashInput) });
      if (res.data.ok) {
        await queryClient.invalidateQueries(['cashBalance']);
        setIsCashModalOpen(false);
        setCashInput("");
      }
    } catch (err) {
      console.error('Cash save error:', err);
    }
  };

  const openAddModal = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const saveAsset = async () => {
    if (!addQty || !addCost) {
      alert('Lütfen adet ve maliyet girin!');
      return;
    }
    if (!selectedStock) {
      alert('Hisse seçilmedi!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        symbol: selectedStock.ticker || selectedStock.symbol,
        name: selectedStock.name || selectedStock.ticker || selectedStock.symbol,
        quantity: Number(addQty),
        avgCost: Number(addCost)
      };
      console.log('📤 Sending to portfolio:', payload);

      const res = await api.post('/portfolio/add', payload);
      console.log('📥 Response:', res.data);

      if (res.data.ok) {
        alert('✅ Hisse başarıyla eklendi!');
        setIsModalOpen(false);
        setAddQty("");
        setAddCost("");
        queryClient.invalidateQueries(['portfolio']);
        queryClient.invalidateQueries(['cashBalance']);
      } else {
        alert('❌ Hata: ' + (res.data.error || 'Bilinmeyen hata'));
      }
    } catch (err) {
      console.error("Save error:", err);
      alert('❌ Hata: ' + (err.response?.data?.error || err.message || 'Bağlantı hatası'));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAsset = async (id) => {
    if (!window.confirm("Bu hisseyi portföyünüzden silmek istediğinize emin misiniz?")) return;
    try {
      const res = await api.delete(`/portfolio/${id}`);
      if (res.data.ok) {
        queryClient.invalidateQueries(['portfolio']);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0a0f1c] text-white overflow-hidden font-sans">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg transition-all"
      >
        {isSidebarOpen ? <X size={20} /> : <Search size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR: DYNAMIC SEARCH */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-80 lg:w-1/4 flex-shrink-0 
        bg-[#1e222d] border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 bg-[#1e222d]/50">
          <h1 className="text-xl font-bold flex items-center gap-2 text-emerald-400 mb-6 uppercase tracking-tighter">
            <Plus className="w-6 h-6" />
            Varlık Yönetimi
          </h1>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Hisse Ara (Nasdaq/Nyse)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-[#2a2e39] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 w-full transition-all text-slate-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#131722]/50">
          {searchLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest leading-loose">Piyasalar Taranıyor...</span>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 ml-2 flex items-center gap-2">
                {searchTerm ? 'Arama Sonuçları' : 'Popüler Hisseler'}
                {!searchTerm && <Activity size={12} className="text-emerald-500" />}
              </h3>

              {(searchTerm ? searchResults : currentPopularStocks).map(s => (
                <div
                  key={s.ticker || s.symbol}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-emerald-500/5 transition-all group border border-transparent hover:border-emerald-500/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between pr-4">
                      <div className="font-mono font-black text-sm text-white group-hover:text-emerald-400 transition-colors uppercase">{s.ticker || s.symbol}</div>
                      {s.price > 0 && (
                        <div className="font-mono font-black text-lg text-emerald-500 ml-auto mr-2">${s.price.toFixed(2)}</div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1 font-bold">{s.name}</div>
                  </div>
                  <button
                    onClick={() => {
                      openAddModal(s);
                      setIsSidebarOpen(false);
                    }}
                    className="w-10 h-10 flex-shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/0 hover:shadow-emerald-500/20 ml-2"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}

              {searchTerm && searchResults.length === 0 && (
                <div className="p-6 text-center">
                  <AlertCircle className="mx-auto mb-2 opacity-20 text-slate-500" size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Eşleşme Bulunamadı</p>
                  <button
                    onClick={() => {
                      openAddModal({ ticker: searchTerm.toUpperCase(), name: searchTerm.toUpperCase() });
                      setIsSidebarOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    "{searchTerm.toUpperCase()}" Manuel Ekle
                  </button>
                  <p className="text-xs text-slate-600 mt-2">Tiingo'dan fiyat çekilecek</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: ASSET DASHBOARD */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0a0f1c] custom-scrollbar">
        <div className="p-4 md:p-8 space-y-6 md:space-y-10 max-w-[1400px] mx-auto w-full">
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mt-12 lg:mt-0">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                <Briefcase className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white">Canlı Portföyüm</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-slate-500 font-black text-xs md:text-xs uppercase tracking-widest">Tiingo Real-Time Market Feed</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                refetchPortfolio();
                queryClient.invalidateQueries(['popularStocks']);
                queryClient.invalidateQueries(['cashBalance']);
              }}
              className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 bg-[#1e222d] border border-slate-700 rounded-xl md:rounded-2xl text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all font-black text-xs uppercase tracking-widest shadow-xl w-full md:w-auto justify-center"
            >
              <RefreshCw size={16} className={loading && portfolioData.length > 0 ? 'animate-spin' : ''} />
              Verileri Güncelle
            </button>
          </div>

          {/* DASHBOARD CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-[#1e222d] border border-slate-800 rounded-3xl md:rounded-[40px] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Toplam Varlık Değeri</span>
                  <DollarSign size={18} className="text-emerald-500 md:w-5 md:h-5" />
                </div>
                <div className="text-3xl md:text-5xl font-mono font-black text-white tracking-tighter">
                  ${totals.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-3 md:gap-4 mt-4 md:mt-6">
                  <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-xs font-black flex items-center gap-2 ${totals.totalPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {totals.totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    ${Math.abs(totals.totalPnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className={`font-black text-base md:text-lg ${totals.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totals.totalPnlPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
              <Activity className="absolute -right-8 -bottom-8 w-32 h-32 md:w-48 md:h-48 opacity-[0.03] text-emerald-500" />
            </div>

            {/* Varlık Dağılımı - Pasta Grafiği ve Portföy Ekle */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl md:rounded-[40px] p-6 md:p-8 shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-4">Varlık Dağılımı</div>

                <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
                  {/* Sol: Pasta Grafiği */}
                  <div className="w-36 h-36 md:w-44 md:h-44 flex-shrink-0">
                    {portfolioData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={portfolioData.map((asset, index) => {
                              const totalPortfolioValue = portfolioData.reduce((sum, a) => sum + (a.totalValue || 0), 0);
                              const percentage = totalPortfolioValue > 0 ? ((asset.totalValue || 0) / totalPortfolioValue * 100).toFixed(1) : 0;
                              return {
                                name: asset.symbol,
                                value: asset.totalValue || 0,
                                percentage: percentage
                              };
                            })}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={60}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="#312e81"
                            strokeWidth={2}
                          >
                            {portfolioData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171'][index % 7]}
                                style={{
                                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e1b4b',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '16px',
                              fontSize: '13px',
                              color: '#fff',
                              padding: '12px 16px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
                            }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            labelStyle={{ color: '#a5b4fc', fontWeight: 'bold', marginBottom: '4px' }}
                            formatter={(value, name, props) => {
                              const percentage = props.payload.percentage;
                              return [
                                <span key="val" style={{ color: '#fff', fontWeight: 'bold' }}>
                                  ${value.toLocaleString()} <span style={{ color: '#a5b4fc' }}>(%{percentage})</span>
                                </span>,
                                props.payload.name
                              ];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full rounded-full border-4 border-dashed border-indigo-400/30 flex items-center justify-center">
                        <PieChartIcon size={32} className="text-indigo-400/40" />
                      </div>
                    )}
                  </div>

                  {/* Sağ: Aktif Pozisyon + Portföy Ekle */}
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    <div>
                      <div className="text-4xl md:text-5xl font-black text-white tracking-tighter">{portfolioData.length}</div>
                      <div className="text-xs font-bold text-white/70 uppercase tracking-wider">Aktif Pozisyon</div>
                    </div>

                    {/* Mini Legend */}
                    {portfolioData.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {portfolioData.slice(0, 4).map((asset, index) => (
                          <div
                            key={asset.symbol}
                            className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171'][index % 7] }}
                            />
                            <span className="text-xs font-bold text-white">{asset.symbol}</span>
                          </div>
                        ))}
                        {portfolioData.length > 4 && (
                          <div className="px-2 py-1 bg-white/10 rounded-lg">
                            <span className="text-xs font-bold text-white/70">+{portfolioData.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-white/10 w-fit"
                    >
                      <Plus size={16} />
                      Portföy Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Balance Card - Inline */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-300">Nakit Bakiye</h3>
                </div>
                <button
                  onClick={() => { setCashInput(cashBalance.toString()); setIsCashModalOpen(true); }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Düzenle
                </button>
              </div>
              <div className="text-3xl font-black text-emerald-400">
                ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* ASSET TABLE/CARDS */}
          <div className="bg-[#1e222d] border border-slate-800 rounded-2xl md:rounded-[40px] overflow-hidden shadow-2xl">
            {/* DESKTOP: Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#131722] border-b border-slate-800">
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-500">Sembol / Şirket</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Adet</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Ort. Maliyet</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right font-bold text-emerald-500/80">Anlık Fiyat</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Toplam Değer</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Kâr/Zarar (%)</th>
                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-500 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {portfolioData.map((asset) => (
                    <tr key={asset.id} className="hover:bg-emerald-500/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black text-sm border border-white/10 group-hover:border-emerald-500/30 transition-all shadow-inner">
                            {asset.symbol.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-base text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{asset.symbol}</div>
                            <div className="text-xs font-bold text-slate-500 line-clamp-1">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-mono font-bold text-base text-slate-300">
                        {asset.quantity.toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right font-mono text-sm text-slate-500">
                        ${asset.avgCost.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-right font-mono font-black text-base text-emerald-400 bg-emerald-500/[0.01]">
                        ${asset.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-right font-mono font-black text-base text-indigo-300">
                        ${asset.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className={`font-black text-base flex items-center justify-end gap-1 ${asset.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {asset.profitPercent.toFixed(2)}%
                        </div>
                        <div className={`text-xs font-bold ${asset.profit >= 0 ? 'text-emerald-500/40' : 'text-rose-500/40'}`}>
                          {asset.profit >= 0 ? '+' : '-'}${Math.abs(asset.profit).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {loading && portfolioData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-8 py-24 text-center">
                        <RefreshCw className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-spin opacity-20" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Portföy Yükleniyor...</span>
                      </td>
                    </tr>
                  ) : portfolioData.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-8 py-24 text-center">
                        <Activity className="w-16 h-16 mx-auto mb-6 text-emerald-500 opacity-20" />
                        <h4 className="text-lg font-black text-white mb-2">Henüz Dijital Varlığınız Yok</h4>
                        <p className="text-slate-500 text-sm font-medium">Sol paneldeki arama motorunu kullanarak ilk hissenizi ekleyin.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE: Card View */}
            <div className="md:hidden divide-y divide-slate-800/40">
              {portfolioData.map((asset) => (
                <div key={asset.id} className="p-4 hover:bg-emerald-500/[0.02] transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    {/* LEFT: Symbol + Current Price */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white font-black text-xs border border-white/10 shadow-inner">
                          {asset.symbol.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-base text-white uppercase tracking-tight">{asset.symbol}</div>
                          <div className="text-xs font-bold text-slate-500 line-clamp-1">{asset.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-13">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Anlık:</span>
                        <span className="font-mono font-black text-lg text-emerald-400">${asset.currentPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* RIGHT: Total Value + P/L */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-black text-lg text-indigo-300 mb-1">
                        ${asset.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-xs ${asset.profit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {asset.profit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {asset.profitPercent.toFixed(2)}%
                      </div>
                      <div className={`text-xs font-bold mt-1 ${asset.profit >= 0 ? 'text-emerald-500/40' : 'text-rose-500/40'}`}>
                        {asset.profit >= 0 ? '+' : '-'}${Math.abs(asset.profit).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all text-xs font-bold uppercase tracking-wider min-h-[44px]"
                  >
                    <Trash2 size={16} />
                    Sil
                  </button>
                </div>
              ))}

              {loading && portfolioData.length === 0 ? (
                <div className="px-4 py-24 text-center">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-spin opacity-20" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Portföy Yükleniyor...</span>
                </div>
              ) : portfolioData.length === 0 && (
                <div className="px-4 py-24 text-center">
                  <Activity className="w-16 h-16 mx-auto mb-6 text-emerald-500 opacity-20" />
                  <h4 className="text-base font-black text-white mb-2">Henüz Dijital Varlığınız Yok</h4>
                  <p className="text-slate-500 text-sm font-medium">Üstteki arama butonuna tıklayarak ilk hissenizi ekleyin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a0f1c]/90 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#1e222d] border border-white/5 rounded-[50px] w-full max-w-lg p-10 shadow-[0_0_100px_rgba(16,185,129,0.1)] animate-in zoom-in duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-2xl"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 text-white font-black text-3xl">
                {(selectedStock?.ticker || selectedStock?.symbol || "?").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <h3 className="text-3xl font-black tracking-tighter text-white uppercase">{selectedStock?.ticker || selectedStock?.symbol}</h3>
                <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest line-clamp-1">{selectedStock?.name}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block ml-1">Miktar (Adet)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                    className="w-full bg-[#131722] border border-slate-700/50 rounded-[25px] px-8 py-5 focus:outline-none focus:border-emerald-500 font-mono text-white text-xl transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block ml-1">Alış Fiyatı ($)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={addCost}
                    onChange={(e) => setAddCost(e.target.value)}
                    className="w-full bg-[#131722] border border-slate-700/50 rounded-[25px] px-8 py-5 focus:outline-none focus:border-emerald-500 font-mono text-white text-xl transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                onClick={saveAsset}
                disabled={!addQty || !addCost || isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-6 rounded-[30px] transition-all shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-3 text-lg group"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={24} /> : <Plus size={24} className="group-hover:rotate-90 transition-transform" />}
                Portföye Güvenle Kaydet
              </button>

              <p className="text-center text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">Kayıt işlemi Tiingo Market Feed ile senkronize edilir</p>
            </div>
          </div>
        </div>
      )}

      {/* CASH BALANCE MODAL */}
      {isCashModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-[#1a1d2e] p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Nakit Bakiye Düzenle
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Nakit Miktar ($)</label>
                <input
                  type="number"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-600 px-4 py-2.5 bg-[#0f1117] text-white placeholder-slate-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsCashModalOpen(false)}
                className="flex-1 px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={saveCashBalance}
                className="flex-1 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;