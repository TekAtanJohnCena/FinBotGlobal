import React from 'react';

const RefundPolicy = () => {
    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: '#0b0c0f' }}>
            <div className="container">
                <div className="bg-white rounded-4 shadow p-4 p-md-5 mx-auto" style={{ maxWidth: '900px' }}>
                    <h1 className="text-primary fw-bold mb-4">İPTAL VE İADE KOŞULLARI</h1>
                    <p className="text-muted small mb-4">Son Güncelleme: 8 Şubat 2026</p>

                    <div className="space-y-4">
                        {/* Giriş */}
                        <section className="mb-4">
                            <p className="small">
                                Bu sayfa, finbot.com.tr ("FinBot") üzerinden satın alınan dijital abonelik hizmetlerine
                                ilişkin iptal ve iade politikasını açıklamaktadır.
                            </p>
                        </section>

                        {/* Dijital Ürün Niteliği */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">1. DİJİTAL HİZMET NİTELİĞİ</h2>
                            <div className="alert alert-info small" role="alert">
                                <i className="bi bi-info-circle me-2"></i>
                                FinBot, bir <strong>dijital yazılım hizmetidir</strong> (SaaS - Software as a Service).
                                Satın alınan abonelikler, ödemenin onaylanmasının ardından derhal hesabınıza tanımlanır
                                ve dijital içerik anında kullanıma açılır.
                            </div>
                        </section>

                        {/* Cayma Hakkı */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">2. CAYMA HAKKI İSTİSNASI</h2>
                            <div className="alert alert-warning small" role="alert">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                <strong>ÖNEMLİ UYARI:</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
                                ilgili Mesafeli Sözleşmeler Yönetmeliği uyarınca;
                            </div>
                            <p className="small">
                                <strong>"Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim
                                    edilen gayri maddi mallarda cayma hakkı kullanılamaz."</strong>
                            </p>
                            <p className="small">
                                FinBot abonelikleri, ödeme işleminin tamamlanmasıyla birlikte anında aktif edildiğinden,
                                <strong className="text-danger"> cayma hakkı ve iade talep hakkı bulunmamaktadır</strong>.
                            </p>
                        </section>

                        {/* İade Yapılmayan Durumlar */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">3. İADE YAPILAMAYACAK DURUMLAR</h2>
                            <ul className="small">
                                <li>Satın alınıp aktive edilen tüm abonelik paketleri (Free, Plus, Pro, Enterprise)</li>
                                <li>Kullanıma başlanmış veya hesaba tanımlanmış dijital hizmetler</li>
                                <li>Abonelik süresinin bir kısmı kullanıldıktan sonra yapılan iade talepleri</li>
                                <li>Kullanıcı hatası veya tercih değişikliği nedeniyle yapılan talepler</li>
                            </ul>
                        </section>

                        {/* İstisnai Durumlar */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">4. İSTİSNAİ DURUMLAR</h2>
                            <p className="small mb-2">Aşağıdaki durumlarda iade değerlendirmesi yapılabilir:</p>
                            <ul className="small">
                                <li><strong>Teknik Arıza:</strong> FinBot tarafından kaynaklanan ve 72 saat içinde çözülemeyen
                                    teknik sorunlar nedeniyle hizmetin kullanılamaması</li>
                                <li><strong>Mükerrer Ödeme:</strong> Aynı hizmet için hatalı olarak birden fazla ödeme alınması</li>
                                <li><strong>Yetkilendirme Hatası:</strong> Banka veya ödeme sistemi kaynaklı hatalı çekim</li>
                            </ul>
                            <p className="small text-muted">
                                Bu durumlarda <a href="mailto:destek@finbot.com.tr" className="text-primary">destek@finbot.com.tr</a>
                                adresine başvurarak işlem detaylarınızı (tarih, tutar, son 4 hane) iletmeniz gerekmektedir.
                            </p>
                        </section>

                        {/* Abonelik İptali */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">5. ABONELİK İPTALİ</h2>
                            <ul className="small">
                                <li><strong>5.1.</strong> Otomatik yenilenen aboneliklerde, bir sonraki dönem başlamadan en az
                                    24 saat önce iptal işlemi yapılmalıdır.</li>
                                <li><strong>5.2.</strong> İptal işlemi, Ayarlar &gt; Abonelik menüsünden veya destek ekibimize
                                    e-posta ile başvurarak gerçekleştirilebilir.</li>
                                <li><strong>5.3.</strong> İptal sonrası mevcut dönemin sonuna kadar hizmeti kullanmaya devam edebilirsiniz.</li>
                                <li><strong>5.4.</strong> İptal edilen dönemin kalan süresi için kısmi iade yapılmaz.</li>
                            </ul>
                        </section>

                        {/* Ödeme Güvenliği */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">6. ÖDEME GÜVENLİĞİ</h2>
                            <div className="bg-success bg-opacity-10 p-3 rounded small">
                                <i className="bi bi-shield-check text-success me-2"></i>
                                Tüm ödemeler, 256-bit SSL sertifikası ile şifrelenmiş <strong>Shopier</strong> ödeme altyapısı
                                üzerinden gerçekleşmektedir. Kredi kartı bilgileriniz FinBot tarafından saklanmaz ve
                                görüntülenmez. Ödeme işlemleri tamamen banka ve ödeme kuruluşu arasında gerçekleşir.
                            </div>
                        </section>

                        {/* Yasal Uyarı */}
                        <section className="mb-4">
                            <h2 className="h5 fw-semibold text-dark mb-3">7. YASAL UYARI</h2>
                            <p className="small text-muted fst-italic">
                                <i className="bi bi-info-circle me-1"></i>
                                FinBot, yatırım danışmanlığı hizmeti vermemektedir. Platformda sunulan veriler sadece
                                eğitim ve analiz amaçlıdır. Kullanıcılar, bu verilerle yapacakları yatırım kararlarından
                                kendileri sorumludur. FinBot, kullanıcıların yatırım işlemlerinden doğabilecek zararlardan
                                sorumlu tutulamaz.
                            </p>
                        </section>

                        {/* İletişim */}
                        <section className="bg-primary bg-opacity-10 p-4 rounded">
                            <h2 className="h5 fw-semibold text-primary mb-3">İLETİŞİM</h2>
                            <p className="small mb-2">İptal ve iade ile ilgili sorularınız için:</p>
                            <ul className="list-unstyled small mb-0">
                                <li><strong>E-posta:</strong> <a href="mailto:destek@finbot.com.tr" className="text-primary">destek@finbot.com.tr</a></li>
                                <li><strong>Firma:</strong> Emre Ercan - FinBot Yazılım ve Danışmanlık</li>
                                <li><strong>Adres:</strong> Adnan Kahveci Mah. Ayfer Sok. No:15, Beylikdüzü / İstanbul</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
