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
      title: "Finansal Kararlarınızda",
      titleAccent: "Yapay Zeka",
      titleEnd: "Finans Asistanı",
      subtitle: "Borsa analizi, bilanço yorumlama ve portföy optimizasyonu ile hisse senedi önerileri artık tek bir platformda.",
      startButton: "Analize Başla 📊",
      tryFreeButton: "📊 Ücretsiz Deneyin",
      viewPlansButton: "📋 Paketleri Gör",
      bullet1: "NASDAQ, NYSE, S&P 500 veri kapsamı",
      bullet2: "Teknik ve Temel Analiz",
      bullet3: "Otomatik Portföy Optimizasyonu"
    },

    // Features
    features: {
      title: "Yapay Zeka Destekli Borsa Analizi",
      feature1Title: "Temel Analiz",
      feature1Desc: "Şirketlerin finansal sağlık durumunu detaylı keşfet.",
      feature1Item1: "Gelir Tablosu ve Bilanço",
      feature1Item2: "Rasyo Analizleri",
      feature1Item3: "Sektör İçi Skorlama",

      feature2Title: "Bilanço Karşılaştırma",
      feature2Desc: "Rakip şirketleri yan yana getirerek güçlü ve zayıf yönlerini görün.",
      feature2Item1: "Çeyreklik/Yıllık Kıyas",
      feature2Item2: "Görsel Grafik Destekli",
      feature2Item3: "Büyüme Trendleri",

      feature3Title: "Yapay Zeka ile Portföy Optimizasyonu",
      feature3Desc: "Risk profilinize uygun, en ideal yatırım dağılımını bulun.",
      feature3Item1: "Kişiselleştirilmiş Strateji",
      feature3Item2: "Risk/Getiri Analizi",
      feature3Item3: "Otomatik Öneriler",

      feature4Title: "Banka Ekstresi ile Kişisel Finans Analizi",
      feature4Desc: "Banka ekstrenizi yükleyerek harcama alışkanlıklarınızı yapay zekaya yorumlatın.",
      feature4Item1: "Otomatik Kategori Kırılımı",
      feature4Item2: "Akıllı Bütçe Planlama",
      feature4Item3: "Alışkanlık Tespiti"
    },

    // Mobile App Page
    app: {
      title: "Finbot Mobil",
      subtitle: "Her Yerden Akıllı Finans",
      description: "Finbot artık cebinizde! iOS ve Android cihazlarınızda ABD hisselerini analiz edin, portföyünüzü takip edin ve anlık bildirimler alın.",
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
          "Yapay Zeka Soruları",
          "Temel Şirket Profilleri",
          "Sınırlı Geçmiş Veri",
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
          "4x Daha Fazla Yapay Zeka Sorusu",
          "10 Yıllık Geçmiş Veri (Derin Analiz)",
          "Sınırsız Temel Analiz Raporları",
          "Portföy Entegrasyonu & Kâr/Zarar"
        ]
      },

      pro: {
        badge: "Profesyonel",
        title: "Pro",
        subtitle: "Traderlar ve veri odaklı uzmanlar için.",
        cta: "Pro Avantajını Seç",
        features: [
          "10x Daha Fazla Yapay Zeka Sorusu",
          "20+ Yıllık Geçmiş Veri (Tam Arşiv)",
          "Canlı Veri (Real-Time) Akışı",
          "Detaylı Temel Analiz İndikatörleri",
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
          a: "FinBot, ABD Borsaları (Nasdaq, NYSE) hisseleri başta olmak üzere finansal verileri anlık olarak analiz eden, kullanıcıya anlaşılır şekilde sunan yapay zekâ destekli bir finans asistanıdır. Temel analiz, bilanço yorumlama, oran analizi ve şirket karşılaştırma gibi işlemleri saniyeler içinde yapar."
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
          a: "Temel analiz (bilanço, gelir tablosu, oran analizi, finansal sağlık değerlendirmesi), Şirket karşılaştırmaları, Sektör analizleri, Sürdürülebilirlik skorlaması, Özel raporlar ve fiyat uyarı sistemi"
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
      description: "Yapay zekâ destekli finansal veri analiz ve raporlama asistanı. ABD piyasalarındaki şirketlerin finansal verilerini incelemenize, teknik göstergelerini analiz etmenize ve raporlarını Türkçe anlamanıza yardımcı olur.",
      quickLinks: "Hızlı Linkler",
      home: "Ana Sayfa",
      packages: "Paketler",
      features: "Özellikler",
      contact: "İletişim",
      legal: "Yasal",
      kvkk: "KVKK Aydınlatma Metni",
      privacy: "Gizlilik Politikası",
      cookies: "Çerez Politikası",
      terms: "Kullanım Koşulları",
      distanceSales: "Mesafeli Satış Sözleşmesi",
      refundPolicy: "İptal ve İade Koşulları",
      social: "Sosyal Medya",
      copyright: "© {year} FinBot — Tüm hakları saklıdır.",
      kvkkShort: "KVKK",
      privacyShort: "Gizlilik",
      cookiesShort: "Çerez",
      termsShort: "Koşullar",
      // Company Info
      companyInfo: "Firma Bilgileri",
      companyName: "Emre Ercan - FinBot Yazılım ve Danışmanlık",
      companyAddress: "Adnan Kahveci Mah. Ayfer Sok. No:15, Beylikdüzü / İstanbul",
      taxOffice: "Vergi Dairesi: Büyükçekmece V.D.",
      // Payment & Security
      paymentSecurity: "Güvenli Ödeme",
      sslStatement: "Tüm ödemeler 256-bit SSL sertifikası ile şifrelenmiş Shopier altyapısı üzerinden güvenle gerçekleşmektedir.",
      // Legal Disclaimer
      disclaimer: "Burada yer alan bilgi, yorum ve tavsiyeler yatırım danışmanlığı kapsamında değildir. Sitemizde sunulan veriler sadece eğitim ve analiz amaçlıdır. FinBot, kullanıcıların bu verilerle yapacağı işlemlerden sorumlu tutulamaz."
    },

    // Authentication
    auth: {
      // Login
      loginTitle: "Tekrar Hoş Geldiniz",
      loginSubtitle: "Hesabınıza giriş yapın ve analize başlayın.",
      email: "E-posta",
      emailPlaceholder: "ornek@finbot.com",
      password: "Şifre",
      passwordPlaceholder: "••••••••",
      rememberMe: "Beni Hatırla",
      forgotPassword: "Şifremi Unuttum",
      loginButton: "Giriş Yap",
      loggingIn: "Giriş yapılıyor...",
      orContinueWith: "veya",
      googleLogin: "Google ile Giriş Yap",
      noAccount: "Hesabınız yok mu?",
      signUp: "Kayıt Ol",

      // Register
      registerTitle: "Aramıza Katılın",
      registerSubtitle: "Finansal analizlerinizi bir üst seviyeye taşıyın.",
      firstName: "Ad",
      firstNamePlaceholder: "Adınız",
      lastName: "Soyad",
      lastNamePlaceholder: "Soyadınız",
      phone: "Telefon",
      phonePlaceholder: "5XX XXX XX XX",
      birthDate: "Doğum Tarihi",
      username: "Kullanıcı Adı",
      usernamePlaceholder: "kullanici_adi",
      usernameHint: "Harf, rakam ve alt çizgi kullanın",
      passwordHint: "En az 6 karakter",
      termsAcceptance: "Kabul ediyorum",
      termsOfService: "Kullanıcı Sözleşmesi",
      and: "ve",
      privacyPolicy: "Gizlilik Politikası",
      registerButton: "Kayıt Ol",
      registering: "Kayıt yapılıyor...",
      googleRegister: "Google ile Kayıt Ol",
      haveAccount: "Zaten hesabınız var mı?",
      signIn: "Giriş Yap",

      // Validation Messages
      fillAllFields: "Lütfen tüm zorunlu alanları doldurunuz.",
      validEmail: "Geçerli bir e-posta adresi giriniz.",
      validPhone: "Geçerli bir telefon numarası giriniz.",
      ageRequirement: "18 yaşından büyük olmalısınız.",
      passwordLength: "Şifre en az 6 karakter olmalıdır.",
      usernameLength: "Kullanıcı adı en az 3 karakter olmalıdır.",
      acceptTerms: "Devam etmek için Kullanıcı Sözleşmesi ve Gizlilik Politikası'nı kabul etmelisiniz.",
      registerSuccess: "Kayıt başarılı! Şimdi giriş yapabilirsiniz.",
      registerFailed: "Kayıt başarısız! Lütfen bilgilerinizi kontrol edin.",
      googleSuccess: "Google ile kayıt başarılı! 🚀",
      googleFailed: "Google kaydı sırasında bir hata oluştu."
    },

    // Navigation (Sidebar)
    sidebar: {
      finbot: "FinBot",
      portfolio: "Portföy",
      wallet: "Cüzdan",
      market: "Piyasa",
      academy: "Akademi",
      screener: "Tarama",
      kap: "KAP",
      settings: "Ayarlar",
      logout: "Çıkış Yap",
      profile: "Profil",
      support: "Destek"
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
      title: "Wall Street Now",
      titleAccent: "Speaks Your Language",
      titleEnd: "",
      subtitle: "Apple, Tesla, Nvidia... Ask FinBot why you should buy which US stock. Earn in dollars, protect against inflation.",
      startButton: "Launch Finbot 🚀",
      tryFreeButton: "🚀 Start Free Analysis",
      viewPlansButton: "📊 View Packages",
      bullet1: "NASDAQ, NYSE, S&P 500 coverage",
      bullet2: "Dollar-based return tracking",
      bullet3: "10-K/10-Q reports in plain language"
    },

    // Features
    features: {
      title: "Features",
      feature1Title: "Summarize 10-K and 10-Q Reports in Seconds",
      feature1Desc: "Analyze annual and quarterly financial reports of US companies.",
      feature1Item1: "Automatic SEC filings analysis",
      feature1Item2: "EPS, P/E, ROE metrics explained clearly",
      feature1Item3: "Balance sheet, income statement, cash flow",

      feature2Title: "NASDAQ and NYSE Data in Your Pocket",
      feature2Desc: "Real-time US market data and price tracking.",
      feature2Item1: "15-min delayed data (Free)",
      feature2Item2: "Live data (Pro)",
      feature2Item3: "Historical price charts",

      feature3Title: "Dollar-Based Returns",
      feature3Desc: "Grow your money in dollars, protect against inflation.",
      feature3Item1: "USD-based portfolio tracking",
      feature3Item2: "Profit/loss calculation",
      feature3Item3: "Dividend Yield tracking",

      feature4Title: "Earnings Announcements and Dividend Alerts",
      feature4Desc: "Stay informed about important US market events.",
      feature4Item1: "Earnings season alerts",
      feature4Item2: "Dividend payment dates",
      feature4Item3: "Analyst ratings changes"
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
      email: "destek@finbot.com.tr",
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
      title: "Finbot AI • Wall Street Analysis",
      questionLabel: "Question",
      questionExample: "\"Can you compare the last quarter balance sheets of AAPL and MSFT in the technology sector?\"",
      trendChart: "Trend Chart",
      highlights: "Highlights",
      aiSummary: "AI Summary",
      comparison: "Company Comparison"
    },

    // Pricing
    pricing: {
      title: "Packages",
      subtitle: "Flexible options for professional access to Wall Street.",
      monthly: "Monthly",
      yearly: "Yearly",
      yearlyDiscount: "20% off",
      perMonth: "/mo",
      perYear: "/yr",
      monthlyEquivalent: "Monthly equivalent",
      contactUs: "Contact Us",
      contactSubtitle: "For enterprise solutions",
      tagline: "US Markets • AI-powered support in your language",

      free: {
        badge: "Starter",
        title: "Free",
        subtitle: "For those who want to learn markets.",
        cta: "Try Now",
        features: [
          "5 Daily AI Questions",
          "Basic Company Profiles",
          "Last 1 Year Historical Data",
          "15-min Delayed Data",
          "Limited News Access"
        ]
      },

      plus: {
        badge: "Investor",
        badgePopular: "Most Popular",
        title: "Plus",
        subtitle: "For those who want to make informed decisions.",
        cta: "Upgrade to Plus",
        features: [
          "50 Daily AI Questions",
          "Last 10 Years Historical Data (Deep Analysis)",
          "Unlimited Company Report Cards (Summaries)",
          "Portfolio Integration & Profit/Loss"
        ]
      },

      pro: {
        badge: "Professional",
        title: "Pro",
        subtitle: "For traders and data-driven experts.",
        cta: "Choose Pro Advantage",
        features: [
          "Unlimited AI Questions (Wall Street Mode)",
          "20+ Years Historical Data (Full Archive)",
          "Live Data (Real-Time) Stream",
          "Detailed Technical Indicators",
          "Priority Support Line"
        ]
      },

      enterprise: {
        badge: "Enterprise",
        title: "Enterprise",
        subtitle: "Custom solutions for Fintech startups and Funds.",
        cta: "Let's Collaborate",
        features: [
          "FinBot API Access (Data and AI)",
          "Custom SLA and Server Support",
          "Multi-User Management",
          "White-Label (Use with your own brand)",
          "Custom AI Training for Your Organization"
        ]
      }
    },

    // FAQ
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          q: "What is FinBot?",
          a: "FinBot is an AI-powered financial assistant that analyzes financial data, especially US Stock Exchanges (Nasdaq, NYSE) stocks, in real-time and presents it to users in an understandable way. It performs fundamental analysis, technical analysis, balance sheet interpretation, and company comparisons in seconds."
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
      description: "AI-powered financial data analysis and reporting assistant. Helps you analyze US market companies' financial data, technical indicators, and understand reports in plain language.",
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
      distanceSales: "Distance Sales Agreement",
      refundPolicy: "Cancellation & Refund Policy",
      social: "Social Media",
      copyright: "© {year} FinBot — All rights reserved.",
      kvkkShort: "KVKK",
      privacyShort: "Privacy",
      cookiesShort: "Cookies",
      termsShort: "Terms",
      // Company Info
      companyInfo: "Company Information",
      companyName: "Emre Ercan - FinBot Software & Consulting",
      companyAddress: "Adnan Kahveci Mah. Ayfer Sok. No:15, Beylikdüzü / Istanbul",
      taxOffice: "Tax Office: Büyükçekmece",
      // Payment & Security
      paymentSecurity: "Secure Payment",
      sslStatement: "All payments are securely processed through Shopier infrastructure with 256-bit SSL encryption.",
      // Legal Disclaimer
      disclaimer: "The information, comments and recommendations contained herein do not constitute investment advice. The data provided on our site is for educational and analysis purposes only. FinBot cannot be held responsible for transactions made by users with this data."
    },

    // Authentication
    auth: {
      // Login
      loginTitle: "Welcome Back",
      loginSubtitle: "Sign in to your account and start analyzing.",
      email: "Email",
      emailPlaceholder: "example@finbot.com",
      password: "Password",
      passwordPlaceholder: "••••••••",
      rememberMe: "Remember Me",
      forgotPassword: "Forgot Password",
      loginButton: "Sign In",
      loggingIn: "Signing in...",
      orContinueWith: "or",
      googleLogin: "Sign in with Google",
      noAccount: "Don't have an account?",
      signUp: "Sign Up",

      // Register
      registerTitle: "Join Us",
      registerSubtitle: "Take your financial analysis to the next level.",
      firstName: "First Name",
      firstNamePlaceholder: "Your first name",
      lastName: "Last Name",
      lastNamePlaceholder: "Your last name",
      phone: "Phone",
      phonePlaceholder: "5XX XXX XX XX",
      birthDate: "Birth Date",
      username: "Username",
      usernamePlaceholder: "username",
      usernameHint: "Use letters, numbers and underscores",
      passwordHint: "At least 6 characters",
      termsAcceptance: "I accept the",
      termsOfService: "Terms of Service",
      and: "and",
      privacyPolicy: "Privacy Policy",
      registerButton: "Sign Up",
      registering: "Signing up...",
      googleRegister: "Sign up with Google",
      haveAccount: "Already have an account?",
      signIn: "Sign In",

      // Validation Messages
      fillAllFields: "Please fill in all required fields.",
      validEmail: "Please enter a valid email address.",
      validPhone: "Please enter a valid phone number.",
      ageRequirement: "You must be over 18 years old.",
      passwordLength: "Password must be at least 6 characters.",
      usernameLength: "Username must be at least 3 characters.",
      acceptTerms: "You must accept the Terms of Service and Privacy Policy to continue.",
      registerSuccess: "Registration successful! You can now sign in.",
      registerFailed: "Registration failed! Please check your information.",
      googleSuccess: "Successfully registered with Google! 🚀",
      googleFailed: "An error occurred during Google registration."
    },

    // Navigation (Sidebar)
    sidebar: {
      finbot: "FinBot",
      portfolio: "Portfolio",
      wallet: "Wallet",
      market: "Market",
      academy: "Academy",
      screener: "Screener",
      kap: "KAP",
      settings: "Settings",
      logout: "Logout",
      profile: "Profile",
      support: "Support"
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
      title: "وول ستريت الآن",
      titleAccent: "يتحدث لغتك",
      titleEnd: "",
      subtitle: "Apple، Tesla، Nvidia... اسأل FinBot عن الأسهم الأمريكية التي يجب شراؤها ولماذا. اربح بالدولار واحمِ نفسك من التضخم.",
      startButton: "🚀 ابدأ Finbot",
      tryFreeButton: "🚀 ابدأ التحليل المجاني",
      viewPlansButton: "📊 عرض الباقات",
      bullet1: "تغطية NASDAQ، NYSE، S&P 500",
      bullet2: "تتبع العوائد بالدولار",
      bullet3: "تقارير 10-K/10-Q بلغة واضحة"
    },

    // Features
    features: {
      title: "المميزات",
      feature1Title: "تلخيص تقارير 10-K و 10-Q في ثوانٍ",
      feature1Desc: "تحليل التقارير المالية السنوية والربع سنوية للشركات الأمريكية.",
      feature1Item1: "تحليل تلقائي لملفات SEC",
      feature1Item2: "شرح واضح لمقاييس EPS، P/E، ROE",
      feature1Item3: "الميزانية العمومية، بيان الدخل، التدفق النقدي",

      feature2Title: "بيانات NASDAQ و NYSE في جيبك",
      feature2Desc: "بيانات السوق الأمريكي في الوقت الفعلي وتتبع الأسعار.",
      feature2Item1: "بيانات متأخرة 15 دقيقة (مجاني)",
      feature2Item2: "بيانات حية (Pro)",
      feature2Item3: "رسوم بيانية للأسعار التاريخية",

      feature3Title: "عوائد بالدولار",
      feature3Desc: "نمِّ أموالك بالدولار واحمِ نفسك من التضخم.",
      feature3Item1: "تتبع المحفظة بالدولار",
      feature3Item2: "حساب الربح/الخسارة",
      feature3Item3: "تتبع عائد الأرباح",

      feature4Title: "إعلانات الأرباح وتنبيهات توزيعات الأرباح",
      feature4Desc: "ابقَ على اطلاع بأحداث السوق الأمريكي المهمة.",
      feature4Item1: "تنبيهات موسم الأرباح",
      feature4Item2: "تواريخ دفع توزيعات الأرباح",
      feature4Item3: "تغييرات تصنيفات المحللين"
    },

    // Mobile App Page
    app: {
      title: "Finbot للجوال",
      subtitle: "تمويل ذكي في كل مكان",
      description: "Finbot الآن في جيبك! قم بتحليل الأسهم الأمريكية، تتبع محفظتك، واستقبل الإشعارات الفورية على أجهزة iOS و Android.",
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
      email: "destek@finbot.com.tr",
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
      title: "Finbot AI • تحليل وول ستريت",
      questionLabel: "سؤال",
      questionExample: "\"هل يمكنك مقارنة ميزانيات الربع الأخير لـ AAPL و MSFT في قطاع التكنولوجيا؟\"",
      trendChart: "مخطط الاتجاه",
      highlights: "النقاط البارزة",
      aiSummary: "ملخص الذكاء الاصطناعي",
      comparison: "مقارنة الشركات"
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
      tagline: "يركز على الأسواق الأمريكية • مساعدة بالذكاء الاصطناعي",

      free: {
        badge: "البداية",
        title: "Freemium",
        subtitle: "مستثمر فضولي",
        cta: "جرب الآن",
        features: [
          "3 حقوق استعلام ذكية يومية",
          "الوصول إلى الأسهم الأمريكية",
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
    },

    // Authentication
    auth: {
      // Login
      loginTitle: "مرحبًا بعودتك",
      loginSubtitle: "قم بتسجيل الدخول إلى حسابك وابدأ التحليل.",
      email: "البريد الإلكتروني",
      emailPlaceholder: "example@finbot.com",
      password: "كلمة المرور",
      passwordPlaceholder: "••••••••",
      rememberMe: "تذكرني",
      forgotPassword: "نسيت كلمة المرور",
      loginButton: "تسجيل الدخول",
      loggingIn: "جارٍ تسجيل الدخول...",
      orContinueWith: "أو",
      googleLogin: "تسجيل الدخول بواسطة Google",
      noAccount: "ليس لديك حساب؟",
      signUp: "إنشاء حساب",

      // Register
      registerTitle: "انضم إلينا",
      registerSubtitle: "ارتق بتحليلك المالي إلى المستوى التالي.",
      firstName: "الاسم الأول",
      firstNamePlaceholder: "اسمك الأول",
      lastName: "اسم العائلة",
      lastNamePlaceholder: "اسم عائلتك",
      phone: "الهاتف",
      phonePlaceholder: "5XX XXX XX XX",
      birthDate: "تاريخ الميلاد",
      username: "اسم المستخدم",
      usernamePlaceholder: "اسم_المستخدم",
      usernameHint: "استخدم الحروف والأرقام والشرطة السفلية",
      passwordHint: "6 أحرف على الأقل",
      termsAcceptance: "أوافق على",
      termsOfService: "شروط الخدمة",
      and: "و",
      privacyPolicy: "سياسة الخصوصية",
      registerButton: "إنشاء حساب",
      registering: "جارٍ إنشاء الحساب...",
      googleRegister: "التسجيل بواسطة Google",
      haveAccount: "لديك حساب بالفعل؟",
      signIn: "تسجيل الدخول",

      // Validation Messages
      fillAllFields: "يرجى ملء جميع الحقول المطلوبة.",
      validEmail: "يرجى إدخال عنوان بريد إلكتروني صحيح.",
      validPhone: "يرجى إدخال رقم هاتف صحيح.",
      ageRequirement: "يجب أن تكون أكبر من 18 عامًا.",
      passwordLength: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
      usernameLength: "يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل.",
      acceptTerms: "يجب عليك قبول شروط الخدمة وسياسة الخصوصية للمتابعة.",
      registerSuccess: "تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.",
      registerFailed: "فشل التسجيل! يرجى التحقق من معلوماتك.",
      googleSuccess: "تم التسجيل بنجاح بواسطة Google! 🚀",
      googleFailed: "حدث خطأ أثناء التسجيل بواسطة Google."
    },

    // Navigation (Sidebar)
    sidebar: {
      finbot: "FinBot",
      portfolio: "المحفظة",
      wallet: "المحفظة",
      market: "السوق",
      academy: "الأكاديمية",
      screener: "الماسح",
      kap: "KAP",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      profile: "الملف الشخصي",
      support: "الدعم"
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
