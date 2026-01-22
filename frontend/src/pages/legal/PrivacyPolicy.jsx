import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg my-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Gizlilik Politikası</h1>

      <div className="space-y-5">
        <p>
          FinBot (“Biz”), kullanıcılarının gizliliğine saygı duyar. Bu Gizlilik Politikası, web sitemizi ziyaret ettiğinizde bilgilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
        </p>

        <section>
          <h2 className="text-xl font-semibold">Bilgi Toplama Yöntemleri</h2>
          <p className="mt-2">
            Sitemizi ziyaret ettiğinizde çerezler (cookies) aracılığıyla veya kayıt formlarını doldurmanız suretiyle bilgilerinizi topluyoruz. Toplanan bilgiler, size daha iyi bir finansal analiz deneyimi sunmak ve yapay zeka algoritmalarımızı kişiselleştirmek için kullanılır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Veri Güvenliği</h2>
          <p className="mt-2">
            Kullanıcı verileri SSL (Secure Socket Layer) teknolojisi ile şifrelenerek korunmaktadır. FinBot, finansal verilerinizi veya kredi kartı bilgilerinizi doğrudan veritabanında saklamaz; ödeme işlemleri lisanslı ödeme aracıları tarafından yönetilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Üçüncü Taraf Bağlantıları</h2>
          <p className="mt-2">
            Sitemiz, ABD Borsaları (Nasdaq, NYSE) veya diğer veri sağlayıcılarına ait linkler içerebilir. Bu sitelerin gizlilik uygulamalarından FinBot sorumlu değildir.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;