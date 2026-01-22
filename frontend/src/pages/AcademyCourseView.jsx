import React, { useState, useMemo } from 'react';
import {
    Play,
    BookOpen,
    Trophy,
    ChevronRight,
    CheckCircle2
} from 'lucide-react';

// --- VERİ MODELİ: DERSLER (Sadece TEMEL ANALİZ - 15 Ders) ---
const LESSON_DATA = [
    {
        id: 1,
        title: "Borsa Nedir? Yatırımın Temel Mantığı",
        duration: "4:58",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-1.mp4",
        notes: "Borsa, şirketlere ortak olmak ve uzun vadeli değerden pay almak için kullanılan yasal bir pazar yeridir. Yatırımın temel mantığı, Temel Analiz ile bir hisseyi ucuzken bulmaktır."
    },
    {
        id: 2,
        title: "Temel Kavramlar: Hisse, Lot ve Temettü Nedir?",
        duration: "6:06",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-2.mp4",
        notes: "Hisse senedi, şirketin en küçük ortaklık payıdır. Bir lot, 1 adet hisseye eşittir. Piyasa fiyatı arz-talep ile belirlenirken, Temettü ise şirketin kârından dağıtılan paydır."
    },
    {
        id: 3,
        title: "F/K Oranı: Hisse Ucuz mu, Pahalı mı?",
        duration: "5:57",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-3.mp4",
        notes: "Fiyat/Kazanç (F/K) oranı, piyasa fiyatının hisse başına kazanca bölünmesiyle bulunur ve hissenin kendini kaç yılda amorti ettiğini gösterir. Düşük F/K, ucuzluk işaretidir. Sektörel kıyaslama şarttır."
    },
    {
        id: 4,
        title: "PD/DD Oranı: Defter Değerine Göre Hisse Fiyatı",
        duration: "6:54",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-4.mp4",
        notes: "PD/DD (Piyasa Değeri/Defter Değeri), varlığa dayalı şirketler için kritik öneme sahiptir. PD/DD'nin 1'in altında olması, hissenin defter değerinden ucuza satıldığı anlamına gelebilir."
    },
    {
        id: 5,
        title: "Bilanço: Varlıklar ve Borçlar (Temel Okuma)",
        duration: "6:22",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-5.mp4",
        notes: "Bilanço, şirketin finansal fotoğrafıdır: Varlıklar = Yükümlülükler + Özkaynaklar. Likidite, borçluluk ve özkaynak büyümesi bu tabloda analiz edilir."
    },
    {
        id: 6,
        title: "Gelir Tablosu: Kârı Bulma Yolu ve Marj Analizi",
        duration: "6:47",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-6.mp4",
        notes: "Gelir Tablosu, şirketin dönemsel performansını gösterir. Satışlar, Brüt Kâr, Faaliyet Kârı ve Net Kâr akışını takip ederek operasyonel verimlilik analiz edilir."
    },
    {
        id: 7,
        title: "Özkaynak Karlılığı (ROE): Yönetim Verimliliği",
        duration: "6:04",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-7.mp4",
        notes: "ROE, Net Kâr'ın Özkaynaklar'a bölünmesidir. Yönetimin, hissedar parasını ne kadar kâr üreterek kullandığını gösteren en güçlü verimlilik göstergesidir."
    },
    {
        id: 8,
        title: "Likidite Oranları: Cari Oran ve Kısa Vade Ödeme Gücü",
        duration: "5:47",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-8.mp4",
        notes: "Likidite, şirketin kısa vadeli borçlarını dönen varlıklarla ödeme yeteneğini ölçer. Cari Oran (ideal 1.5-2) ve Asit Testi Oranı temel göstergelerdir."
    },
    {
        id: 9,
        title: "Borçluluk Oranları: Finansal Kaldıraç ve Risk",
        duration: "6:39",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-9.mp4",
        notes: "Finansal Kaldıraç Oranı, varlıkların borçla finanse edilme derecesini ölçer (ideal %50 altı). Yüksek borçluluk, kaldıraç etkisiyle kârlılığı artırsa da kriz riskini yükseltir."
    },
    {
        id: 10,
        title: "Temettü Verimi ve Politikaları: Büyüme mi, Gelir mi?",
        duration: "4:40",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-10.mp4",
        notes: "Temettü, kârın hissedarlara dağıtılmasıdır. Büyüme odaklı şirketler kârı yatırıma ayırırken, İstikrar odaklı şirketler düzenli temettü öder."
    },
    {
        id: 11,
        title: "Makro Analize Giriş: Enflasyon, Faiz ve Döviz Kuru Etkisi",
        duration: "7:00",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-11.mp4",
        notes: "Makro analiz, ekonomik koşulları inceler. Yüksek faiz ve enflasyon, maliyetleri artırır. GSYH ve döviz kuru takibi, Türkiye piyasaları için hayati önem taşır."
    },
    {
        id: 12,
        title: "Sektör Analizi: Çarpan Kıyaslamaları ve Risk",
        duration: "5:15",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-12.mp4",
        notes: "Sektör analizi, F/K ve Likidite gibi verilerin sektör ortalamasına göre ne ifade ettiğini anlamamızı sağlar. Şirketler, sektörlerinin risk ve büyüme beklentilerine göre farklı çarpan ortalamalarına sahiptir."
    },
    {
        id: 13,
        title: "Firmanın Yaşam Döngüsü: Büyüme, Olgunluk ve F/K İlişkisi",
        duration: "8:10",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-13.mp4",
        notes: "Şirketler Büyüme ve Olgunluk aşamalarından geçer. Büyüme şirketleri yüksek F/K ile fiyatlanırken, Olgunluk şirketleri daha stabil kâr ve düşük F/K ile fiyatlanır."
    },
    {
        id: 14,
        title: "Yatırımcının En Büyük 3 Hatası: Duygusallık ve Çeşitlendirme",
        duration: "6:28",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-14.mp4",
        notes: "Yatırımcılar sıkça duygusal tepkilerle işlem yapar. Bu yüzden her işlemde Stop-Loss ve Kâr Alma limitleri belirlenmelidir. Risk, farklı sektör ve büyüklükteki şirketlerle çeşitlendirilmelidir."
    },
    {
        id: 15,
        title: "MODÜL SONU: Temel Analiz Kontrol Listesi (5 Adımda Karar)",
        duration: "6:01",
        completed: false,
        module: "Temel Analiz",
        videoUrl: "/videos/temel-15.mp4",
        notes: "Nihai Kontrol Listesi: 1. Değer Kıyaslaması, 2. Risk Seviyesi, 3. Kârlılık ve Verimlilik, 4. Büyüme, 5. Makro ve Sektör Uyumu. Rasyonel karar alımı için bu 5 adımı tamamlayın."
    },
];

