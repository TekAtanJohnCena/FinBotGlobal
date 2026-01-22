import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg my-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">FINBOT KULLANICI SÖZLEŞMESİ (TERMS OF SERVICE)</h1>
      <p className="text-sm text-gray-500 mb-4">Son Güncelleme Tarihi: 22 Ocak 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. TARAFLAR</h2>
          <p>
            İşbu Sözleşme, İstanbul, Türkiye adresinde mukim [Şirketinizin Tam Resmi Unvanı] ("FinBot" veya "Şirket") ile FinBot web sitesi, mobil uygulaması veya API hizmetlerine ("Platform") erişen kullanıcı ("Kullanıcı") arasında akdedilmiştir.
          </p>
        </section>

        <section className="bg-yellow-50 p-4 border-l-4 border-yellow-500 rounded">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">2. HİZMETİN NİTELİĞİ VE YAPAY ZEKA UYARISI</h2>
          <p className="mb-3">
            <strong>2.1. Hizmet:</strong> FinBot, yapay zeka teknolojilerini kullanarak finansal verileri analiz eden, özetleyen ve görselleştiren bir dijital asistandır.
          </p>
          <p>
            <strong>2.2. Yapay Zeka Doğası:</strong> Kullanıcı, FinBot tarafından sağlanan yanıtların "Büyük Dil Modelleri" (LLM) ve üretken yapay zeka algoritmaları tarafından oluşturulduğunu kabul eder. Yapay zeka, zaman zaman "halüsinasyon" görebilir, gerçek dışı veya modası geçmiş bilgiler üretebilir. FinBot, üretilen içeriklerin %100 doğruluğunu garanti etmez.
          </p>
        </section>

        <section className="bg-red-50 p-4 border-l-4 border-red-500 rounded">
          <h2 className="text-xl font-bold text-red-700 mb-2">3. YATIRIM TAVSİYESİ DEĞİLDİR (SORUMLULUK REDDİ)</h2>
          <p className="mb-3">
            <strong>3.1. Bilgi Amaçlıdır:</strong> Platform üzerindeki hiçbir veri, grafik, sohbet çıktısı veya rapor; Sermaye Piyasası Kurulu (SPK), SEC veya diğer finansal otoriteler kapsamında bir "Yatırım Danışmanlığı" veya "Yatırım Tavsiyesi" değildir.
          </p>
          <p>
            <strong>3.2. Kullanıcı Sorumluluğu:</strong> Finansal kararlar (alım-satım, tutma vb.) tamamen Kullanıcı'nın kendi inisiyatifindedir. Kullanıcı, FinBot'un sağladığı bilgilere dayanarak yaptığı işlemlerden doğabilecek maddi/manevi zararlardan Şirket'in sorumlu tutulamayacağını kabul eder.
          </p>
        </section>

        <section className="bg-purple-50 p-4 border-l-4 border-purple-500 rounded">
          <h2 className="text-xl font-semibold text-purple-800 mb-2">4. LİSANS VE VERİ KULLANIM HAKKI (AI EĞİTİMİ)</h2>
          <p className="mb-3">
            <strong>4.1. Hizmet İyileştirme:</strong> Kullanıcı; Platform üzerindeki sohbet botu ile gerçekleştirdiği yazışmaların, girdiği komutların (prompt) ve geri bildirimlerin; FinBot tarafından hizmet kalitesini artırmak, yapay zeka modellerini eğitmek (training/fine-tuning) ve algoritmaları geliştirmek amacıyla kullanılabileceğini kabul eder.
          </p>
          <p>
            <strong>4.2. Fikri Hak Devri:</strong> Kullanıcı, sisteme girdiği metin ve veriler üzerinde FinBot'a; dünya çapında, telifsiz, devredilebilir, alt lisanslanabilir ve süresiz bir kullanım, kopyalama, değiştirme, anonimleştirme ve türev çalışmalar üretme hakkı tanır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. ÜÇÜNCÜ TARAF VERİLERİ</h2>
          <p className="mb-2">
            <strong>5.1.</strong> FinBot, borsa verilerini Tiingo ve diğer sağlayıcılardan temin eder. Verilerde gecikmeler (örn: 15 dakika) olabilir.
          </p>
          <p>
            <strong>5.2.</strong> Kullanıcı, sunulan verileri yalnızca şahsi kullanımı için görüntüleyebilir; ticari amaçla satamaz, dağıtamaz veya "scraping" (veri kazıma) yapamaz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. ÜYELİK VE GÜVENLİK</h2>
          <p className="mb-2">
            <strong>6.1.</strong> Kullanıcı, 18 yaşından büyük olduğunu beyan eder.
          </p>
          <p>
            <strong>6.2.</strong> Hesap bilgileri ve şifre güvenliği Kullanıcı'nın sorumluluğundadır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. UYUŞMAZLIK ÇÖZÜMÜ</h2>
          <p>
            İşbu sözleşmeden doğacak ihtilaflarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. SORUMLULUK REDDİ</h2>
          <p>
            FinBot ve geliştiricileri, sitedeki içeriklerin kullanımından doğabilecek doğrudan veya dolaylı hiçbir zarardan (kar kaybı, veri kaybı veya iş kesintisi dahil ancak bunlarla sınırlı olmamak üzere) sorumlu tutulamaz. Kullanıcı, finansal kararlarını kendi özgür iradesiyle alır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. DEĞİŞİKLİKLER</h2>
          <p>
            FinBot, bu kullanım şartlarını dilediği zaman önceden bildirmeksizin değiştirme hakkını saklı tutar. Değişiklikler bu sayfada yayınlandığı tarihten itibaren geçerlidir.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfUse;