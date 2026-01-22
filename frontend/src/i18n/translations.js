// Multi-language support for Finbot
// Languages: Turkish (TR), English (EN), Arabic (AR)

export const translations = {
  tr: {
    // Navbar
    nav: {
      home: "Ana Sayfa",
      features: "Özellikler",
      pricing: "Fiyatlandırma",
      faq: "S.S.S.",
      contact: "İletişim",
      download: "İndir"
    },

    // Hero Section
    hero: {
      title: "Wall Street Artık",
      titleAccent: "Türkçe Konuşuyor",
      titleEnd: "",
      subtitle: "Apple, Tesla, Nvidia... Hangi ABD hissesini neden alman gerektiğini FinBot'a sor. Dolar bazlı kazan, enflasyondan korun.",
      startButton: "Finbot'u Başlat 🚀",
      tryFreeButton: "🚀 Ücretsiz Analize Başla",
      viewPlansButton: "📊 Paketleri Gör",
      bullet1: "NASDAQ, NYSE, S&P 500 kapsam",
      bullet2: "Dolar bazlı getiri takibi",
      bullet3: "10-K/10-Q raporları Türkçe"
    },

    // Features
    features: {
      title: "Özellikler",
      feature1Title: "10-K ve 10-Q Raporlarını Saniyeler İçinde Özetle",
      feature1Desc: "ABD şirketlerinin yıllık ve çeyreklik finansal raporlarını Türkçe analiz et.",
      feature1Item1: "SEC dosyaları otomatik analiz",
      feature1Item2: "EPS, P/E, ROE gibi metrikleri Türkçe açıklama",
      feature1Item3: "Bilanço, gelir tablosu, nakit akışı",

      feature2Title: "NASDAQ ve NYSE Verileri Artık Cebinde",
      feature2Desc: "Gerçek zamanlı ABD piyasa verileri ve fiyat takibi.",
      feature2Item1: "15dk gecikmeli veri (Free)",
      feature2Item2: "Canlı veri (Pro)",
      feature2Item3: "Tarihsel fiyat grafikleri",

      feature3Title: "Dolar Bazlı Getiri",
      feature3Desc: "Paranı dolarla büyüt, enflasyondan korun.",
      feature3Item1: "USD bazlı portföy takibi",
      feature3Item2: "Kâr/zarar hesaplama",
      feature3Item3: "Temettü verimi (Dividend Yield)",

      feature4Title: "Kazanç Açıklamaları ve Temettü Uyarıları",
      feature4Desc: "Önemli ABD piyasa olaylarından haberdar ol.",
      feature4Item1: "Earnings season uyarıları",
      feature4Item2: "Temettü ödeme tarihleri",
      feature4Item3: "Analyst ratings değişiklikleri"
    },

    // Mobile App Page
    app: {
      title: "Finbot Mobil",
      subtitle: "Her Yerden Akıllı Finans",
      description: "Finbot artık cebinizde! iOS ve Android cihazlarınızda BIST hisselerini analiz edin, portföyünüzü takip edin ve anlık bildirimler alın.",
      downloadNow: "Şimdi İndir",
      comingSoon: "Çok Yakında",
      availableOn: "Şurada Mevcut:",
      appStore: "App Store",
      playStore: "Google Play",

      feature1: "Mobil Optimizasyon",
      feature1Desc: "Dokunmatik kontrollerle optimize edilmiş arayüz",
      feature2: "Anlık Bildirimler",
      feature2Desc: "Önemli değişiklikler için push bildirimleri",
      feature3: "Offline Mod",
      feature3Desc: "İnternetsiz ortamlarda veri görüntüleme",
      feature4: "Biyometrik Güvenlik",
      feature4Desc: "Face ID ve parmak izi ile güvenli giriş",

      mockTitle: "Finbot Mobil • Portfolyo",
      questionExample: "\"Apple'ın son performansını göster\"",
      trendChart: "Trend Grafiği",
      highlights: "Öne Çıkan Noktalar",
      aiSummary: "AI Özeti",
      comparison: "Bilanço Karşılaştırma"
    },

    // Contact
    contact: {
      title: "Konuşalım",
      description: "Ekipleriniz için kurumsal paket ve entegrasyonları değerlendirelim.",
      feature1: "KVKK uyumlu altyapı",
      feature2: "Özel model & veri entegrasyonu",
      feature3: "7/24 öncelikli destek",
      email: "destek@finbot.com.tr",
      viewPlans: "Planları İncele",
      namePlaceholder: "Ad Soyad",
      emailPlaceholder: "E-posta",
      messagePlaceholder: "Mesajınız",
      sendButton: "Gönder",
      sending: "Gönderiliyor…",
      successTitle: "Mesaj alındı!",
      successMessage: "En kısa sürede size e-posta ile dönüş yapacağız.",
      responseTime: "1 iş günü"
    },

    // Hero MockWindow
    mockWindow: {
      title: "Finbot AI • Wall Street Analizi",
      questionLabel: "Soru",
      questionExample: "\"Teknoloji sektöründeki AAPL ve MSFT hisselerinin son çeyrek bilançolarını karşılaştırır mısın?\"",
      trendChart: "Trend Grafiği",
      highlights: "Öne Çıkan Noktalar",
      aiSummary: "AI Özeti",
      comparison: "Şirket Karşılaştırma"
    },

    // Pricing
    pricing: {
      title: "Paketler",
      subtitle: "Wall Street'e profesyonel erişim için esnek seçenekler.",
      monthly: "Aylık",
      yearly: "Yıllık",
      yearlyDiscount: "%20 indirim",
      perMonth: "/ay",
      perYear: "/yıl",
      monthlyEquivalent: "Aylık eşdeğer",
      contactUs: "İletişime Geçin",
      contactSubtitle: "Kurumsal çözümler için",
      tagline: "ABD piyasaları • Türkçe yapay zekâ desteği",

      free: {
        badge: "Başlangıç",
        title: "Free",
        subtitle: "Piyasaları öğrenmek isteyenler için.",
        cta: "Hemen Dene",
        features: [
          "Günlük 5 Yapay Zeka Sorusu",
          "Temel Şirket Profilleri",
          "Son 1 Yıllık Geçmiş Veri",
          "15dk Gecikmeli Veri",
          "Sınırlı Haber Erişimi"
        ]
      },

      plus: {
        badge: "Yatırımcı",
        badgePopular: "En Popüler",
        title: "Plus",
        subtitle: "Bilinçli kararlar almak isteyenler için.",
        cta: "Plus'a Yükselt",
        features: [
          "Günlük 50 Yapay Zeka Sorusu",
          "Son 10 Yıllık Geçmiş Veri (Derin Analiz)",
          "Sınırsız Şirket Karnesi (Özetler)",
          "Portföy Entegrasyonu & Kâr/Zarar",
          "Reklamsız Deneyim"
        ]
      },

      pro: {
        badge: "Profesyonel",
        title: "Pro",
        subtitle: "Traderlar ve veri odaklı uzmanlar için.",
        cta: "Pro Avantajını Seç",
        features: [
          "Sınırsız Yapay Zeka Sorusu (Wall Street Modu)",
          "Son 20+ Yıllık Geçmiş Veri (Tam Arşiv)",
          "Canlı Veri (Real-Time) Akışı",
          "Detaylı Teknik İndikatörler",
          "Öncelikli Destek Hattı"
        ]
      },

      enterprise: {
        badge: "Kurumsal",
        title: "Enterprise",
        subtitle: "Fintech girişimleri ve Fonlar için özel çözümler.",
        cta: "İş Birliği Yapalım",
        features: [
          "FinBot API Erişimi (Veri ve AI)",
          "Özel SLA ve Sunucu Desteği",
          "Çoklu Kullanıcı Yönetimi",
          "White-Label (Kendi markanızla kullanım)",
          "Kuruma Özel AI Eğitimi"
        ]
      }
    },

    // FAQ
    faq: {
      title: "Sıkça Sorulan Sorular",
      items: [
        {
          q: "FinBot nedir?",
          a: "FinBot, ABD Borsaları (Nasdaq, NYSE) hisseleri başta olmak üzere finansal verileri anlık olarak analiz eden, kullanıcıya anlaşılır şekilde sunan yapay zekâ destekli bir finans asistanıdır. Temel analiz, teknik analiz, bilanço yorumlama ve şirket karşılaştırma gibi işlemleri saniyeler içinde yapar."
        },
        {
          q: "FinBot hangi verileri kullanıyor?",
          a: "FinBot, ABD'nin resmi veri kaynakları, kamuya açık finansal raporlar, SEC bildirimleri ve güvenilir piyasa veri sağlayıcılarından gelen anlık fiyat verilerini kullanır. Veriler düzenli olarak güncellenir ve doğruluk kontrolünden geçirilir."
        },
        {
          q: "FinBot'un analizleri ne kadar güvenilir?",
          a: "FinBot, finansal verileri objektif kriterlere göre analiz eder ve herhangi bir yatırım tavsiyesi vermez. Karar mekanizmasında kullanıcıya destek olur, ancak nihai yatırım kararı size aittir."
        },
        {
          q: "FinBot'u kullanmak için finans bilgim olması gerekiyor mu?",
          a: "Hayır. FinBot, hem finans konusunda deneyimli yatırımcılara hem de yeni başlayanlara uygun olarak tasarlandı. Karmaşık verileri sade, anlaşılır ve görselleştirilmiş bir şekilde sunar."
        },
        {
          q: "Hangi cihazlardan FinBot'a erişebilirim?",
          a: "FinBot'a web tarayıcınız üzerinden masaüstü veya mobil cihazlardan erişebilirsiniz. Çok yakında iOS ve Android uygulamaları da devreye alınacak."
        },
        {
          q: "FinBot gerçek zamanlı mı çalışıyor?",
          a: "Evet. Piyasa açıkken anlık fiyat ve veri güncellemeleri alırsınız. Piyasa kapalıyken de geçmiş veriler üzerinden analiz yapabilirsiniz."
        },
        {
          q: "FinBot hangi analizleri yapabiliyor?",
          a: "Temel analiz (bilanço, gelir tablosu, oran analizi), Teknik analiz (grafik, indikatör, trend tespiti), Şirket karşılaştırmaları, Sürdürülebilirlik skorlaması, Özel raporlar ve uyarı sistemi"
        },
        {
          q: "FinBot ücretli mi?",
          a: "Lansman döneminde belirli özellikler ücretsiz olacak. İleri seviye analiz, gerçek zamanlı alarm ve kişiselleştirilmiş raporlar için premium paketler sunulacak."
        },
        {
          q: "FinBot yatırım tavsiyesi veriyor mu?",
          a: "Hayır. FinBot yalnızca veri analizi ve yorumlama desteği sağlar. Kararlarınızı etkileyecek nihai adım size aittir."
        },
        {
          q: "FinBot'un verilerimle ne yapıyor?",
          a: "FinBot, KVKK ve GDPR uyumlu çalışır. Verileriniz üçüncü kişilerle paylaşılmaz ve yalnızca hizmet kalitesini artırmak amacıyla kullanılır."
        }
      ]
    },

    // Footer
    footer: {
      description: "Wall Street'e Türkçe erişim sağlayan yapay zekâ destekli finans asistanı. ABD hisselerini hızla anlamanıza, karşılaştırmanıza ve dolar bazlı yatırım yapmanıza yardım eder.",
      quickLinks: "Hızlı Linkler",
      home: "Ana Sayfa",
      packages: "Paketler",
      features: "Özellikler",
      contact: "İletişim",
      legal: "Hukuk",
      kvkk: "KVKK Aydınlatma Metni",
      privacy: "Gizlilik Politikası",
      cookies: "Çerez Politikası",
      terms: "Kullanım Şartları",
      social: "Sosyal",
      copyright: "© {year} FinBot — Tüm hakları saklıdır.",
      kvkkShort: "KVKK",
      privacyShort: "Gizlilik",
      cookiesShort: "Çerez",
      termsShort: "Şartlar"
    }
  },

  en: {
    // Navbar
    nav: {
      home: "Home",
      features: "Features",
      pricing: "Pricing",
      faq: "FAQ",
      contact: "Contact",
      download: "Download"
    },

    // Hero Section
    hero: {
      title: "US Market-Focused",
      titleAccent: "AI-Powered",
      titleEnd: "Financial Assistant",
      subtitle: "Finbot helps you understand companies from Dow Jones to S&P 500 in minutes: compare balance sheets, visualize metrics, get clear explanations.",
      startButton: "Launch Finbot 🚀",
      tryFreeButton: "🚀 Try Free",
      viewPlansButton: "📊 View Plans",
      bullet1: "Dow Jones → S&P 500 coverage",
      bullet2: "Comparative tables & charts",
      bullet3: "Smart summaries"
    },

    // Features
    features: {
      title: "Features",
      feature1Title: "US Market Data",
      feature1Desc: "Financials and metrics normalized for US market.",
      feature1Item1: "Standardized items",
      feature1Item2: "Source & timestamp visible",
      feature1Item3: "Transparency with revision notes",

      feature2Title: "Smart Q&A & Summaries",
      feature2Desc: "Ask in natural language; get clear, reliable answers.",
      feature2Item1: "Brief / Detailed explanation modes",
      feature2Item2: "Summary + note flow",
      feature2Item3: "Copy / share report (Pro)",

      feature3Title: "Comparison & Charts",
      feature3Desc: "View quarters side by side; track trends with charts.",
      feature3Item1: "Last 10 quarters view (Plus+)",
      feature3Item2: "Trend and ratio views",
      feature3Item3: "Cross-company comparison templates",

      feature4Title: "Portfolio & Alerts",
      feature4Desc: "Set up watchlists; get notified of important changes.",
      feature4Item1: "Notes and tags",
      feature4Item2: "Financial event/announcement alerts",
      feature4Item3: "Export (Pro/Enterprise)"
    },

    // Mobile App Page
    app: {
      title: "Finbot Mobile",
      subtitle: "Smart Finance Everywhere",
      description: "Finbot is now in your pocket! Analyze US stocks, track your portfolio, and receive instant notifications on your iOS and Android devices.",
      downloadNow: "Download Now",
      comingSoon: "Coming Soon",
      availableOn: "Available On:",
      appStore: "App Store",
      playStore: "Google Play",

      feature1: "Mobile Optimization",
      feature1Desc: "Interface optimized for touch controls",
      feature2: "Instant Notifications",
      feature2Desc: "Push notifications for important changes",
      feature3: "Offline Mode",
      feature3Desc: "View data in offline environments",
      feature4: "Biometric Security",
      feature4Desc: "Secure login with Face ID and fingerprint",

      mockTitle: "Finbot Mobile • Portfolio",
      questionExample: "\"Show Apple's recent performance\"",
      trendChart: "Trend Chart",
      highlights: "Highlights",
      aiSummary: "AI Summary",
      comparison: "Balance Sheet Comparison"
    },

    // Contact
    contact: {
      title: "Let's Talk",
      description: "Let's discuss enterprise packages and integrations for your teams.",
      feature1: "GDPR compliant infrastructure",
      feature2: "Custom model & data integration",
      feature3: "24/7 priority support",
      email: "support@finbot.com.tr",
      viewPlans: "View Plans",
      namePlaceholder: "Full Name",
      emailPlaceholder: "Email",
      messagePlaceholder: "Your Message",
      sendButton: "Send",
      sending: "Sending…",
      successTitle: "Message received!",
      successMessage: "We will get back to you via email as soon as possible.",
      responseTime: "1 business day"
    },

    // Hero MockWindow
    mockWindow: {
      title: "Finbot AI • Chat & Visualization",
      questionLabel: "Question",
      questionExample: "\"Can you briefly summarize ASELS's performance based on the last 5 quarterly balance sheets?\"",
      trendChart: "Trend Chart",
      highlights: "Highlights",
      aiSummary: "AI Summary",
      comparison: "Balance Sheet Comparison"
    },

    // Pricing
    pricing: {
      title: "Packages",
      subtitle: "Flexible options for your investment style.",
      monthly: "Monthly",
      yearly: "Yearly",
      yearlyDiscount: "40% off",
      perMonth: "/mo",
      perYear: "/yr",
      monthlyEquivalent: "Monthly equivalent",
      contactUs: "Contact Us",
      contactSubtitle: "Contact us for enterprise quote",
      tagline: "US Market-focused • AI-powered assistance",

      free: {
        badge: "Starter",
        title: "Freemium",
        subtitle: "Curious Investor",
        cta: "Try Now",
        features: [
          "Daily 3 Smart Query Rights",
          "Access to All US Stocks",
          "Quick Comparison (e.g.: THYAO vs PGSUS)",
          "Last 5 Quarters Balance Sheet Analysis",
          "Basic AI Summary"
        ]
      },

      plus: {
        badge: "Price/Performance",
        title: "Plus",
        subtitle: "Informed & Active Investor",
        cta: "Upgrade to Plus",
        features: [
          "Daily 50 Queries (Uninterrupted Analysis)",
          "Portfolio Integration & Risk Analysis",
          "Last 12 Quarters (3 Years) Historical Data",
          "Detailed Charts & Trend Analysis",
          "AI Investor Assistant"
        ]
      },

      pro: {
        badge: "Professional",
        badgePopular: "Popular",
        title: "Pro",
        subtitle: "In-Depth Analysis & Strategy",
        cta: "Choose Pro Advantage",
        features: [
          "Unlimited Query Freedom",
          "Full Depth: Last 25 Quarters (6 Years)",
          "Positive/Negative Future Scenarios",
          "Sectoral 'Deep-Dive' Comparison",
          "Excel/PDF Reporting",
          "Dividend & Bonus Share Forecasts"
        ]
      },

      enterprise: {
        badge: "Enterprise",
        title: "Enterprise",
        subtitle: "Brokerage Firms & Funds",
        cta: "Let's Collaborate",
        features: [
          "Custom White-Label Solution for Your Clients",
          "Brokerage Application Integration",
          "Raw Data & Analysis Access via API",
          "Multi-User Management",
          "Custom SLA and Support Line"
        ]
      }
    },

    // FAQ
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          q: "What is FinBot?",
          a: "FinBot is an AI-powered financial assistant that analyzes financial data, especially US Market (Nasdaq, NYSE) stocks, in real-time and presents it to users in an understandable way. It performs fundamental analysis, technical analysis, balance sheet interpretation, and company comparisons in seconds."
        },
        {
          q: "What data does FinBot use?",
          a: "FinBot uses US official data sources, publicly available financial reports, SEC disclosures, and real-time price data from reliable market data providers. Data is regularly updated and verified for accuracy."
        },
        {
          q: "How reliable are FinBot's analyses?",
          a: "FinBot analyzes financial data according to objective criteria and does not provide any investment advice. It supports users in their decision-making process, but the final investment decision is yours."
        },
        {
          q: "Do I need financial knowledge to use FinBot?",
          a: "No. FinBot is designed for both experienced investors and beginners. It presents complex data in a simple, understandable, and visualized way."
        },
        {
          q: "From which devices can I access FinBot?",
          a: "You can access FinBot from desktop or mobile devices through your web browser. iOS and Android applications will be available very soon."
        },
        {
          q: "Does FinBot work in real-time?",
          a: "Yes. You receive instant price and data updates when the market is open. You can also analyze historical data when the market is closed."
        },
        {
          q: "What analyses can FinBot perform?",
          a: "Fundamental analysis (balance sheet, income statement, ratio analysis), Technical analysis (charts, indicators, trend detection), Company comparisons, Sustainability scoring, Custom reports and alert system"
        },
        {
          q: "Is FinBot paid?",
          a: "Certain features will be free during the launch period. Premium packages will be offered for advanced analysis, real-time alerts, and personalized reports."
        },
        {
          q: "Does FinBot provide investment advice?",
          a: "No. FinBot only provides data analysis and interpretation support. The final step that will affect your decisions is yours."
        },
        {
          q: "What does FinBot do with my data?",
          a: "FinBot operates in compliance with KVKK and GDPR. Your data is not shared with third parties and is only used to improve service quality."
        }
      ]
    },

    // Footer
    footer: {
      description: "BIST-focused AI-powered financial assistant. Helps you quickly understand, compare companies, and get clear summaries.",
      quickLinks: "Quick Links",
      home: "Home",
      packages: "Packages",
      features: "Features",
      contact: "Contact",
      legal: "Legal",
      kvkk: "KVKK Disclosure",
      privacy: "Privacy Policy",
      cookies: "Cookie Policy",
      terms: "Terms of Use",
      social: "Social",
      copyright: "© {year} FinBot — All rights reserved.",
      kvkkShort: "KVKK",
      privacyShort: "Privacy",
      cookiesShort: "Cookies",
      termsShort: "Terms"
    }
  },

  ar: {
    // Navbar
    nav: {
      home: "الرئيسية",
      features: "المميزات",
      pricing: "الأسعار",
      faq: "الأسئلة الشائعة",
      contact: "اتصل بنا",
      download: "تحميل"
    },

    // Hero Section
    hero: {
      title: "مساعد مالي",
      titleAccent: "بالذكاء الاصطناعي",
      titleEnd: "يركز على BIST",
      subtitle: "يساعدك Finbot على فهم الشركات من BIST 30 إلى BIST 500 في دقائق: قارن الميزانيات العمومية، تصور المقاييس، واحصل على تفسيرات واضحة.",
      startButton: "🚀 ابدأ Finbot",
      tryFreeButton: "🚀 جرب مجاناً",
      viewPlansButton: "📊 عرض الخطط",
      bullet1: "تغطية BIST 30 → BIST 500",
      bullet2: "جداول ورسوم بيانية مقارنة",
      bullet3: "ملخصات ذكية"
    },

    // Features
    features: {
      title: "المميزات",
      feature1Title: "بيانات متوافقة مع BIST",
      feature1Desc: "البيانات المالية والمقاييس المعايرة للسوق التركي.",
      feature1Item1: "عناصر موحدة",
      feature1Item2: "المصدر والطابع الزمني مرئيان",
      feature1Item3: "الشفافية مع ملاحظات المراجعة",

      feature2Title: "أسئلة ذكية وملخصات",
      feature2Desc: "اسأل بلغة طبيعية؛ احصل على إجابات واضحة وموثوقة.",
      feature2Item1: "أوضاع شرح موجزة / مفصلة",
      feature2Item2: "ملخص + تدفق الملاحظات",
      feature2Item3: "نسخ / مشاركة التقرير (Pro)",

      feature3Title: "المقارنة والرسوم البيانية",
      feature3Desc: "عرض الأرباع جنباً إلى جنب؛ تتبع الاتجاهات بالرسوم البيانية.",
      feature3Item1: "عرض آخر 10 أرباع (Plus+)",
      feature3Item2: "عروض الاتجاه والنسبة",
      feature3Item3: "قوالب المقارنة بين الشركات",

      feature4Title: "المحفظة والتنبيهات",
      feature4Desc: "قم بإعداد قوائم المراقبة؛ احصل على إشعارات للتغييرات المهمة.",
      feature4Item1: "ملاحظات وعلامات",
      feature4Item2: "تنبيهات الأحداث المالية / الإعلانات",
      feature4Item3: "التصدير (Pro/Enterprise)"
    },

    // Mobile App Page
    app: {
      title: "Finbot للجوال",
      subtitle: "تمويل ذكي في كل مكان",
      description: "Finbot الآن في جيبك! قم بتحليل أسهم BIST، تتبع محفظتك، واستقبل الإشعارات الفورية على أجهزة iOS و Android.",
      downloadNow: "تحميل الآن",
      comingSoon: "قريباً",
      availableOn: "متوفر على:",
      appStore: "App Store",
      playStore: "Google Play",

      feature1: "التحسين للجوال",
      feature1Desc: "واجهة محسّنة لعناصر التحكم باللمس",
      feature2: "إشعارات فورية",
      feature2Desc: "إشعارات فورية للتغييرات المهمة",
      feature3: "وضع عدم الاتصال",
      feature3Desc: "عرض البيانات في بيئات غير متصلة",
      feature4: "أمان بيومتري",
      feature4Desc: "تسجيل دخول آمن بواسطة Face ID وبصمة الإصبع",

      mockTitle: "Finbot للجوال • المحفظة",
      questionExample: "\"أظهر أداء Apple الأخير\"",
      trendChart: "مخطط الاتجاه",
      highlights: "النقاط البارزة",
      aiSummary: "ملخص الذكاء الاصطناعي",
      comparison: "مقارنة الميزانية العمومية"
    },

    // Contact
    contact: {
      title: "لنتحدث",
      description: "لنناقش حزم المؤسسات والتكاملات لفرقك.",
      feature1: "بنية تحتية متوافقة مع GDPR",
      feature2: "نموذج مخصص وتكامل البيانات",
      feature3: "دعم ذو أولوية 24/7",
      email: "support@finbot.com.tr",
      viewPlans: "عرض الخطط",
      namePlaceholder: "الاسم الكامل",
      emailPlaceholder: "البريد الإلكتروني",
      messagePlaceholder: "رسالتك",
      sendButton: "إرسال",
      sending: "جارٍ الإرسال…",
      successTitle: "تم استلام الرسالة!",
      successMessage: "سنعود إليك عبر البريد الإلكتروني في أقرب وقت ممكن.",
      responseTime: "يوم عمل واحد"
    },

    // Hero MockWindow
    mockWindow: {
      title: "Finbot AI • الدردشة والتصور",
      questionLabel: "سؤال",
      questionExample: "\"هل يمكنك تلخيص أداء ASELS بإيجاز بناءً على آخر 5 ميزانيات ربع سنوية؟\"",
      trendChart: "مخطط الاتجاه",
      highlights: "النقاط البارزة",
      aiSummary: "ملخص الذكاء الاصطناعي",
      comparison: "مقارنة الميزانية العمومية"
    },

    // Pricing
    pricing: {
      title: "الباقات",
      subtitle: "خيارات مرنة لأسلوب استثمارك.",
      monthly: "شهري",
      yearly: "سنوي",
      yearlyDiscount: "خصم 40%",
      perMonth: "/شهر",
      perYear: "/سنة",
      monthlyEquivalent: "المعادل الشهري",
      contactUs: "اتصل بنا",
      contactSubtitle: "اتصل بنا للحصول على عرض أسعار المؤسسات",
      tagline: "يركز على BIST • مساعدة بالذكاء الاصطناعي",

      free: {
        badge: "البداية",
        title: "Freemium",
        subtitle: "مستثمر فضولي",
        cta: "جرب الآن",
        features: [
          "3 حقوق استعلام ذكية يومية",
          "الوصول إلى جميع أسهم BIST",
          "مقارنة سريعة (مثل: THYAO vs PGSUS)",
          "تحليل الميزانية العمومية لآخر 5 أرباع",
          "ملخص الذكاء الاصطناعي الأساسي"
        ]
      },

      plus: {
        badge: "السعر/الأداء",
        title: "Plus",
        subtitle: "مستثمر مطلع ونشط",
        cta: "الترقية إلى Plus",
        features: [
          "50 استعلامًا يوميًا (تحليل متواصل)",
          "تكامل المحفظة وتحليل المخاطر",
          "بيانات تاريخية لآخر 12 ربعًا (3 سنوات)",
          "رسوم بيانية مفصلة وتحليل الاتجاهات",
          "مساعد المستثمر بالذكاء الاصطناعي"
        ]
      },

      pro: {
        badge: "احترافي",
        badgePopular: "شائع",
        title: "Pro",
        subtitle: "تحليل متعمق واستراتيجية",
        cta: "اختر ميزة Pro",
        features: [
          "حرية استعلام غير محدودة",
          "العمق الكامل: آخر 25 ربعًا (6 سنوات)",
          "سيناريوهات مستقبلية إيجابية/سلبية",
          "مقارنة قطاعية متعمقة",
          "تقارير Excel/PDF",
          "توقعات الأرباح والأسهم المجانية"
        ]
      },

      enterprise: {
        badge: "المؤسسات",
        title: "Enterprise",
        subtitle: "شركات الوساطة والصناديق",
        cta: "لنتعاون",
        features: [
          "حل مخصص بعلامة بيضاء لعملائك",
          "تكامل تطبيق الوساطة",
          "الوصول إلى البيانات الخام والتحليل عبر API",
          "إدارة متعددة المستخدمين",
          "SLA مخصص وخط دعم"
        ]
      }
    },

    // FAQ
    faq: {
      title: "الأسئلة الشائعة",
      items: [
        {
          q: "ما هو FinBot؟",
          a: "FinBot هو مساعد مالي مدعوم بالذكاء الاصطناعي يحلل البيانات المالية، وخاصة أسهم بورصة إسطنبول (BIST)، في الوقت الفعلي ويقدمها للمستخدمين بطريقة مفهومة. يقوم بإجراء التحليل الأساسي والتحليل الفني وتفسير الميزانية العمومية ومقارنات الشركات في ثوانٍ."
        },
        {
          q: "ما البيانات التي يستخدمها FinBot؟",
          a: "يستخدم FinBot مصادر البيانات الرسمية لـ BIST والتقارير المالية المتاحة للجمهور وإفصاحات KAP وبيانات الأسعار في الوقت الفعلي من مزودي بيانات السوق الموثوقين. يتم تحديث البيانات بانتظام والتحقق من دقتها."
        },
        {
          q: "ما مدى موثوقية تحليلات FinBot؟",
          a: "يحلل FinBot البيانات المالية وفقًا لمعايير موضوعية ولا يقدم أي نصيحة استثمارية. إنه يدعم المستخدمين في عملية اتخاذ القرار، لكن قرار الاستثمار النهائي يعود لك."
        },
        {
          q: "هل أحتاج إلى معرفة مالية لاستخدام FinBot؟",
          a: "لا. تم تصميم FinBot لكل من المستثمرين ذوي الخبرة والمبتدئين. يقدم البيانات المعقدة بطريقة بسيطة ومفهومة ومرئية."
        },
        {
          q: "من أي أجهزة يمكنني الوصول إلى FinBot؟",
          a: "يمكنك الوصول إلى FinBot من أجهزة سطح المكتب أو الأجهزة المحمولة من خلال متصفح الويب الخاص بك. ستتوفر تطبيقات iOS و Android قريبًا جدًا."
        },
        {
          q: "هل يعمل FinBot في الوقت الفعلي؟",
          a: "نعم. تتلقى تحديثات فورية للأسعار والبيانات عندما يكون السوق مفتوحًا. يمكنك أيضًا تحليل البيانات التاريخية عندما يكون السوق مغلقًا."
        },
        {
          q: "ما التحليلات التي يمكن لـ FinBot إجراؤها؟",
          a: "التحليل الأساسي (الميزانية العمومية، بيان الدخل، تحليل النسب)، التحليل الفني (الرسوم البيانية، المؤشرات، اكتشاف الاتجاه)، مقارنات الشركات، تسجيل الاستدامة، التقارير المخصصة ونظام التنبيه"
        },
        {
          q: "هل FinBot مدفوع؟",
          a: "ستكون ميزات معينة مجانية خلال فترة الإطلاق. سيتم تقديم باقات مميزة للتحليل المتقدم والتنبيهات في الوقت الفعلي والتقارير المخصصة."
        },
        {
          q: "هل يقدم FinBot نصائح استثمارية؟",
          a: "لا. يوفر FinBot فقط دعم تحليل البيانات والتفسير. الخطوة النهائية التي ستؤثر على قراراتك هي لك."
        },
        {
          q: "ماذا يفعل FinBot ببياناتي؟",
          a: "يعمل FinBot بما يتوافق مع KVKK و GDPR. لا تتم مشاركة بياناتك مع أطراف ثالثة ويتم استخدامها فقط لتحسين جودة الخدمة."
        }
      ]
    },

    // Footer
    footer: {
      description: "مساعد مالي مدعوم بالذكاء الاصطناعي يركز على BIST. يساعدك على فهم الشركات بسرعة ومقارنتها والحصول على ملخصات واضحة.",
      quickLinks: "روابط سريعة",
      home: "الرئيسية",
      packages: "الباقات",
      features: "المميزات",
      contact: "اتصل بنا",
      legal: "قانوني",
      kvkk: "إفصاح KVKK",
      privacy: "سياسة الخصوصية",
      cookies: "سياسة ملفات تعريف الارتباط",
      terms: "شروط الاستخدام",
      social: "اجتماعي",
      copyright: "© {year} FinBot — جميع الحقوق محفوظة.",
      kvkkShort: "KVKK",
      privacyShort: "الخصوصية",
      cookiesShort: "ملفات تعريف الارتباط",
      termsShort: "الشروط"
    }
  }
};

export const getTranslation = (language, key) => {
  const keys = key.split('.');
  let value = translations[language];

  for (const k of keys) {
    if (value && k in value) {  // Changed from value[k] to k in value
      value = value[k];
    } else {
      // Fallback to Turkish if translation not found
      value = translations.tr;
      for (const fallbackKey of keys) {
        if (value && fallbackKey in value) {  // Changed from value[fallbackKey] to fallbackKey in value
          value = value[fallbackKey];
        }
      }
      break;
    }
  }

  return value !== undefined ? value : key;  // Changed from value || key to handle empty strings
};