// --- FAKE CONFETTI ---
const ConfettiOverlay = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
        {[...Array(20)].map((_, i) => (
            <div
                key={i}
                className="confetti-piece"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    backgroundColor: ['#00cc99', '#3b82f6', '#facc15'][Math.floor(Math.random() * 3)],
                    animationDelay: `${Math.random() * 2}s`,
                }}
            />
        ))}
    </div>
);


const AcademyCourseView = () => {
    const [lessons, setLessons] = useState(LESSON_DATA);
    const [currentLessonId, setCurrentLessonId] = useState(1);
    const [tab, setTab] = useState('notes'); // notes | curriculum | certificate
    const [showConfetti, setShowConfetti] = useState(false);
    const [certificateForm, setCertificateForm] = useState({ name: '', email: '' });

    const currentLesson = lessons.find(l => l.id === currentLessonId) || lessons[0];
    const completedCount = lessons.filter(l => l.completed).length;
    const totalLessons = lessons.length;
    const completionPercentage = Math.round((completedCount / totalLessons) * 100);

    const modules = useMemo(() => {
        const moduleMap = {};
        lessons.forEach(lesson => {
            if (!moduleMap[lesson.module]) {
                moduleMap[lesson.module] = [];
            }
            moduleMap[lesson.module].push(lesson);
        });
        return moduleMap;
    }, [lessons]);

    const handleLessonClick = (id) => {
        setCurrentLessonId(id);
        if (window.innerWidth < 768) {
            setTab('notes');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNextLesson = () => {
        setLessons(prevLessons => prevLessons.map(l =>
            l.id === currentLessonId ? { ...l, completed: true } : l
        ));

        const nextId = currentLessonId + 1;
        if (nextId <= totalLessons) {
            setCurrentLessonId(nextId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            if (completedCount + 1 === totalLessons) {
                setShowConfetti(true);
                setTab('certificate');
                setTimeout(() => setShowConfetti(false), 3000);
            }
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (certificateForm.name && certificateForm.email) {
            alert(`Sertifika talebi alındı: ${certificateForm.name}. %10 indirim kuponunuz e-posta ile gönderilecektir.`);
            setCertificateForm({ name: '', email: '' });
        }
    };

    return (
        <div className="min-h-full bg-[#0f1218] text-zinc-200 font-sans">
            {showConfetti && <ConfettiOverlay />}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 md:p-6 items-start">

                {/* --- INTERNAL COL 1: Lesson List (Desktop Only) --- */}
                <aside className="hidden md:block md:col-span-1 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar border border-zinc-800/50 rounded-2xl bg-[#121316]">
                    <div className="p-6 border-b border-zinc-800">
                        <div className="flex items-center mb-6">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tight text-white">Akademi</span>
                                <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Hisse Senedi Analiz</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-zinc-500 font-bold uppercase">İlerleme</span>
                                <span className="text-sm font-bold text-emerald-400">%{completionPercentage}</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-1">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-500 text-right">{completedCount}/{totalLessons} Ders Kesinleşti</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        {Object.entries(modules).map(([moduleTitle, moduleLessons]) => (
                            <div key={moduleTitle}>
                                <div className="px-6 py-3 bg-zinc-900/40 border-y border-zinc-800/50 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{moduleTitle}</span>
                                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">{moduleLessons.length} Ders</span>
                                </div>
                                <div className="divide-y divide-zinc-800/30">
                                    {moduleLessons.map((lesson) => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleLessonClick(lesson.id)}
                                            className={`w-full text-left p-4 transition-all duration-200 flex gap-3 group
                                                ${currentLesson.id === lesson.id
                                                    ? 'bg-purple-500/10 border-l-2 border-purple-500'
                                                    : 'hover:bg-zinc-800/40 border-l-2 border-transparent'}`}
                                        >
                                            <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                                ${lesson.completed ? 'bg-emerald-500/20' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                                                {lesson.completed ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <Play className={`h-3.5 w-3.5 ${currentLesson.id === lesson.id ? 'text-purple-400 fill-purple-400' : 'text-zinc-500'}`} />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-sm font-semibold leading-snug mb-0.5 truncate
                                                    ${currentLesson.id === lesson.id ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                                    {lesson.title}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-mono">{lesson.duration}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* --- INTERNAL COL 2: Video & Details --- */}
                <main className="md:col-span-3 flex flex-col min-w-0">
                    {/* 1. VIDEO PLAYER (Sticky Top on Mobile) */}
                    <div className="sticky top-0 z-10 md:relative bg-black aspect-video w-full overflow-hidden md:rounded-2xl shadow-2xl border border-zinc-800/50">
                        <video
                            key={currentLesson.videoUrl}
                            controls
                            className="w-full h-full object-cover"
                            poster="/images/video-poster.jpg"
                        >
                            <source src={currentLesson.videoUrl} type="video/mp4" />
                            Tarayıcınız video etiketini desteklemiyor.
                        </video>
                    </div>

                    {/* 2. NEXT LESSON ACTION (Right Aligned below video) */}
                    <div className="flex justify-end mt-3 px-2 md:px-0">
                        <button
                            onClick={handleNextLesson}
                            disabled={currentLesson.completed && currentLesson.id !== totalLessons}
                            className={`group px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xl flex items-center gap-2 active:scale-95
                                ${currentLesson.completed && currentLesson.id !== totalLessons
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}`}
                        >
                            <span>{currentLesson.id === totalLessons ? 'Eğitimi Tamamla' : 'Sonraki Ders'}</span>
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    </div>

                    {/* Course Info & Tabs */}
                    <div className="p-4 md:p-0 md:mt-6">
                        <h2 className="text-xl md:text-3xl font-bold text-white leading-tight mb-2">
                            {currentLesson.title}
                        </h2>

                        {/* Mobile Progress Bar */}
                        <div className="md:hidden mt-4 mb-6">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">İlerleme: %{completionPercentage}</span>
                                <span className="text-[10px] text-zinc-500 font-medium">{completedCount}/{totalLessons}</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/30">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Interaction Tabs */}
                        <div className="flex border-b border-zinc-800 mb-6 md:mb-8 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setTab('notes')}
                                className={`flex flex-col items-center py-3 px-6 text-sm font-semibold transition-all relative whitespace-nowrap
                                    ${tab === 'notes' ? 'text-white' : 'text-zinc-500'}`}>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span>Ders İçeriği</span>
                                </div>
                                {tab === 'notes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full shadow-[0_-2px_6px_rgba(168,85,247,0.4)]" />}
                            </button>

                            {/* Müfredat Tab (ONLY on mobile) */}
                            <button
                                onClick={() => setTab('curriculum')}
                                className={`flex flex-col items-center py-3 px-6 text-sm font-semibold transition-all relative whitespace-nowrap md:hidden
                                    ${tab === 'curriculum' ? 'text-white' : 'text-zinc-500'}`}>
                                <div className="flex items-center gap-2">
                                    <Play className="h-4 w-4 fill-current" />
                                    <span>Müfredat</span>
                                </div>
                                {tab === 'curriculum' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full shadow-[0_-2px_6px_rgba(168,85,247,0.4)]" />}
                            </button>

                            <button
                                onClick={() => setTab('certificate')}
                                className={`flex flex-col items-center py-3 px-6 text-sm font-semibold transition-all relative whitespace-nowrap
                                    ${tab === 'certificate' ? 'text-white' : 'text-zinc-500'}`}>
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4" />
                                    <span>Sertifika</span>
                                </div>
                                {tab === 'certificate' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full shadow-[0_-2px_6px_rgba(168,85,247,0.4)]" />}
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[300px]">
                            {tab === 'notes' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Eğitmen Notları</span>
                                    </div>
                                    <p className="text-zinc-400 leading-relaxed text-sm md:text-base mb-8 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                        {currentLesson.notes}
                                    </p>
                                </div>
                            )}

                            {tab === 'curriculum' && (
                                <div className="md:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {Object.entries(modules).map(([moduleTitle, moduleLessons]) => (
                                        <div key={moduleTitle} className="mb-6">
                                            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">{moduleTitle}</h3>
                                            <div className="space-y-2.5">
                                                {moduleLessons.map((lesson) => (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => handleLessonClick(lesson.id)}
                                                        className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all border
                                                            ${currentLesson.id === lesson.id
                                                                ? 'bg-purple-500/10 border-purple-500/30'
                                                                : 'bg-zinc-900/40 border-zinc-800/50'}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                                                            ${lesson.completed ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                                                            {lesson.completed ? (
                                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                            ) : (
                                                                <Play className={`h-4 w-4 ${currentLesson.id === lesson.id ? 'text-purple-400 fill-purple-400' : 'text-zinc-500'}`} />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-start min-w-0 flex-1">
                                                            <span className={`text-sm font-semibold text-left leading-tight mb-1 line-clamp-1
                                                                ${currentLesson.id === lesson.id ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                                                {lesson.title}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500 font-medium font-mono">
                                                                {lesson.duration}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {tab === 'certificate' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {completionPercentage < 100 ? (
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-10 text-center">
                                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                                                <Trophy className="h-8 w-8 text-zinc-600" />
                                            </div>
                                            <h4 className="text-xl font-bold text-white mb-2">Henüz Hazır Değilsiniz</h4>
                                            <p className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto">Sertifika kazanmak için tüm dersleri tamamlamanız gerekiyor. Başarılar!</p>
                                            <button
                                                onClick={() => {
                                                    if (window.innerWidth < 768) setTab('curriculum');
                                                }}
                                                className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-colors border border-zinc-700/50">
                                                Derslere Geri Dön
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-3xl p-10 text-center relative overflow-hidden backdrop-blur-md">
                                            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">TEBRİKLER!</h3>
                                            <p className="text-emerald-400 font-bold mb-8 uppercase tracking-widest text-sm">KURS BAŞARIYLA TAMAMLANDI</p>

                                            <form onSubmit={handleFormSubmit} className="max-w-sm mx-auto text-left space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">AD SOYAD</label>
                                                    <input
                                                        type="text"
                                                        value={certificateForm.name}
                                                        onChange={(e) => setCertificateForm({ ...certificateForm, name: e.target.value })}
                                                        required
                                                        placeholder="Sertifikadaki isim"
                                                        className="w-full px-5 py-4 rounded-2xl bg-zinc-900/90 text-white border border-zinc-800 focus:border-emerald-500/50 focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-POSTA</label>
                                                    <input
                                                        type="email"
                                                        value={certificateForm.email}
                                                        onChange={(e) => setCertificateForm({ ...certificateForm, email: e.target.value })}
                                                        required
                                                        placeholder="İndirim kuponu için"
                                                        className="w-full px-5 py-4 rounded-2xl bg-zinc-900/90 text-white border border-zinc-800 focus:border-emerald-500/50 focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                                >
                                                    Ödülümü Al
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AcademyCourseView;
