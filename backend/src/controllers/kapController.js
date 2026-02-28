// PATH: backend/src/controllers/kapController.js
import "dotenv/config";
import "dotenv/config";
// import { OpenAI } from "openai"; // REMOVED
import { fetchKapNews } from "../services/kapScraperService.js";
import { createChatCompletion } from "../services/bedrockService.js";

// OpenAI Client - Switched to Bedrock (Claude 3.5 Sonnet)
const openai = {
  chat: {
    completions: {
      create: createChatCompletion
    }
  }
};

/**
 * KAP haberlerini getirir
 * RSS kaynağından son haberleri çeker.
 */
export async function getKapNews(req, res) {
  try {

    // Scraper servisinden haberleri çek
    const news = await fetchKapNews();

    if (!news || !Array.isArray(news) || news.length === 0) {
      console.warn('⚠️ Hiç haber çekilemedi');
      return res.status(200).json([]);
    }

    res.json(news);
  } catch (error) {
    console.error("❌ Get KAP News Error:", error.message);
    console.error("Error details:", error);
    res.status(500).json({
      error: "Haberler getirilemedi",
      details: error.message
    });
  }
}

/**
 * Analyzes KAP news sentiment and generates stock impact prediction
 * GÜNCELLENDİ: FinBot "Güvenli & Analitik" Standartları
 * Bu fonksiyon, spekülatif fiyat tahminleri yerine temel analiz ve finansal etki mekanizmasına odaklanır.
 */
export async function analyzeKapNews(req, res) {
  try {
    const { title, summary, ticker } = req.body;

    // Validasyon
    if (!title || !summary) {
      return res.status(400).json({
        error: "title ve summary alanları zorunludur"
      });
    }

    // --- SYSTEM PROMPT (CTO & CMO ONAYLI) ---
    // Modelin spekülasyon yapmasını engelleyen ve temel analize zorlayan kurallar.
    const systemPrompt = `Sen FinBot'sun, bireysel yatırımcılar için karmaşık verileri sadeleştiren uzman bir AI Finansal Asistanısın.

TEMEL PRENSİPLER VE GÜVENLİK KURALLARI:
1. SPEKÜLASYON YASAK: Asla "%5 artar", "Tavan yapar", "Hisse uçacak" gibi fiyat tahminleri veya yatırım tavsiyesi verme.
2. ODAK NOKTASI: Fiyat hareketi yerine, haberin "bilanço", "nakit akışı", "satışlar" ve "operasyonel süreçler" üzerindeki etkisini analiz et.
3. PROFESYONEL TON: Objektif, veri odaklı ve eğitici ol. Yatırımcıyı heyecanlandırmak yerine bilgilendir.
4. ANALİTİK DERİNLİK: "Olumlu" deyip geçme; "Neden olumlu?" sorusunu finansal terimlerle (FAVÖK, Ciro, Özkaynak, Borçluluk vb.) açıkla.

Yanıtını sadece valid bir JSON objesi olarak ver.`;

    // Token tasarrufu için metin kısaltma
    const shortSummary = summary.substring(0, 300);
    const shortTitle = title.substring(0, 150);

    // --- USER PROMPT ---
    // Yeni 'prediction' tanımı ile modelin çıktısı yönlendiriliyor.
    const userPrompt = `KAP Haberi Analizi:

Başlık: ${shortTitle}
Özet: ${shortSummary}
Ticker: ${ticker || 'Belirtilmemiş'}

Bu haberi analiz et ve aşağıdaki JSON şemasına tam uyarak yanıt ver:

{
  "sentiment": "Olumlu|Olumsuz|Nötr",
  "score": 1-10 (1=Kritik Risk, 10=Büyük Fırsat, 5=Etkisiz/Nötr),
  "prediction": "Haberin şirketin finansal sağlığı veya piyasa algısı üzerindeki MUHTEMEL ETKİ MEKANİZMASINI analiz et. Sayısal fiyat tahmini yapma. Bunun yerine: 'Operasyonel marjları destekleyebilir', 'Borçluluk yapısını rahatlatabilir' veya 'Satış hacmine pozitif katkı sunabilir' gibi finansal neden-sonuç ilişkisi kur. Maksimum 150 karakter."
}`;

    // OpenAI Çağrısı
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2, // Düşük sıcaklık = Daha az halüsinasyon, daha tutarlı analiz.
      max_tokens: 250,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    // Yanıtı İşleme ve Hata Yakalama
    let analysis;
    try {
      const content = completion.choices?.[0]?.message?.content?.trim() || "{}";
      analysis = JSON.parse(content);

      // Eksik alan kontrolü
      if (!analysis.sentiment || !analysis.score || !analysis.prediction) {
        throw new Error("Eksik analiz sonucu");
      }

      // Sentiment normalizasyonu (Büyük/küçük harf veya İngilizce gelirse diye)
      const sentimentMap = {
        "olumlu": "Olumlu",
        "olumsuz": "Olumsuz",
        "nötr": "Nötr",
        "positive": "Olumlu",
        "negative": "Olumsuz",
        "neutral": "Nötr"
      };

      const normalizedSentiment = sentimentMap[analysis.sentiment.toLowerCase()] || analysis.sentiment;

      // Skor normalizasyonu (1-10 arası)
      const score = Math.max(1, Math.min(10, parseInt(analysis.score) || 5));

      // Prediction temizliği
      const prediction = analysis.prediction.substring(0, 200).trim();

      analysis = {
        sentiment: normalizedSentiment,
        score: score,
        prediction: prediction
      };

    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Fallback: Analiz başarısız olursa güvenli bir varsayılan döndür.
      analysis = {
        sentiment: "Nötr",
        score: 5,
        prediction: "Haberin finansal tablolara etkisi şu aşamada belirsiz, detaylı bilanço takibi önerilir."
      };
    }

    res.json(analysis);

  } catch (error) {
    console.error("KAP Analysis Error:", error);
    res.status(500).json({
      error: "Analiz sırasında bir hata oluştu",
      details: error.message
    });
  }
}