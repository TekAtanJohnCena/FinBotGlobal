import api from "../lib/api";

// ✅ Kullanıcının portföyünü getir
export async function getPortfolio(userId) {
  const res = await api.get(`/portfolio/${userId}`);
  return res.data;
}

// ✅ Kullanıcının portföy özetini (fiyat + K/Z) getir
export async function getPortfolioSummary(userId) {
  const res = await api.get(`/portfolio/${userId}/summary`);
  return res.data;
}

// ✅ Hisse ekle/güncelle
export async function addToPortfolio(userId, { ticker, shares, avgPrice }) {
  const res = await api.post(`/portfolio/${userId}/add`, { ticker, shares, avgPrice });
  return res.data;
}

// ✅ Hisseyi portföyden çıkar
export async function removeFromPortfolio(userId, ticker) {
  const res = await api.delete(`/portfolio/${userId}/remove/${ticker}`);
  return res.data;
}
