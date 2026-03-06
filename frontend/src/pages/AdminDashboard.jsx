import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const AdminDashboard = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState([]);
    const [promos, setPromos] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Promo Form State
    const [promoCode, setPromoCode] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');
    const [maxUses, setMaxUses] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        const isAdmin = user?.role === 'admin' || user?.email === 'simsekfarukkemal@gmail.com' || user?.email === 'ercanemre1108@gmail.com';
        if (!user || !isAdmin) {
            navigate('/chat');
            return;
        }
        fetchData();
    }, [user, authLoading, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [metricsRes, usersRes, promosRes, transactionsRes] = await Promise.all([
                api.get('/admin/metrics'),
                api.get('/admin/users'),
                api.get('/admin/promos'),
                api.get('/admin/transactions'),
            ]);
            if (metricsRes.data.success) setMetrics(metricsRes.data.data);
            if (usersRes.data.success) setUsers(usersRes.data.data);
            if (promosRes.data.success) setPromos(promosRes.data.data);
            if (transactionsRes.data.success) setTransactions(transactionsRes.data.data);
        } catch (error) {
            console.error("Admin data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePromo = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/promos', {
                code: promoCode,
                discountPercent: Number(discountPercent),
                maxUses: maxUses ? Number(maxUses) : null,
                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
            });
            // Refresh promos
            const res = await api.get('/admin/promos');
            if (res.data.success) setPromos(res.data.data);

            // Reset form
            setPromoCode('');
            setDiscountPercent('');
            setMaxUses('');
            setExpiryDate('');
        } catch (error) {
            alert(error.response?.data?.message || 'Promosyon oluşturulurken hata oluştu.');
        }
    };

    const handleTogglePromo = async (id) => {
        try {
            await api.patch(`/admin/promos/${id}/toggle`);
            const res = await api.get('/admin/promos');
            if (res.data.success) setPromos(res.data.data);
        } catch (error) {
            alert('Promosyon durumu güncellenemedi.');
        }
    };

    const handleUpdateSubscription = async (userId, tier) => {
        const confirmMsg = tier === 'FREE'
            ? 'Kullanıcıyı FREE plana düşürmek istediğinize emin misiniz?'
            : `Kullanıcıyı ${tier} plana yükseltmek istediğinize emin misiniz?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await api.patch(`/admin/users/${userId}/subscription`, { tier });
            if (res.data.success) {
                // Update local state
                setUsers(users.map(u => u._id === userId ? { ...u, subscriptionTier: tier, subscriptionStatus: tier === 'FREE' ? 'INACTIVE' : 'ACTIVE' } : u));
                alert(res.data.message);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Üyelik güncellenirken hata oluştu.');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="admin-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <style>{`
        .admin-container {
          min-height: 100vh;
          background-color: #0b0e14;
          color: white;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }
        .admin-header {
          margin-bottom: 2rem;
        }
        .admin-title {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }
        .admin-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1rem;
        }
        .admin-tab {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .admin-tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .admin-tab.active {
          color: white;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .metric-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        .metric-value {
          font-size: 2.25rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
        }
        .metric-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .data-table-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th, .data-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .data-table th {
          background: rgba(255, 255, 255, 0.01);
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .data-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-active { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .status-inactive { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .status-pro { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
        
        .promo-form {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          align-items: flex-end;
        }
        .form-group { display: flex; flex-direction: column; }
        .form-group label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
        }
        .form-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem;
          color: white;
          font-family: inherit;
        }
        .btn-primary {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: #059669; }
        .btn-toggle {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .btn-toggle:hover { background: rgba(255, 255, 255, 0.1); }
        .btn-action {
          padding: 0.25rem 0.5rem;
          font-size: 0.7rem;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
          margin-right: 0.3rem;
          transition: all 0.2s;
        }
        .btn-action:hover {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.3);
        }
        .btn-action.plus { color: #3b82f6; border-color: rgba(59, 130, 246, 0.3); }
        .btn-action.pro { color: #8b5cf6; border-color: rgba(139, 92, 246, 0.3); }
        .btn-action.free { color: #94a3b8; }
      `}</style>

            <div className="admin-header">
                <h1 className="admin-title">Yönetim Paneli</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>FinBot istatistikleri ve kontrolleri.</p>
            </div>

            <div className="admin-tabs">
                <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Özet & Kullanıcılar</button>
                <button className={`admin-tab ${activeTab === 'promos' ? 'active' : ''}`} onClick={() => setActiveTab('promos')}>Promosyon Kodları</button>
                <button className={`admin-tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>Satın Alımlar</button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {metrics && (
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <span className="metric-value">{metrics.totalUsers}</span>
                                <span className="metric-label">Toplam Kullanıcı</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">{metrics.activeUsersCount}</span>
                                <span className="metric-label">Aktif Abonelik (Plus+Pro)</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">{metrics.plusUsersCount}</span>
                                <span className="metric-label">Plus Kullanıcılar</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">{metrics.proUsersCount}</span>
                                <span className="metric-label">Pro Kullanıcılar</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">{metrics.totalQueries}</span>
                                <span className="metric-label">Toplam Sorulan Soru</span>
                            </div>
                        </div>
                    )}

                    <h3 style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>Tüm Kullanıcılar</h3>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>E-posta</th>
                                    <th>Giriş Tipi</th>
                                    <th>Kayıt Tarihi</th>
                                    <th>Plan</th>
                                    <th>Durum</th>
                                    <th>Soru Sayısı</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td>{u.email}</td>
                                        <td>{u.authType}</td>
                                        <td>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                                        <td>
                                            <span className={`status-badge ${u.subscriptionTier === 'PRO' ? 'status-pro' : u.subscriptionTier === 'PLUS' ? 'status-active' : ''}`}>
                                                {u.subscriptionTier || 'FREE'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${u.subscriptionStatus === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                                                {u.subscriptionStatus || 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td>{u.queryCount || 0}</td>
                                        <td>
                                            <div style={{ display: 'flex' }}>
                                                {u.subscriptionTier !== 'FREE' && (
                                                    <button className="btn-action free" onClick={() => handleUpdateSubscription(u._id, 'FREE')}>FREE yap</button>
                                                )}
                                                {u.subscriptionTier !== 'PLUS' && (
                                                    <button className="btn-action plus" onClick={() => handleUpdateSubscription(u._id, 'PLUS')}>PLUS ver</button>
                                                )}
                                                {u.subscriptionTier !== 'PRO' && (
                                                    <button className="btn-action pro" onClick={() => handleUpdateSubscription(u._id, 'PRO')}>PRO ver</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'promos' && (
                <>
                    <h3 style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>Yeni Promosyon Kodu Oluştur</h3>
                    <form className="promo-form" onSubmit={handleCreatePromo}>
                        <div className="form-group">
                            <label>Kod (Örn: YAZ100)</label>
                            <input type="text" className="form-input" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} required />
                        </div>
                        <div className="form-group">
                            <label>İndirim Oranı (%)</label>
                            <input type="number" className="form-input" min="1" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Kullanım Limiti (Boş=Sınırsız)</label>
                            <input type="number" className="form-input" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Son Geçerlilik (Boş=Süresiz)</label>
                            <input type="date" className="form-input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ alignItems: 'flex-start' }}>
                            <button type="submit" className="btn-primary">Oluştur</button>
                        </div>
                    </form>

                    <h3 style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>Mevcut Kodlar</h3>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Kod</th>
                                    <th>İndirim</th>
                                    <th>Kullanım</th>
                                    <th>Bitiş Tarihi</th>
                                    <th>Durum</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promos.map(p => (
                                    <tr key={p._id}>
                                        <td style={{ fontWeight: 'bold' }}>{p.code}</td>
                                        <td>% {p.discountPercent}</td>
                                        <td>{p.currentUses} {p.maxUses ? `/ ${p.maxUses}` : '(Sınırsız)'}</td>
                                        <td>{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('tr-TR') : 'Süresiz'}</td>
                                        <td>
                                            <span className={`status-badge ${p.isActive ? 'status-active' : 'status-inactive'}`}>
                                                {p.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-toggle" onClick={() => handleTogglePromo(p._id)}>
                                                {p.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {promos.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', opacity: 0.5 }}>Hiç promosyon kodu bulunmuyor.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'transactions' && (
                <>
                    <h3 style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>Satın Alım Geçmişi</h3>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Kullanıcı</th>
                                    <th>İşlem ID</th>
                                    <th>Plan & Tutar</th>
                                    <th>Durum</th>
                                    <th>Promosyon / İndirim</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t._id}>
                                        <td>{new Date(t.createdAt).toLocaleString('tr-TR')}</td>
                                        <td>{t.user?.email || 'Bilinmiyor'}</td>
                                        <td>{t.merchantPaymentId}</td>
                                        <td>{t.planType} ({t.amount} ₺)</td>
                                        <td>
                                            <span className={`status-badge ${t.status === 'SUCCESS' ? 'status-active' : t.status === 'PENDING' ? '' : 'status-inactive'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            {t.promoCode ? (
                                                <>
                                                    <strong style={{ color: '#10b981' }}>{t.promoCode.code}</strong> (-{t.discountAmount} ₺)
                                                </>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', opacity: 0.5 }}>İşlem bulunamadı.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
