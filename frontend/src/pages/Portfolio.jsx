import React, { useState, useEffect, useCallback } from 'react';
import api from "../lib/api";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Search,
  X,
  RefreshCw,
  PieChart,
  Activity,
  DollarSign,
  ArrowUpRight,
  Briefcase,
  AlertCircle
} from 'lucide-react';

const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState([]);
  const [totals, setTotals] = useState({ totalValue: 0, totalPnl: 0, totalPnlPercent: 0 });
  const [loading, setLoading] = useState(true);

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

  // Default Popular Stocks (Hardcoded, but we will fetch prices)
  const [popularStocks, setPopularStocks] = useState([
    { ticker: 'AAPL', name: 'Apple Inc.', price: 0 },
    { ticker: 'TSLA', name: 'Tesla, Inc.', price: 0 },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 0 },
    { ticker: 'MSFT', name: 'Microsoft', price: 0 },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', price: 0 },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 0 },
    { ticker: 'META', name: 'Meta Platforms', price: 0 },
    { ticker: 'NFLX', name: 'Netflix, Inc.', price: 0 }
  ]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portfolio');
      if (res.data.ok) {
        setPortfolioData(res.data.data);
        setTotals(res.data.totals);
      }
    } catch (err) {
      console.error("Portfolio fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularPrices = async () => {
    try {
      const tickers = popularStocks.map(s => s.ticker).join(",");
      const res = await api.get(`/prices/batch?tickers=${tickers}`);
      if (res.data.ok) {
        setPopularStocks(prev => prev.map(s => ({
          ...s,
          price: res.data.data[s.ticker] || s.price
        })));
      }
    } catch (e) { }
  };

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

  useEffect(() => {
    fetchPortfolio();
    fetchPopularPrices();
    const interval = setInterval(fetchPortfolio, 300000); // 5 min interval
    return () => clearInterval(interval);
  }, []);

  const openAddModal = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const saveAsset = async () => {
    if (!addQty || !addCost) return;
    setIsSaving(true);
    try {
      const res = await api.post('/portfolio/add', {
        symbol: selectedStock.ticker || selectedStock.symbol,
        name: selectedStock.name,
        quantity: Number(addQty),
        avgCost: Number(addCost)
      });
      if (res.data.ok) {
        setIsModalOpen(false);
        setAddQty("");
        setAddCost("");
        fetchPortfolio();
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAsset = async (id) => {
    if (!window.confirm("Bu hisseyi portföyünüzden silmek istediğinize emin misiniz?")) return;
    try {
      const res = await api.delete(`/portfolio/${id}`);
      if (res.data.ok) {
        fetchPortfolio();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0f1c] text-white overflow-hidden font-sans">
      {/* LEFT SIDEBAR: DYNAMIC SEARCH */}
      <div className="w-80 md:w-1/4 flex-shrink-0 bg-[#1e222d] border-r border-slate-800 flex flex-col">
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
              <span className="text-[10px] font-black uppercase tracking-widest leading-loose">Piyasalar Taranıyor...</span>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 ml-2 flex items-center gap-2">
                {searchTerm ? 'Arama Sonuçları' : 'Popüler Hisseler'}
                {!searchTerm && <Activity size={12} className="text-emerald-500" />}
              </h3>

              {(searchTerm ? searchResults : popularStocks).map(s => (
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
                    <div className="text-[10px] text-slate-500 line-clamp-1 font-bold">{s.name}</div>
                  </div>
                  <button
                    onClick={() => openAddModal(s)}
                    className="w-10 h-10 flex-shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/0 hover:shadow-emerald-500/20 ml-2"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}

              {searchTerm && searchResults.length === 0 && (
                <div className="p-10 text-center text-slate-600">
                  <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest">Eşleşme Bulunamadı</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: ASSET DASHBOARD */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0a0f1c] custom-scrollbar">
        <div className="p-8 space-y-10 max-w-[1400px] mx-auto w-full">
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                <Briefcase size={32} />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tighter text-white">Canlı Portföyüm</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Tiingo Real-Time Market Feed</p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchPortfolio}
              className="flex items-center gap-3 px-6 py-3 bg-[#1e222d] border border-slate-700 rounded-2xl text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all font-black text-xs uppercase tracking-widest shadow-xl"
            >
              <RefreshCw size={16} className={loading && portfolioData.length > 0 ? 'animate-spin' : ''} />
              Verileri Güncelle
            </button>
          </div>

          {/* DASHBOARD CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#1e222d] border border-slate-800 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Toplam Varlık Değeri</span>
                  <DollarSign size={20} className="text-emerald-500" />
                </div>
                <div className="text-5xl font-mono font-black text-white tracking-tighter">
                  ${totals.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <div className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 ${totals.totalPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {totals.totalPnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    ${Math.abs(totals.totalPnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className={`font-black text-lg ${totals.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totals.totalPnlPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
              <Activity className="absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.03] text-emerald-500" />
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[40px] p-8 shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Varlık Dağılımı</div>
                <div className="text-5xl font-black text-white tracking-tighter">{portfolioData.length}</div>
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-100 opacity-80 uppercase tracking-wider">Aktif Pozisyon</span>
                  <div className="flex -space-x-2">
                    {portfolioData.slice(0, 4).map((a, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-indigo-400 border-2 border-indigo-600 flex items-center justify-center text-[10px] font-black text-indigo-900 shadow-lg">
                        {a.symbol.slice(0, 1)}
                      </div>
                    ))}
                    {portfolioData.length > 4 && <div className="w-8 h-8 rounded-full bg-indigo-300 border-2 border-indigo-600 flex items-center justify-center text-[10px] font-black text-indigo-900 shadow-lg">+{portfolioData.length - 4}</div>}
                  </div>
                </div>
              </div>
              <PieChart className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 text-white" />
            </div>
          </div>

          {/* ASSET TABLE */}
          <div className="bg-[#1e222d] border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
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
                            <div className="font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{asset.symbol}</div>
                            <div className="text-[10px] font-bold text-slate-500 line-clamp-1">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-mono font-bold text-slate-300">
                        {asset.quantity.toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right font-mono text-slate-500">
                        ${asset.avgCost.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-right font-mono font-black text-emerald-400 bg-emerald-500/[0.01]">
                        ${asset.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-right font-mono font-black text-indigo-300">
                        ${asset.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className={`font-black flex items-center justify-end gap-1 ${asset.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {asset.profitPercent.toFixed(2)}%
                        </div>
                        <div className={`text-[10px] font-bold ${asset.profit >= 0 ? 'text-emerald-500/40' : 'text-rose-500/40'}`}>
                          {asset.profit >= 0 ? '+' : '-'}${Math.abs(asset.profit).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                        >
                          <Trash2 size={20} />
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block ml-1">Miktar (Adet)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                    className="w-full bg-[#131722] border border-slate-700/50 rounded-[25px] px-8 py-5 focus:outline-none focus:border-emerald-500 font-mono text-white text-xl transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block ml-1">Alış Fiyatı ($)</label>
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

              <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Kayıt işlemi Tiingo Market Feed ile senkronize edilir</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;