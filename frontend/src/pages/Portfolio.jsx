import { useState, useEffect, useMemo } from "react";
import api from "../lib/api"; // Axios instance
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import toast, { Toaster } from "react-hot-toast";
import {
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  WalletIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  PencilSquareIcon
} from "@heroicons/react/24/outline";
import { ALL_US_STOCKS as ALL_BIST_STOCKS, getStockName } from "../data/allUSStocks.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PortfolioPage() {
  // --- STATE ---
  const [portfolio, setPortfolio] = useState([]); // Hisse Senetleri
  const [cashBalance, setCashBalance] = useState(0); // Nakit Bakiye
  const [prices, setPrices] = useState({});       // Canlı Fiyatlar
  const [search, setSearch] = useState("");

  // Modallar
  const [modalOpen, setModalOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false);

  const [showValues, setShowValues] = useState(true);
  const [loading, setLoading] = useState(true);

  // DÜZENLEME İÇİN ID (Null ise yeni ekleme, Dolu ise düzenleme)
  const [editingId, setEditingId] = useState(null);

  // Form State (Hisse)
  const [formData, setFormData] = useState({
    ticker: "",
    shares: "",
    avgPrice: "",
  });

  // Form State (Nakit)
  const [cashFormValue, setCashFormValue] = useState("");

  // --- 1. VERİ ÇEKME ---
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // A. Kullanıcının Portföyünü Çek
      const portfolioRes = await api.get("/portfolio");
      const portfolioData = Array.isArray(portfolioRes.data) ? portfolioRes.data : portfolioRes.data.stocks || [];
      setPortfolio(portfolioData);

      // Nakit Bakiyesi (Demo için localStorage, gerçekte API'den gelmeli)
      const savedCash = parseFloat(localStorage.getItem('finbot_cash')) || 0;
      setCashBalance(savedCash);

      // B. Portföydeki hisselerin fiyatlarını çek (dinamik)
      const portfolioTickers = portfolioData.map(asset => asset.ticker).filter(Boolean);
      if (portfolioTickers.length > 0) {
        try {
          const tickersString = portfolioTickers.join(",");
          const priceRes = await api.get(`/price/bulk/list?tickers=${tickersString}`);

          const priceMap = {};
          const results = priceRes.data?.results || priceRes.data || [];
          if (Array.isArray(results)) {
            results.forEach(item => {
              if (item.ok !== false && item.price) {
                priceMap[item.ticker] = item.price;
              }
            });
          }
          setPrices(prev => ({ ...prev, ...priceMap }));
        } catch (priceErr) {
          console.error("Fiyat çekme hatası:", priceErr);
        }
      }

    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  }

  // Dinamik fiyat çekme fonksiyonu (arama sonuçları için)
  async function fetchPricesForTickers(tickers) {
    if (!tickers || tickers.length === 0) return;

    // Zaten fiyatı olanları filtrele
    const missingTickers = tickers.filter(t => !prices[t]);
    if (missingTickers.length === 0) return;

    try {
      const tickersString = missingTickers.join(",");
      const priceRes = await api.get(`/price/bulk/list?tickers=${tickersString}`);

      const priceMap = {};
      const results = priceRes.data?.results || priceRes.data || [];
      if (Array.isArray(results)) {
        results.forEach(item => {
          if (item.ok !== false && item.price) {
            priceMap[item.ticker] = item.price;
          }
        });
      }
      setPrices(prev => ({ ...prev, ...priceMap }));
    } catch (err) {
      console.error("Fiyat çekme hatası:", err);
    }
  }

  // --- 2. HESAPLAMALAR ---
  const holdings = useMemo(() => {
    return portfolio.map(asset => {
      const currentPrice = prices[asset.ticker] || 0;
      const totalCost = asset.quantity * asset.avgCost;
      const totalValue = asset.quantity * currentPrice;
      const profit = totalValue - totalCost;
      const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      return {
        ...asset,
        currentPrice,
        totalCost,
        totalValue,
        profit,
        profitPct
      };
    });
  }, [portfolio, prices]);

  const stocksTotalValue = holdings.reduce((a, h) => a + h.totalValue, 0);
  const stocksTotalCost = holdings.reduce((a, h) => a + h.totalCost, 0);
  const grandTotalValue = stocksTotalValue + cashBalance;
  const grandProfit = stocksTotalValue - stocksTotalCost;
  const grandProfitPct = stocksTotalCost > 0 ? (grandProfit / stocksTotalCost) * 100 : 0;

  // --- 3. İŞLEMLER (HİSSE - EKLE / SİL / DÜZENLE) ---

  // Modal'ı Aç (Hem Ekleme Hem Düzenleme İçin)
  function openModal(ticker = "", currentPrice = "", existingAsset = null) {
    if (existingAsset) {
      // DÜZENLEME MODU: Mevcut verileri forma doldur
      setEditingId(existingAsset._id);
      setFormData({
        ticker: existingAsset.ticker,
        shares: existingAsset.quantity,
        avgPrice: existingAsset.avgCost
      });
    } else {
      // EKLEME MODU: Formu sıfırla
      setEditingId(null);
      setFormData({
        ticker,
        shares: "",
        avgPrice: currentPrice || ""
      });
    }
    setModalOpen(true);
  }

  // Kaydet (Ekle veya Güncelle)
  // Kaydet (Ekle veya Güncelle)
  async function saveHolding() {
    // 1. Girdileri Temizle (Virgül -> Nokta)
    const sharesStr = formData.shares.toString().replace(",", ".");
    const avgPriceStr = formData.avgPrice.toString().replace(",", ".");

    const shares = parseFloat(sharesStr);
    const avgPrice = parseFloat(avgPriceStr);

    if (isNaN(shares) || isNaN(avgPrice) || shares <= 0 || avgPrice <= 0) {
      toast.error("Lütfen geçerli sayısal değerler girin!");
      return;
    }

    try {
      if (editingId) {
        // --- DÜZENLEME İŞLEMİ (PUT) ---
        await api.put(`/portfolio/${editingId}`, {
          ticker: formData.ticker,
          quantity: shares,
          avgCost: avgPrice
        });
        toast.success(`${formData.ticker} güncellendi!`);

        // State'i anlık güncelle
        setPortfolio(prev => prev.map(p =>
          p._id === editingId ? { ...p, quantity: shares, avgCost: avgPrice } : p
        ));

      } else {
        // --- EKLEME İŞLEMİ (POST) ---
        const res = await api.post("/portfolio/add", {
          ticker: formData.ticker,
          quantity: shares,
          avgCost: avgPrice
        });
        toast.success(`${formData.ticker} eklendi!`);

        if (res.data) setPortfolio(prev => [...prev, res.data]);
        else fetchData();

        if (!prices[formData.ticker]) {
          fetchPricesForTickers([formData.ticker]);
        }
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
      // Hata mesajını detaylı göster
      const msg = err.response?.data?.message || err.message || "İşlem başarısız!";
      toast.error(msg);
    }
  }

  // Silme İşlemi
  async function removeHolding(id, ticker) {
    if (!window.confirm(`${ticker} hissesini portföyden tamamen silmek istiyor musun?`)) return;

    try {
      // Backend'de DELETE /portfolio/:id endpoint'i olmalı
      await api.delete(`/portfolio/${id}`);

      toast.success("Hisse silindi.");
      // Listeden çıkar
      setPortfolio(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Silme işlemi başarısız.");
    }
  }

  // --- 4. İŞLEMLER (NAKİT) ---
  function openCashModal() {
    setCashFormValue(cashBalance.toString());
    setCashModalOpen(true);
  }

  function saveCash() {
    const val = parseFloat(cashFormValue);
    if (isNaN(val) || val < 0) {
      toast.error("Geçersiz tutar.");
      return;
    }
    setCashBalance(val);
    localStorage.setItem('finbot_cash', val);
    toast.success("Nakit bakiyesi güncellendi.");
    setCashModalOpen(false);
  }

  // --- RENDER YARDIMCILARI ---
  // Turkish-aware text normalization using toLocaleLowerCase
  const normalizeText = (text) => {
    if (!text) return "";
    return text.toLocaleLowerCase('tr');
  };

  // Remove duplicates from ALL_BIST_STOCKS and create unique list
  const uniqueBistStocks = useMemo(() => {
    const seen = new Set();
    return ALL_BIST_STOCKS.filter((stock) => {
      const tickerUpper = stock.ticker.toUpperCase();
      if (seen.has(tickerUpper)) {
        return false; // Duplicate, skip
      }
      seen.add(tickerUpper);
      return true;
    });
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!search || search.trim() === "") {
      return uniqueBistStocks.slice(0, 100); // İlk 100 sonucu göster (performans için)
    }

    const searchTerm = normalizeText(search.trim());
    const filtered = uniqueBistStocks.filter((c) => {
      const tickerNormalized = normalizeText(c.ticker);
      const nameNormalized = normalizeText(c.name);
      return tickerNormalized.includes(searchTerm) || nameNormalized.includes(searchTerm);
    });

    return filtered.slice(0, 100); // İlk 100 sonucu göster (performans için)
  }, [search, uniqueBistStocks]);

  // Arama sonuçları için fiyatları çek (lazy loading)
  useEffect(() => {
    if (filteredCompanies.length > 0 && filteredCompanies.length <= 100) {
      const tickersToFetch = filteredCompanies.map(c => c.ticker);
      fetchPricesForTickers(tickersToFetch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCompanies]); // filteredCompanies değiştiğinde (ilk yükleme dahil) fiyatları çek


  // Grafik Verileri
  const chartLabels = [...holdings.map(h => h.ticker)];
  const chartValues = [...holdings.map(h => h.totalValue)];
  const chartColors = ["#10b981", "#3b82f6", "#facc15", "#ef4444", "#8b5cf6", "#f97316", "#14b8a6", "#ec4899"];

  if (cashBalance > 0) {
    chartLabels.push("NAKİT");
    chartValues.push(cashBalance);
    chartColors.push("#6b7280");
  }

  const chartData = {
    labels: chartLabels,
    datasets: [{ data: chartValues, backgroundColor: chartColors, borderWidth: 0 }],
  };

  return (
    <div className="flex min-h-screen bg-[#131314] font-sans pb-20">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#fff' } }} />

      <main className="flex-1 w-full p-4 md:p-10 text-zinc-100 flex flex-col items-center">

        {/* === HERO SECTION (Compact Mobile) === */}
        <div className="w-full max-w-7xl mb-6 md:mb-10">
          {/* Mobile: Compact Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 md:h-8 md:w-8 text-indigo-500" />
              <h1 className="text-lg md:text-3xl font-bold text-white">Portföy</h1>
            </div>
            <button onClick={() => setShowValues(!showValues)} className="p-2 text-zinc-400 hover:text-white">
              {showValues ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
            </button>
          </div>

          {/* Hero Card - Compact on Mobile */}
          <div className="bg-gradient-to-r from-gray-900 to-[#111827] border border-zinc-800 rounded-2xl md:rounded-3xl p-4 md:p-8 relative overflow-hidden">
            {/* Total Value */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Toplam Portföy Değeri
                </p>
                <h2 className="text-2xl md:text-5xl font-extrabold text-white tracking-tight">
                  {showValues ? `$${grandTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}
                </h2>
                {/* Daily P/L - Neon Green */}
                <div className={`flex items-center gap-1 mt-1 md:mt-2 ${grandProfit >= 0 ? "text-green-500" : "text-rose-400"}`}>
                  {grandProfit >= 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm md:text-base font-bold">
                    {showValues ? `${grandProfit >= 0 ? '+' : ''}$${Math.abs(grandProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "•••"}
                  </span>
                  <span className="text-xs md:text-sm opacity-80">
                    ({showValues ? `${grandProfit >= 0 ? '+' : ''}${grandProfitPct.toFixed(2)}%` : "•"})
                  </span>
                </div>
              </div>
              {/* Mini Chart - Hidden on very small screens */}
              {(holdings.length > 0 || cashBalance > 0) && (
                <div className="w-16 h-16 md:w-24 md:h-24 hidden sm:block">
                  <Doughnut data={chartData} options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }} />
                </div>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="mt-4 md:mt-6 flex gap-3 md:gap-4">
              <div className="flex-1 bg-black/30 p-2 md:p-3 rounded-lg md:rounded-xl">
                <p className="text-[9px] md:text-xs text-zinc-500 mb-0.5">Maliyet</p>
                <p className="text-xs md:text-sm font-bold text-zinc-300">
                  {showValues ? `$${stocksTotalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : "••"}
                </p>
              </div>
              <div className="flex-1 bg-black/30 p-2 md:p-3 rounded-lg md:rounded-xl">
                <p className="text-[9px] md:text-xs text-zinc-500 mb-0.5">Hisse</p>
                <p className="text-xs md:text-sm font-bold text-zinc-300">{holdings.length} Adet</p>
              </div>
              <div
                onClick={openCashModal}
                className="flex-1 bg-emerald-900/20 p-2 md:p-3 rounded-lg md:rounded-xl cursor-pointer hover:bg-emerald-900/30 transition border border-transparent hover:border-emerald-500/30"
              >
                <p className="text-[9px] md:text-xs text-emerald-500/70 mb-0.5">Nakit</p>
                <p className="text-xs md:text-sm font-bold text-emerald-400">
                  {showValues ? `$${cashBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : "••"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === HOLDINGS LIST (Compact Mobile) === */}
        {holdings.length > 0 && (
          <div className="w-full max-w-7xl mb-6 md:mb-12">
            <h2 className="text-sm md:text-xl font-bold text-white mb-3 md:mb-5 flex items-center gap-2">
              <WalletIcon className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              Varlıklarım
            </h2>

            {/* Mobile: Compact List | Desktop: Grid */}
            <div className="bg-[#161b22] border border-zinc-800 rounded-xl md:rounded-2xl overflow-hidden">
              {holdings.map((asset, idx) => (
                <div
                  key={asset._id}
                  className={`flex items-center justify-between p-3 md:p-4 ${idx !== holdings.length - 1 ? 'border-b border-zinc-800/60' : ''}`}
                >
                  {/* Left: Ticker Info */}
                  <div className="flex items-center gap-3">
                    {/* Logo Placeholder */}
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-[10px] md:text-xs font-bold text-zinc-400">{asset.ticker.slice(0, 2)}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm md:text-base font-bold text-white">{asset.ticker}</h3>
                      <p className="text-[10px] md:text-xs text-zinc-500 truncate">
                        {asset.quantity} Lot • Ort. ${asset.avgCost.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Prices */}
                  <div className="text-right flex items-center gap-3 md:gap-4">
                    <div>
                      {/* Current Price - Green Mono */}
                      <p className="text-sm font-mono font-bold text-green-500">
                        {showValues ? `$${asset.currentPrice.toFixed(2)}` : "•••"}
                      </p>
                      {/* Total Value */}
                      <p className="text-[10px] md:text-xs text-zinc-400 font-medium">
                        {showValues ? `$${asset.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : "••"}
                      </p>
                    </div>
                    {/* P/L Badge */}
                    <div className={`text-right px-2 py-1 rounded ${asset.profit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      <p className={`text-xs font-bold ${asset.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {asset.profit >= 0 ? '+' : ''}{showValues ? asset.profitPct.toFixed(1) : '•'}%
                      </p>
                    </div>
                    {/* Actions - Always visible (with stopPropagation) */}
                    <div className="flex gap-0.5 md:gap-1 relative z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("", "", asset);
                        }}
                        className="p-1.5 md:p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHolding(asset._id, asset.ticker);
                        }}
                        className="p-1.5 md:p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-900/10 rounded-lg transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === ADD ASSET SECTION (Mobile Compact) === */}
        <div className="w-full max-w-7xl">
          <div className="bg-[#161b22] border border-zinc-800 rounded-xl md:rounded-3xl p-4 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-xl font-bold text-white flex items-center gap-2">
                <PlusIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                Hisse Ekle
              </h2>
              {search && (
                <span className="text-xs text-zinc-500">
                  {filteredCompanies.length} sonuç
                </span>
              )}
            </div>

            {/* Search Bar - Compact */}
            <div className="relative w-full mb-4">
              <input
                type="text"
                placeholder="Hisse ara (AAPL, TSLA, NVDA...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 bg-[#0d1117] border border-zinc-700 rounded-lg pl-9 pr-4 text-sm text-white outline-none focus:border-indigo-500"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Stock List - Compact Rows */}
            <div className="space-y-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-3 md:space-y-0">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.slice(0, 20).map((c, idx) => {
                  const price = prices[c.ticker];
                  const formattedPrice = price ? Number(price).toFixed(2) : null;
                  return (
                    <div
                      key={c.ticker}
                      onClick={() => openModal(c.ticker, formattedPrice || "")}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition md:bg-[#0d1117] md:border md:border-zinc-800/50 md:rounded-lg md:flex-col md:items-start ${idx !== filteredCompanies.slice(0, 20).length - 1 ? 'border-b border-zinc-800/40 md:border-b-0' : ''}`}
                    >
                      <div className="flex items-center gap-3 md:w-full md:mb-2">
                        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 md:hidden">
                          <span className="text-[9px] font-bold text-zinc-400">{c.ticker.slice(0, 2)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-white">{c.ticker}</h3>
                          <p className="text-[10px] text-zinc-500 truncate">{c.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {formattedPrice && (
                          <span className="text-xs font-mono text-green-500">${formattedPrice}</span>
                        )}
                        <div className="w-6 h-6 bg-indigo-600/20 rounded flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition">
                          <PlusIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : search.trim() !== "" ? (
                <div className="col-span-full text-center py-6 text-zinc-500 text-sm">
                  Sonuç bulunamadı.
                </div>
              ) : null}
            </div>
            {filteredCompanies.length > 20 && (
              <div className="mt-3 text-center text-[10px] text-zinc-600">
                İlk 20 sonuç gösteriliyor. Daha spesifik arama yapın.
              </div>
            )}
          </div>
        </div>

      </main>

      {/* --- MODALLAR --- */}

      {/* 1. HİSSE MODAL (EKLE / DÜZENLE) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-[#161b22] p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-zinc-700 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold mb-1 text-white">{editingId ? "Hisse Düzenle" : "Hisse Ekle"}</h2>

            <div className="space-y-4 mt-6">
              {!editingId && (
                <div>
                  <input
                    type="text"
                    placeholder="Hisse Kodu (Örn: AAPL, TSLA, NVDA)"
                    value={formData.ticker}
                    onChange={(e) => {
                      const ticker = e.target.value.toUpperCase().trim();
                      setFormData({ ...formData, ticker });
                      // Eğer geçerli bir ticker girildiyse fiyatını çek
                      if (ticker && uniqueBistStocks.some(s => s.ticker === ticker)) {
                        fetchPricesForTickers([ticker]);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#0d1117] text-white border border-zinc-700 focus:border-indigo-500 outline-none"
                    list="us-tickers"
                  />
                  <datalist id="us-tickers">
                    {uniqueBistStocks.slice(0, 200).map(stock => (
                      <option key={stock.ticker} value={stock.ticker}>{stock.name}</option>
                    ))}
                  </datalist>
                  {formData.ticker && (
                    <div className="mt-2 text-sm text-zinc-400">
                      {getStockName(formData.ticker) !== formData.ticker ? (
                        <span>{getStockName(formData.ticker)}</span>
                      ) : (
                        <span className="text-yellow-500">Bu ticker listede bulunamadı, ancak ekleyebilirsiniz.</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {editingId && (
                <div className="text-indigo-400 font-bold text-lg">{formData.ticker}</div>
              )}

              <input type="number" placeholder="Lot Sayısı" value={formData.shares} onChange={(e) => setFormData({ ...formData, shares: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0d1117] text-white border border-zinc-700 focus:border-indigo-500 outline-none" />
              <input type="number" placeholder="Maliyet ($)" value={formData.avgPrice} onChange={(e) => setFormData({ ...formData, avgPrice: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0d1117] text-white border border-zinc-700 focus:border-indigo-500 outline-none" />
              {formData.ticker && prices[formData.ticker] && (
                <div className="text-xs text-zinc-500">
                  Güncel fiyat: ${prices[formData.ticker].toFixed(2)}
                </div>
              )}
            </div>

            <button onClick={saveHolding} className="w-full mt-8 px-4 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition">
              {editingId ? "Güncelle" : "Portföye Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* 2. NAKİT MODAL */}
      {cashModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-[#161b22] p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-zinc-700 relative">
            <button onClick={() => setCashModalOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 mb-4 text-emerald-500"><BanknotesIcon className="w-6 h-6" /> <h2 className="text-2xl font-bold text-white">Nakit</h2></div>

            <input type="number" placeholder="Toplam Nakit" value={cashFormValue} onChange={(e) => setCashFormValue(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0d1117] text-white border border-zinc-700 focus:border-emerald-500 outline-none text-lg" />

            <button onClick={saveCash} className="w-full mt-8 px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition">
              Bakiyeyi Güncelle
            </button>
          </div>
        </div>
      )}

    </div>
  );
}