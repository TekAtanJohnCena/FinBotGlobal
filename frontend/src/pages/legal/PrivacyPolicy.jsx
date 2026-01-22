import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg my-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">GİZLİLİK POLİTİKASI VE AYDINLATMA METNİ (PRIVACY POLICY)</h1>
      <p className="text-sm text-gray-500 mb-4">Son Güncelleme Tarihi: 22 Ocak 2026</p>

      <p className="mb-6">
        [Şirketinizin Tam Resmi Unvanı] ("FinBot") olarak, kişisel verilerinizin güvenliğine ve gizliliğine önem veriyoruz. Bu politika, verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-blue-800">1. TOPLANAN VERİLER</h2>
          <p className="mb-2">Hizmetlerimizi kullandığınızda aşağıdaki verileri toplayabiliriz:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Kimlik ve İletişim Verileri:</strong> Ad, soyad, e-posta adresi (Google/LinkedIn Login ile alınan bilgiler dahil).
            </li>
            <li>
              <strong>Kullanım ve Sohbet Verileri:</strong> FinBot asistanı ile yaptığınız tüm yazışmalar, sorduğunuz sorular (promptlar), finansal ilgi alanlarınız ve izleme listeleriniz.
            </li>
            <li>
              <strong>Teknik Veriler:</strong> IP adresi, cihaz bilgisi, tarayıcı türü, çerezler (cookies) ve log kayıtları.
            </li>
          </ul>
        </section>

        <section className="bg-blue-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3 text-blue-800">2. VERİLERİN İŞLENME AMACI</h2>
          <p className="mb-2">Verilerinizi şu amaçlarla işliyoruz:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Hizmeti sunmak, hesap oluşturmak ve teknik destek sağlamak.</li>
            <li>Yasal yükümlülükleri yerine getirmek (log tutma vb.).</li>
          </ul>
          <div className="mt-4 bg-yellow-100 p-3 rounded border-l-4 border-yellow-500">
            <p className="font-semibold text-yellow-900">ÖNEMLİ: Yapay Zeka Geliştirme</p>
            <p className="text-sm mt-1">
              Sohbet geçmişinizi ve kullanım alışkanlıklarınızı, kimlik bilgilerinizden arındırarak (anonimleştirerek), yapay zeka modellerimizin doğruluğunu artırmak ve algoritmayı eğitmek amacıyla kullanıyoruz.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-blue-800">3. VERİ PAYLAŞIMI VE YURT DIŞINA AKTARIM</h2>
          <p className="mb-2">
            <strong>3.1.</strong> FinBot, teknik altyapı (sunucu/hosting) hizmetini Amazon Web Services (AWS) veya benzeri küresel sağlayıcılardan alabilir. Bu nedenle verileriniz, güvenli şifreleme yöntemleriyle yurt dışındaki sunucularda saklanabilir.
          </p>
          <p>
            <strong>3.2.</strong> Verileriniz, yasal zorunluluklar haricinde, izniniz olmaksızın pazarlama amacıyla üçüncü şahıslara satılmaz.
          </p>
        </section>

        <section className="bg-purple-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3 text-purple-800">4. SOHBET VERİLERİNİN ANONİMLEŞTİRİLMESİ</h2>
          <p>
            Yapay zeka eğitiminde kullanılan sohbet verileri, "Kişisel Veri" niteliğinden çıkarılarak anonim hale getirilir. Örneğin, "Ahmet Yılmaz olarak Apple hissesi almalı mıyım?" sorusu, eğitim setine "Kullanıcı, teknoloji hissesi analizi sordu" şeklinde istatistiksel veri olarak girebilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-blue-800">5. KULLANICI HAKLARI (KVKK / GDPR)</h2>
          <p className="mb-2">Kullanıcı olarak şu haklara sahipsiniz:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
            <li>Verilerinizin silinmesini veya yok edilmesini talep etme ("Unutulma Hakkı"),</li>
            <li>Verilerinizin düzeltilmesini isteme.</li>
          </ul>
          <p className="mt-3">
            Bu haklarınızı kullanmak için <a href="mailto:iletisim@finbot.com" className="text-blue-600 underline">iletisim@finbot.com</a> adresine e-posta gönderebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-blue-800">6. ÇEREZLER (COOKIES)</h2>
          <p>
            Hizmetimizi iyileştirmek için çerez kullanıyoruz. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz. Çerezler hakkında daha fazla bilgi için{' '}
            <a href="/legal/cookies" className="text-blue-600 underline">Çerez Politikası</a> sayfamızı ziyaret edebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-blue-800">7. VERİ GÜVENLİĞİ</h2>
          <p>
            Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz. Ancak, internet üzerinden iletilen hiçbir verinin %100 güvenli olduğunu garanti edemeyiz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-blue-800">8. ÇOCUKLARIN GİZLİLİĞİ</h2>
          <p>
            Hizmetimiz 18 yaşın altındaki kişilere yönelik değildir. 18 yaşından küçük birinden bilerek kişisel bilgi toplamıyoruz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-blue-800">9. POLİTİKA DEĞİŞİKLİKLERİ</h2>
          <p>
            Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Değişiklikler bu sayfada yayınlandığı tarihten itibaren geçerli olacaktır. Önemli değişiklikler için e-posta yoluyla bilgilendirileceksiniz.
          </p>
        </section>

        <section className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">10. İLETİŞİM</h2>
          <p className="mb-2">Gizlilik politikamız hakkında sorularınız varsa, bizimle iletişime geçebilirsiniz:</p>
          <ul className="space-y-1 ml-4">
            <li><strong>E-posta:</strong> <a href="mailto:iletisim@finbot.com" className="text-blue-600 underline">iletisim@finbot.com</a></li>
            <li><strong>Adres:</strong> İstanbul, Türkiye</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;