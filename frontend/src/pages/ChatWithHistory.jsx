// PATH: src/pages/ChatWithHistory.jsx
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext"; // Auth Context

import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon, // Hamburger menü ikonu
  XMarkIcon  // Menü kapatma ikonu
} from "@heroicons/react/24/solid";

import AnalysisCard from "../components/AnalysisCard";
import TypingIndicator from "../components/TypingIndicator";
import StructuredResponse from "../components/StructuredResponse";
import QuotaDisplay from "../components/QuotaDisplay";
import { Link } from "react-router-dom";
import "../styles/structuredResponse.css";
import logo from "../images/logo1.png";
// ----------------------------- Global CSS ------------------------
const GLOBAL_STYLES = `
  html, body, #root {
    height: 100%;
    background: #0b0c0f;
    margin: 0;
    padding: 0;
  }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .no-scrollbar::-webkit-scrollbar { display: none !important; }
  ::selection { background: rgba(16,185,129,.35); color: #fff; }
  button:focus, textarea:focus, input:focus { outline: none; }
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
  }
  /* Custom Slim Scrollbar */
  .slim-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .slim-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .slim-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }
  .slim-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  .slim-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  }
`;

const MAX_VISIBLE = 7;

export default function ChatWithHistory() {
  // --------------------------- Auth & Router --------------------------------
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // --------------------------- Style inject ---------------------------------
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = "finbot-global-styles";
    styleEl.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, []);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const scrollRef = useRef(null);

  // --------------------------- Fetch history --------------------------------
  // 1. Önce fonksiyonu tanımlıyoruz (Sıralama önemli!)
  const fetchHistory = useCallback(async () => {
    // User yoksa hiç API'ye gitme, fonksiyonu bitir
    if (!user) return;

    try {
      const res = await api.get("/chats");

      // Gelen verinin dizi olup olmadığını veya obje içinde olup olmadığını kontrol et
      const list = Array.isArray(res.data) ? res.data : res.data?.chats || [];

      setHistory(list);
    } catch (err) {
      console.error("Sohbet geçmişi yüklenemedi:", err);

      // 401 hatası (Token süresi dolmuş veya yetkisiz) ise çıkış yaptır
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
      }
    }
  }, [user, logout, navigate]); // Bu bağımlılıklar değişirse fonksiyon yeniden oluşturulur


  // 2. Fonksiyon tanımlandıktan sonra useEffect içinde çağırıyoruz
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]); // fetchHistory değiştiğinde (yani user değiştiğinde) burası çalışır
  async function loadChat(id) {
    try {
      const res = await api.get(`/chat/${id}`);
      const msgs = res.data?.messages || res.data?.chat?.messages || [];
      setMessages(msgs);
      setActiveChatId(id);
      setIsSidebarOpen(false); // Mobilde bir sohbete tıklayınca menüyü kapat
      scrollToBottom();
    } catch (error) {
      // setErrorText("Sohbet yüklenemedi.");  <-- BU SATIRI SİL
      console.error("Sohbet yüklenemedi.", error); // <-- YERİNE BUNU YAZ
    }
  }
  // --------------------------- Send message ---------------------------------
  // ... (Kodun geri kalanı aynı)

  async function sendMessage(e) {
    if (e) e.preventDefault();
    const t = input.trim();
    if (!t) return;

    // 1. Önce kullanıcının mesajını ekrana bas
    setMessages((p) => [...p, { sender: "user", text: t }]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Mesajı gönder
      const res = await api.post("/chat", {
        message: t,
        chatId: activeChatId || undefined
      });

      let currentChatId = activeChatId;

      // 3. Eğer yeni bir sohbet ise ID'yi güncelle
      if (!activeChatId && res.data?.chatId) {
        currentChatId = res.data.chatId;
        setActiveChatId(currentChatId);

        // Backend artık otomatik isimlendirme yapıyor, manuel rename'e gerek yok.
        fetchHistory();
      }

      // 4. Botun cevabını ekrana bas
      if (Array.isArray(res.data?.messages)) {
        setMessages(res.data.messages);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: res.data?.reply || "Yanıt alınamadı." }
        ]);
      }

      scrollToBottom();

    } catch (err) {
      console.error("Mesaj gönderilemedi:", err);
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      // 429: Günlük limit aşıldı
      if (err.response?.status === 429) {
        const quotaData = err.response?.data?.data;
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `⚠️ **Günlük sorgu hakkınız doldu!**\n\nBugün için ${quotaData?.limit || 5} sorgu hakkınızı kullandınız.\n\n**Daha fazla sorgu için:**\n- Yarın (UTC 00:00'da) haklarınız yenilenecek\n- [Planınızı yükselterek](/pricing) daha fazla sorgu hakkı kazanabilirsiniz`,
            isQuotaError: true
          }
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Bağlantı hatası. Lütfen tekrar deneyin." }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // ...

  function scrollToBottom() {
    // Mobilde klavye açıldığında scroll'un tam oturması için timeout
    setTimeout(() => {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }, 100);
  }
  // --------------------------- Rename / Delete -------------------------------
  async function handleDeleteChat(id) {
    if (!window.confirm("Bu sohbet silinsin mi?")) return;
    try {
      await api.delete(`/chat/${id}`);
      fetchHistory();
      if (id === activeChatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (error) {
      // setErrorText("Sohbet silinemedi."); yerine:
      console.error("Sohbet silinemedi.", error);
    }
  }

  async function handleRenameChat(id) {
    const title = renameValue.trim();
    if (!title) { setRenamingId(null); return; }
    try {
      await api.put(`/chat/${id}/rename`, { title });
      setRenamingId(null);
      setRenameValue("");
      fetchHistory();
    } catch (error) {
      // setErrorText("Yeniden adlandırma başarısız."); yerine:
      console.error("Yeniden adlandırma başarısız.", error);
    }
  }
  // 👇 ÇIKIŞ YAPMA FONKSİYONU
  const handleLogout = () => {
    if (window.confirm("Çıkış yapmak istiyor musunuz?")) {
      logout();
      navigate("/login");
    }
  };

  // --------------------------- Suggestions ----------------------------------
  const suggestions = useMemo(() => [
    "Apple'ın bilançosunu analiz et",
    "Düşük değerli teknoloji hisseleri bul",
    "Tesla için duygu analizi nedir?",
    "Microsoft ile Google'ı finansal olarak karşılaştır"
  ], []);

  // --------------------------- Bubble (Gemini Dark Style) --------------------
  const Bubble = ({ role, children }) => (
    <div
      className={`flex items-center gap-3 ${role === "user" ? "justify-end" : "justify-start"
        }`}
    >
      {role === "bot" && (
        <img
          src={logo}
          alt="FinBot"
          className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 self-start"
        />
      )}

      <div
        className={`text-[15px] md:text-[16px] leading-relaxed ${role === "user"
          ? "bg-[#282A2C] text-white rounded-3xl px-4 py-3 max-w-[85%] md:max-w-[600px]"
          : "text-[#E3E3E3] flex-1 min-w-0"
          }`}
      >
        {children}
      </div>
    </div>
  );

  // --------------------------- Render ---------------------------------------
  return (
    <div className="h-full w-full bg-[#131314] text-[#E3E3E3] flex overflow-hidden relative md:pl-20">

      {/* 🌑 Overlay (Mobil Menü Açıkken Arka Planı Karart) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Toggle Button - Desktop Only (Mobile has header button) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="hidden md:block fixed left-24 top-4 md:left-22 z-40 p-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-2xl transition-all duration-200 hover:scale-110 group"
          title="Sohbetleri Aç"
        >
          <Bars3Icon className="w-5 h-5 text-white" />
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Sohbetler
          </span>
        </button>
      )}

      {/* ---------------- Chat History Sidebar ---------------- */}
      <aside
        style={{ backgroundColor: '#131314' }}
        className={`
          fixed inset-y-0 z-40 w-[320px] md:w-[320px]
          flex flex-col border-r border-white/5
          transition-transform duration-300 ease-in-out
          left-0 md:left-20
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar Header - Improved Design */}
        <div className="px-4 py-4 flex items-center justify-between bg-gradient-to-r from-emerald-900/20 to-transparent border-b border-emerald-500/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="text-lg font-bold text-emerald-400">Sohbetler</div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-zinc-400 hover:text-white transition-all rounded-lg hover:bg-zinc-800 hover:rotate-90"
            title="Menüyü Kapat"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Yeni Sohbet Butonu - Improved */}
        <div className="px-4 pb-3 pt-2">
          <button
            onClick={() => {
              setActiveChatId(null);
              setMessages([]);
              setIsSidebarOpen(false);
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2.5 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
          >
            <PlusIcon className="w-4 h-4" />
            Yeni Sohbet
          </button>
        </div>

        <div className="px-4 pb-3">
          <input
            placeholder="Sohbetlerde ara"
            className="w-full rounded-2xl bg-[#15171d] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 ring-1 ring-zinc-800 focus:outline-none"
          />
        </div>

        {/* Quota Display - Center Position */}
        <div className="px-4 pb-3">
          <QuotaDisplay compact={false} />
        </div>

        {/* Scrollable Chat List Container */}
        <div className="flex-1 overflow-y-auto slim-scrollbar min-h-0">
          <div className="px-4 text-[11px] font-semibold tracking-wide text-zinc-500 mb-2 sticky top-0 bg-[#131314] py-2 z-10">SOHBETLER</div>

          <ul className="px-2 space-y-1.5 pb-2">
            {(showAll ? history : history.slice(0, MAX_VISIBLE)).map((chat) => (
              <li
                key={chat._id}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all duration-200
                ${chat._id === activeChatId
                    ? "bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 ring-1 ring-emerald-500/30 shadow-lg"
                    : "hover:bg-zinc-800/60 active:scale-[0.98]"}`}
                onClick={() => loadChat(chat._id)}
              >
                {/* Chat icon */}
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm
                ${chat._id === activeChatId ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700"}`}>
                  💬
                </div>

                {/* Chat title */}
                <span className="flex-1 truncate text-zinc-200 font-medium">
                  {chat.title || chat.messages?.[0]?.text || "Yeni Sohbet"}
                </span>

                {/* Action buttons */}
                <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 rounded-lg transition-all"
                    onClick={(e) => { e.stopPropagation(); setRenamingId(chat._id); setRenameValue(chat.title || ""); }}
                    title="Yeniden Adlandır"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-all"
                    onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat._id); }}
                    title="Sil"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </span>
              </li>
            ))}

            {renamingId && (
              <li className="mt-2 rounded-xl bg-zinc-800/80 px-3 py-3 ring-1 ring-emerald-500/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                    placeholder="Sohbet adı girin..."
                    className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameChat(renamingId);
                      if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                    }}
                  />
                  <button
                    onClick={() => handleRenameChat(renamingId)}
                    className="bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs rounded-lg text-black font-bold transition-colors shadow-lg"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => { setRenamingId(null); setRenameValue(""); }}
                    className="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 text-xs rounded-lg text-white font-bold transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </li>
            )}

            {history.length > MAX_VISIBLE && (
              <li className="pt-2">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full rounded-xl bg-zinc-800/50 hover:bg-zinc-700/80 px-3 py-2.5 text-sm text-zinc-300 hover:text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  {showAll ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Daha az göster
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {history.length - MAX_VISIBLE} sohbet daha
                    </>
                  )}
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Bottom spacing for mobile nav */}
        <div className="h-16 md:hidden shrink-0" />
      </aside>

      {/* ---------------- Main Chat Area ---------------- */}
      <main className="relative flex-1 flex flex-col bg-[#131314] h-full w-full max-w-full overflow-hidden">

        {/* Mobile Header (Gemini Style) */}
        <div className="md:hidden flex items-center justify-between p-3 bg-[#1E1F20] shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-[#8E918F] hover:text-white transition"
              title={isSidebarOpen ? "Menüyü Kapat" : "Menüyü Aç"}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <span className="text-base font-semibold text-white">FinBot</span>
          </div>
          <button
            onClick={() => {
              setActiveChatId(null);
              setMessages([]);
            }}
            className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Scroll Area (Tüm içerik bu kaydırılabilir alanda) */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll scroll-smooth">

          <div className="mx-auto w-full max-w-[1180px] px-4 md:px-8">

            {/* 1. DURUM: HİÇ MESAJ YOKSA (ÖNERİLER) */}
            {messages.length === 0 && (
              <div className="pt-[10vh] pb-8 text-center px-2">
                <div className="text-[16px] text-zinc-300 mb-6 font-medium">
                  FinBot'a başlamak için bir soru sorun.
                </div>
                {/* Suggestion Grid - Responsive with proper wrapping */}
                <div className="w-full max-w-5xl mx-auto">
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(s)}
                        className="rounded-xl border border-zinc-700 bg-[#15171d] px-4 py-3 text-[14px] md:text-[15px] font-medium text-zinc-300 hover:border-emerald-500/50 hover:bg-[#1a1d24] transition text-left break-words min-h-[60px] flex items-center justify-start"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. DURUM: MESAJLAR VARSA (SOHBET AKIŞI) */}
            {messages.length > 0 && (
              <div className="pt-4 md:pt-6 pb-40 md:pb-40 space-y-3 md:space-y-6">
                {messages.map((m, i) => (
                  <Bubble key={i} role={m.sender === "user" ? "user" : "bot"}>

                    {/* Metin İçeriği */}
                    {m.text && (
                      <div className="text-[15px] md:text-[16px]">
                        {m.sender === "bot" ? (
                          <StructuredResponse text={m.text} />
                        ) : (
                          <div className="whitespace-pre-line">{m.text}</div>
                        )}
                      </div>
                    )}

                    {/* Analiz Tablosu (Mobilde taşmayı önlemek için overflow-x-auto ekledik) */}
                    {m.type === "analysis" && m.analysis && (
                      <div className="mt-3 w-full overflow-x-auto rounded-lg">
                        <AnalysisCard a={m.analysis} theme="dark" />
                      </div>
                    )}
                  </Bubble>
                ))}

                {/* Yazıyor Animasyonu */}
                {isLoading && (
                  <Bubble role="bot">
                    <TypingIndicator />
                  </Bubble>
                )}
              </div>
            )}

          </div>
        </div >

        {/* --- FIXED FULL-WIDTH INPUT BAR --- */}
        < div className="fixed bottom-[56px] md:bottom-0 left-0 md:left-20 right-0 bg-[#131314] border-t border-zinc-800/50 p-3 z-40" >
          <form
            onSubmit={sendMessage}
            className="max-w-4xl mx-auto flex items-end gap-2 bg-[#1E1F20] border border-zinc-700/50 rounded-2xl px-4 shadow-2xl relative"
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="FinBot'a bir şey sor..."
              className="flex-1 min-h-[44px] max-h-[120px] py-3 bg-transparent text-[15px] md:text-[16px] resize-none focus:outline-none text-[#E3E3E3] placeholder:text-[#8E918F] overflow-y-auto no-scrollbar"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className={`mb-2 grid h-10 w-10 place-items-center rounded-xl transition shrink-0 ${input.trim() ? "bg-white text-[#131314] hover:bg-gray-200" : "bg-[#3C4043] text-[#8E918F]"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>
        </div >
      </main >

      {/* Settings Modal */}
      {
        showSettingsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E1F20] rounded-2xl w-full max-w-md border border-zinc-700 shadow-2xl">
              <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Ayarlar</h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-zinc-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">E-posta</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
                <div className="pt-4">
                  <p className="text-xs text-zinc-500">Profil bilgilerinizi güncellemek için destek ekibiyle iletişime geçin.</p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Support Modal */}
      {
        showSupportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E1F20] rounded-2xl w-full max-w-md border border-zinc-700 shadow-2xl">
              <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Yardım & Destek</h2>
                <button onClick={() => setShowSupportModal(false)} className="text-zinc-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <a href="/faq" className="block p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-medium text-white">Sıkça Sorulan Sorular</h3>
                        <p className="text-xs text-zinc-400">Yaygın soruların cevapları</p>
                      </div>
                    </div>
                  </a>
                  <a href="mailto:destek@finbot.com.tr" className="block p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <h3 className="font-medium text-white">E-posta Desteği</h3>
                        <p className="text-xs text-zinc-400">destek@finbot.com.tr</p>
                      </div>
                    </div>
                  </a>
                  <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                    <p className="text-sm text-emerald-400 font-medium">💡 Ortalama yanıt süresi: 24 saat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}