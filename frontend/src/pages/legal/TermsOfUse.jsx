import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg my-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Kullanım Şartları</h1>
      <p className="text-sm text-gray-500 mb-4">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Giriş</h2>
          <p>
            Bu web sitesini (FinBot) kullanarak, aşağıda belirtilen kullanım şartlarını, tüm yasaları ve düzenlemeleri kabul etmiş sayılırsınız. Eğer bu şartlardan herhangi birini kabul etmiyorsanız, siteyi kullanmamanız gerekmektedir.
          </p>
        </section>

        <section className="bg-red-50 p-4 border-l-4 border-red-500 rounded">
          <h2 className="text-xl font-bold text-red-700 mb-2">2. Yasal Uyarı ve Yatırım Tavsiyesi Feragatnamesi</h2>
          <p className="font-medium">
            FinBot bir yatırım danışmanlığı hizmeti <u>değildir</u>.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Burada yer alan yatırım bilgi, yorum ve tavsiyeleri <strong>Yatırım Danışmanlığı kapsamında değildir.</strong></li>
            <li>Yatırım danışmanlığı hizmeti; aracı kurumlar, portföy yönetim şirketleri, mevduat kabul etmeyen bankalar ile müşteri arasında imzalanacak yatırım danışmanlığı sözleşmesi çerçevesinde sunulmaktadır.</li>
            <li>FinBot tarafından sunulan veriler, yapay zeka destekli teknik ve temel analiz çıktılarıdır ve sadece bilgi verme amacı taşır.</li>
            <li>Bu sayfalarda yer alan görüşler mali durumunuz ile risk ve getiri tercihlerinize uygun olmayabilir. Bu nedenle, sadece burada yer alan bilgilere dayanılarak yatırım kararı verilmesi beklentilerinize uygun sonuçlar doğurmayabilir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Hizmetin Kapsamı</h2>
          <p>
            FinBot, borsalardaki finansal verileri sadeleştirir, şirket bilançolarını yorumlar ve kullanıcıya anlaşılır, karşılaştırmalı analizler sunar. Ancak FinBot, sunulan verilerin %100 doğruluğunu, güncelliğini veya eksiksizliğini garanti etmez. Veri sağlayıcılarından kaynaklı gecikmeler veya hatalar olabilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Sorumluluk Reddi</h2>
          <p>
            FinBot ve geliştiricileri, sitedeki içeriklerin kullanımından doğabilecek doğrudan veya dolaylı hiçbir zarardan (kar kaybı, veri kaybı veya iş kesintisi dahil ancak bunlarla sınırlı olmamak üzere) sorumlu tutulamaz. Kullanıcı, finansal kararlarını kendi özgür iradesiyle alır.
          </p>
        </section>
        
        <section>
            <h2 className="text-xl font-semibold mb-2">5. Değişiklikler</h2>
            <p>FinBot, bu kullanım şartlarını dilediği zaman önceden bildirmeksizin değiştirme hakkını saklı tutar.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfUse;