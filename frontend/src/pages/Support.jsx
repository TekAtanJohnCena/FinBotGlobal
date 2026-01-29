// PATH: src/pages/Support.jsx
// -----------------------------------------------------------------------------

import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    EnvelopeIcon,
    ChatBubbleLeftRightIcon,
    QuestionMarkCircleIcon,
    BookOpenIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/solid";

// FAQ Data
const FAQ_DATA = [
    {
        question: "FinBot nedir?",
        answer: "FinBot, yapay zeka destekli bir finansal asistan uygulamasıdır. Hisse senedi analizleri, piyasa verileri, portföy takibi ve finansal sorularınız için gerçek zamanlı yardım sunar. OpenAI teknolojisi ile desteklenen FinBot, karmaşık finansal verileri anlaşılır bilgilere dönüştürür."
    },
    {
        question: "Paketimi nasıl yükseltirim?",
        answer: "Paketinizi yükseltmek için Fiyatlandırma sayfasına gidin ve istediğiniz planı seçin. Free planınız varsa Plus veya Pro'ya, Plus planınız varsa Pro'ya geçiş yapabilirsiniz. Ödeme güvenli bir şekilde kredi kartı ile gerçekleştirilir ve yeni özellikleriniz anında aktif olur."
    },
    {
        question: "Ödeme güvenli mi?",
        answer: "Evet, tüm ödemeleriniz SSL şifrelemesi ile korunur. Kredi kartı bilgileriniz PCI-DSS standartlarına uygun şekilde işlenir ve sunucularımızda saklanmaz. Güvenliğiniz bizim için en önemli önceliktir."
    },
    {
        question: "Günlük sorgu limitim ne zaman yenilenir?",
        answer: "Günlük sorgu haklarınız her gün UTC 00:00'da (Türkiye saati ile 03:00) yenilenir. Free kullanıcılar 5, Plus kullanıcılar 50, Pro kullanıcılar ise sınırsız sorgu hakkına sahiptir."
    },
    {
        question: "Aboneliğimi nasıl iptal ederim?",
        answer: "Aboneliğinizi iptal etmek için destek ekibimizle iletişime geçebilirsiniz. İptal işlemi sonrasında mevcut dönem bitimine kadar premium özelliklerinizi kullanmaya devam edebilirsiniz. Otomatik yenileme kapatıldığında hesabınız Free plana döner."
    }
];

// Accordion Item Component
const AccordionItem = ({ question, answer, isOpen, onToggle }) => {
    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
                <span className="font-medium text-white pr-4">{question}</span>
                <span className={`shrink-0 p-1 rounded-lg transition-all duration-300 ${isOpen ? 'bg-emerald-500/20 text-emerald-400 rotate-180' : 'bg-zinc-800 text-zinc-400'}`}>
                    <ChevronDownIcon className="w-5 h-5" />
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-5 pb-4 text-zinc-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                    {answer}
                </div>
            </div>
        </div>
    );
};

export default function Support() {
    const { user } = useContext(AuthContext);
    const [openIndex, setOpenIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [contactForm, setContactForm] = useState({ subject: "", message: "" });

    const filteredFAQ = FAQ_DATA.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContactSubmit = (e) => {
        e.preventDefault();
        console.log("Contact Form Submitted:", contactForm);
        alert("Mesajınız gönderildi! En kısa sürede size dönüş yapacağız.");
        setContactForm({ subject: "", message: "" });
    };

    return (
        <div className="min-h-screen bg-[#0b0c0f] text-white">
            {/* Background Gradient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">

                {/* Back Button */}
                <Link
                    to="/chat"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors mb-8 group"
                >
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Sohbete Dön
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 mb-6">
                        <QuestionMarkCircleIcon className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Nasıl yardımcı olabiliriz?
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        Sorularınızın cevaplarını aşağıda bulabilir veya doğrudan bize ulaşabilirsiniz.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Sorularınızı arayın..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-5 py-4 pl-12 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* FAQ Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <BookOpenIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-semibold">Sıkça Sorulan Sorular</h2>
                        </div>

                        <div className="space-y-3">
                            {filteredFAQ.length > 0 ? (
                                filteredFAQ.map((item, index) => (
                                    <AccordionItem
                                        key={index}
                                        question={item.question}
                                        answer={item.answer}
                                        isOpen={openIndex === index}
                                        onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12 text-zinc-500">
                                    <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>"{searchQuery}" için sonuç bulunamadı.</p>
                                    <p className="text-sm mt-2">Farklı anahtar kelimeler deneyin veya bize ulaşın.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Quick Contact Card */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-500/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                    <EnvelopeIcon className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-white">Bize Ulaşın</h3>
                            </div>

                            <p className="text-zinc-400 text-sm mb-4">
                                Sorularınız için destek ekibimize 7/24 ulaşabilirsiniz.
                            </p>

                            <div className="bg-black/30 rounded-xl px-4 py-3 mb-4">
                                <p className="text-xs text-zinc-500 mb-1">E-posta</p>
                                <p className="text-emerald-400 font-medium">support@finbot.com.tr</p>
                            </div>

                            <a
                                href="mailto:support@finbot.com.tr"
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
                            >
                                <EnvelopeIcon className="w-5 h-5" />
                                Mail Gönder
                            </a>

                            <p className="text-xs text-zinc-500 mt-4 text-center">
                                Ortalama yanıt süresi: 24 saat
                            </p>
                        </div>

                        {/* Contact Form */}
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-zinc-800">
                                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-zinc-400" />
                                </div>
                                <h3 className="font-semibold text-white">Mesaj Gönderin</h3>
                            </div>

                            <form onSubmit={handleContactSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-2">Konu</label>
                                    <input
                                        type="text"
                                        value={contactForm.subject}
                                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                        placeholder="Konu başlığı"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-500 mb-2">Mesajınız</label>
                                    <textarea
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        placeholder="Mesajınızı yazın..."
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 text-sm resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-all text-sm"
                                >
                                    Gönder
                                </button>
                            </form>
                        </div>

                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-zinc-500 text-sm">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        Destek ekibimiz aktif
                    </div>
                </div>

            </div>
        </div>
    );
}
