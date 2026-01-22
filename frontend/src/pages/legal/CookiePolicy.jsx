import React from 'react';

const CookiePolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg my-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Çerez (Cookie) Politikası</h1>
      
      <div className="space-y-5 text-sm">
        <p>
          FinBot olarak, deneyiminizi iyileştirmek için çerezler kullanıyoruz. Çerezler, tarayıcınız tarafından bilgisayarınızda saklanan küçük metin dosyalardır.
        </p>

        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 mt-4">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">Çerez Türü</th>
                        <th className="py-2 px-4 border-b text-left">Açıklama</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-2 px-4 border-b font-semibold">Zorunlu Çerezler</td>
                        <td className="py-2 px-4 border-b">Web sitesinin çalışması ve oturum açma işlemleri için gereklidir. Kapatılamaz.</td>
                    </tr>
                    <tr>
                        <td className="py-2 px-4 border-b font-semibold">Analitik Çerezler</td>
                        <td className="py-2 px-4 border-b">Hangi analiz araçlarının daha çok kullanıldığını anlamamızı sağlar (Google Analytics vb.).</td>
                    </tr>
                    <tr>
                        <td className="py-2 px-4 border-b font-semibold">Fonksiyonel Çerezler</td>
                        <td className="py-2 px-4 border-b">Kullanıcı tercihlerinizi (örneğin takip ettiğiniz hisse listesi) hatırlamak için kullanılır.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p className="mt-4">
          Tarayıcı ayarlarınızdan çerezleri dilediğiniz zaman silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezlerin engellenmesi FinBot'un çalışmasını etkileyebilir.
        </p>
      </div>
    </div>
  );
};

export default CookiePolicy;