// PATH: backend/src/controllers/portfolioController.js
import Portfolio from "../models/Portfolio.js";

/* =========================================
   1. KULLANICININ PORTFÖYÜNÜ GETİR
   ========================================= */
export const getPortfolio = async (req, res) => {
  try {
    // Sadece giriş yapan kullanıcının hisselerini bul
    const items = await Portfolio.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Portföy getirilemedi.", error: error.message });
  }
};

/* =========================================
   2. PORTFÖYE HİSSE EKLE (veya Güncelle)
   ========================================= */
export const addAsset = async (req, res) => {
  try {
    const { ticker, quantity, avgCost } = req.body;

    // Basit validasyon
    if (!ticker || !quantity || !avgCost) {
      return res.status(400).json({ message: "Lütfen tüm alanları doldurun." });
    }

    // Kullanıcının portföyünde bu hisse zaten var mı?
    let asset = await Portfolio.findOne({ user: req.user._id, ticker: ticker.toUpperCase() });

    if (asset) {
      // VARSA: Üzerine ekle (Ağırlıklı Ortalama Maliyet Hesabı)
      const totalCost = (asset.avgCost * asset.quantity) + (Number(avgCost) * Number(quantity));
      const totalQty = asset.quantity + Number(quantity);
      
      asset.avgCost = totalCost / totalQty; // Yeni ortalama maliyet
      asset.quantity = totalQty; // Yeni adet
      
      await asset.save();
      return res.json(asset);
    } else {
      // YOKSA: Yeni kayıt oluştur
      const newAsset = await Portfolio.create({
        user: req.user._id, // 👇 Kullanıcıya bağla
        ticker: ticker.toUpperCase(),
        quantity: Number(quantity),
        avgCost: Number(avgCost),
      });
      return res.status(201).json(newAsset);
    }

  } catch (error) {
    console.error("Ekleme Hatası:", error);
    res.status(500).json({ message: "Hisse eklenemedi.", error: error.message });
  }
};

/* =========================================
   3. PORTFÖYDEN HİSSE SİL
   ========================================= */
export const deleteAsset = async (req, res) => {
  try {
    // Sadece kendi portföyündeki hisseyi silebilir
    const asset = await Portfolio.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!asset) {
      return res.status(404).json({ message: "Kayıt bulunamadı." });
    }

    res.json({ message: "Hisse portföyden silindi.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Silme işlemi başarısız.", error: error.message });
  }
};