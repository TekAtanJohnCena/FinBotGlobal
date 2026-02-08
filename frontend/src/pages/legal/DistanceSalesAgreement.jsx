import React from 'react';

const DistanceSalesAgreement = () => {
    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: '#0b0c0f' }}>
            <div className="container">
                <div className="bg-white rounded-4 shadow p-4 p-md-5 mx-auto" style={{ maxWidth: '900px' }}>
                    <h1 className="text-primary fw-bold mb-4">MESAFELİ SATIŞ SÖZLEŞMESİ</h1>
                    <p className="text-muted small mb-4">Son Güncelleme: 8 Şubat 2026</p>

                    <div className="space-y-4">
                        {/* MADDE 1 - TARAFLAR */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">MADDE 1 - TARAFLAR</h2>

                            <div className="bg-light p-3 rounded mb-3">
                                <h3 className="h6 fw-semibold text-dark mb-2">1.1. SATICI</h3>
                                <ul className="list-unstyled mb-0 small">
                                    <li><strong>Ünvan:</strong> Emre Ercan - FinBot Yazılım ve Danışmanlık</li>
                                    <li><strong>Adres:</strong> Adnan Kahveci Mah. Ayfer Sok. No:15, Beylikdüzü / İstanbul</li>
                                    <li><strong>Vergi Dairesi:</strong> Büyükçekmece V.D.</li>
                                    <li><strong>E-posta:</strong> destek@finbot.com.tr</li>
                                    <li><strong>Web Sitesi:</strong> finbot.com.tr</li>
                                </ul>
                            </div>

                            <div className="bg-light p-3 rounded">
                                <h3 className="h6 fw-semibold text-dark mb-2">1.2. ALICI</h3>
                                <p className="mb-0 small text-muted">
                                    finbot.com.tr web sitesi üzerinden üyelik işlemini tamamlayan ve dijital hizmet satın alan kullanıcı ("Alıcı" veya "Kullanıcı").
                                </p>
                            </div>
                        </section>

                        {/* MADDE 2 - KONU */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">MADDE 2 - KONU</h2>
                            <p className="small">
                                İşbu Sözleşme, Satıcı'nın Alıcı'ya sunduğu <strong>dijital yazılım hizmeti</strong> (FinBot
                                yapay zeka destekli finansal veri analiz ve raporlama platformu abonelik paketleri)
                                satışına ilişkin tarafların hak ve yükümlülüklerini düzenler.
                            </p>
                        </section>

                        {/* MADDE 3 - HİZMETİN NİTELİĞİ */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">MADDE 3 - HİZMETİN NİTELİĞİ</h2>
                            <p className="small mb-2">Satışa konu hizmet aşağıdaki özelliklere sahiptir:</p>
                            <ul className="small">
                                <li><strong>Hizmet Türü:</strong> Dijital Yazılım Hizmeti (SaaS - Software as a Service)</li>
                                <li><strong>Hizmet Adı:</strong> FinBot Finansal Veri Analiz Platformu</li>
                                <li><strong>Erişim Yöntemi:</strong> Web tarayıcısı üzerinden çevrimiçi erişim</li>
                                <li><strong>Abonelik Tipleri:</strong> Free, Plus, Pro, Enterprise</li>
                            </ul>
                            <div className="alert alert-warning small" role="alert">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                <strong>ÖNEMLİ:</strong> FinBot, yatırım danışmanlığı hizmeti vermemekte olup, sunulan veriler
                                sadece eğitim ve analiz amaçlıdır. Kullanıcı, yatırım kararlarını kendi sorumluluğunda alır.
                            </div>
                        </section>

                        {/* MADDE 4 - FİYAT VE ÖDEME */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">MADDE 4 - FİYAT VE ÖDEME KOŞULLARI</h2>
                            <ul className="small">
                                <li><strong>4.1.</strong> Hizmet bedelleri, satın alma anında web sitesinde belirtilen fiyatlar üzerinden Türk Lirası (TL) cinsinden belirlenir.</li>
                                <li><strong>4.2.</strong> Ödemeler, Shopier ödeme sistemi altyapısı üzerinden kredi kartı/banka kartı ile gerçekleştirilir.</li>
                                <li><strong>4.3.</strong> Tüm ödemeler 256-bit SSL sertifikası ile şifrelenmiş güvenli bağlantı üzerinden alınır.</li>
                                <li><strong>4.4.</strong> Alıcı'nın kredi kartı bilgileri Satıcı tarafından saklanmaz; bu bilgiler doğrudan ödeme kuruluşu tarafından işlenir.</li>
                            </ul>
                        </section>

                        {/* MADDE 5 - TESLİMAT */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">MADDE 5 - TESLİMAT</h2>
                            <p className="small mb-2">
                                <strong>5.1.</strong> Satın alınan dijital hizmet, ödemenin onaylanmasının ardından derhal (anlık olarak)
                                Alıcı'nın hesabına tanımlanır ve kullanıma açılır.
                            </p>
                            <p className="small">
                                <strong>5.2.</strong> Fiziksel teslimat söz konusu değildir. Hizmete erişim, web sitesi üzerinden
                                kullanıcı hesabı ile gerçekleştirilir.
                            </p>
                        </section>

                        {/* MADDE 6 - CAYMA HAKKI */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">MADDE 6 - CAYMA HAKKI</h2>
                            <div className="alert alert-danger small" role="alert">
                                <i className="bi bi-x-circle me-2"></i>
                                <strong>6.1. DİJİTAL HİZMET İSTİSNASI:</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun'un
                                15. maddesi ve Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca; elektronik ortamda anında
                                ifa edilen hizmetler veya tüketiciye anında teslim edilen gayri maddi mallarda (dijital içerik)
                                <strong> cayma hakkı kullanılamaz</strong>.
                            </div>
                            <p className="small">
                                <strong>6.2.</strong> Alıcı, ödeme işlemini tamamlamadan önce bu hükümden haberdar olduğunu
                                ve kabul ettiğini beyan eder.
                            </p>
                        </section>

                        {/* MADDE 7 */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">MADDE 7 - GENEL HÜKÜMLER</h2>
                            <ul className="small">
                                <li><strong>7.1.</strong> İşbu Sözleşme, Alıcı'nın ödeme işlemini tamamlaması ile birlikte yürürlüğe girer.</li>
                                <li><strong>7.2.</strong> Taraflar arasındaki uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.</li>
                                <li><strong>7.3.</strong> Sözleşme'nin herhangi bir hükmünün geçersiz sayılması, diğer hükümlerini geçersiz kılmaz.</li>
                            </ul>
                        </section>

                        {/* İletişim */}
                        <section className="bg-primary bg-opacity-10 p-4 rounded">
                            <h2 className="h5 fw-semibold text-primary mb-3">İLETİŞİM</h2>
                            <p className="small mb-2">Sözleşme ile ilgili sorularınız için:</p>
                            <ul className="list-unstyled small mb-0">
                                <li><strong>E-posta:</strong> <a href="mailto:destek@finbot.com.tr" className="text-primary">destek@finbot.com.tr</a></li>
                                <li><strong>Adres:</strong> Adnan Kahveci Mah. Ayfer Sok. No:15, Beylikdüzü / İstanbul</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DistanceSalesAgreement;
