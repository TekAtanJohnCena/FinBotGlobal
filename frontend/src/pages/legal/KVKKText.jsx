import React from 'react';

const KVKKText = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg my-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">KVKK Aydınlatma Metni</h1>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <p>
          FinBot olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, Veri Sorumlusu sıfatıyla, kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz.
        </p>

        <section>
          <h3 className="text-lg font-bold mb-2">1. İşlenen Kişisel Verileriniz</h3>
          <p>Platformumuza üye olurken veya kullanırken şu verileriniz işlenebilir:</p>
          <ul className="list-disc list-inside ml-4 mt-2">
             <li><strong>Kimlik Bilgileri:</strong> Ad, Soyad.</li>
             <li><strong>İletişim Bilgileri:</strong> E-posta adresi.</li>
             <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, giriş-çıkış kayıtları, şifre bilgileri.</li>
             <li><strong>Kullanım Verileri:</strong> FinBot üzerinde sorguladığınız hisse senetleri ve analiz tercihleri (profil oluşturma amacıyla).</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2">2. Kişisel Verilerin İşlenme Amacı</h3>
          <p>Kişisel verileriniz; üyelik işlemlerinin gerçekleştirilmesi, finansal analiz hizmetlerinin sunulması, yasal yükümlülüklerin yerine getirilmesi ve hizmet kalitesinin artırılması amacıyla işlenmektedir.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2">3. Verilerin Aktarımı</h3>
          <p>Kişisel verileriniz, yasal zorunluluklar (örneğin savcılık talepleri) dışında üçüncü kişilerle paylaşılmamaktadır. Sunucularımız ve veritabanı sağlayıcılarımız veri güvenliği standartlarına uymaktadır.</p>
        </section>
        
        <section>
            <h3 className="text-lg font-bold mb-2">4. Haklarınız</h3>
            <p>KVKK’nın 11. maddesi gereği; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini talep etme haklarına sahipsiniz. Taleplerinizi <strong>destek@finbot.com</strong> adresine iletebilirsiniz.</p>
        </section>
      </div>
    </div>
  );
};

export default KVKKText;